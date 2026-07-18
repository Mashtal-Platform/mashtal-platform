const path = require('path');
const fs = require('fs');
const { moderateContent } = require('../services/moderationService');

const SAFE_MESSAGE =
  "Unable to publish. This content doesn’t meet Mashtal’s community guidelines. Please revise it and try again.";

const UNAVAILABLE_MESSAGE =
  'We couldn’t complete the safety check right now. Please try again in a moment.';

class ContentNotAllowedError extends Error {
  constructor(message = SAFE_MESSAGE, code = 'CONTENT_NOT_ALLOWED') {
    super(message);
    this.name = 'ContentNotAllowedError';
    this.code = code;
    this.status = code === 'MODERATION_UNAVAILABLE' ? 503 : 422;
  }
}

/**
 * Absolute path for a multer disk file under public/images/...
 */
function absolutePathFromMulterFile(file) {
  if (!file) return null;
  if (file.path && fs.existsSync(file.path)) return file.path;
  return null;
}

/**
 * Delete a just-uploaded file if moderation rejects it.
 */
function deleteUploadedFile(file) {
  if (!file) return;
  const abs = absolutePathFromMulterFile(file);
  if (abs) {
    try {
      fs.unlinkSync(abs);
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * Assert content is safe. Throws ContentNotAllowedError if not.
 *
 * @param {{ text?: string|string[], imagePath?: string, imageAbsolutePath?: string, file?: Express.Multer.File }} opts
 */
async function assertContentSafe(opts = {}) {
  const imageAbsolutePath =
    opts.imageAbsolutePath || absolutePathFromMulterFile(opts.file) || undefined;

  const result = await moderateContent({
    text: opts.text,
    imagePath: opts.imagePath,
    imageAbsolutePath,
    imageBuffer: opts.imageBuffer,
    mimeType: opts.mimeType || opts.file?.mimetype,
    file: opts.file,
  });

  if (result.allowed) return result;

  if (opts.file) deleteUploadedFile(opts.file);

  if (result.reason === 'unavailable') {
    throw new ContentNotAllowedError(UNAVAILABLE_MESSAGE, 'MODERATION_UNAVAILABLE');
  }

  throw new ContentNotAllowedError(SAFE_MESSAGE, 'CONTENT_NOT_ALLOWED');
}

/**
 * Express-friendly: run assertContentSafe and send error response if rejected.
 * @returns {Promise<boolean>} true if allowed, false if response already sent
 */
async function respondIfUnsafe(res, opts) {
  try {
    await assertContentSafe(opts);
    return true;
  } catch (err) {
    if (err instanceof ContentNotAllowedError || err?.code === 'CONTENT_NOT_ALLOWED' || err?.code === 'MODERATION_UNAVAILABLE') {
      res.status(err.status || 422).json({
        error: err.code || 'CONTENT_NOT_ALLOWED',
        message: err.message || SAFE_MESSAGE,
      });
      return false;
    }
    throw err;
  }
}

module.exports = {
  assertContentSafe,
  respondIfUnsafe,
  ContentNotAllowedError,
  SAFE_MESSAGE,
  deleteUploadedFile,
};
