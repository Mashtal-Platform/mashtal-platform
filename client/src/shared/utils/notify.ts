import { toast } from 'sonner';

/** User-facing copy when moderation rejects content */
export const CONTENT_BLOCKED_TITLE = 'Unable to publish';
export const CONTENT_BLOCKED_DESCRIPTION =
  'This content doesn’t meet Mashtal’s community guidelines. Please revise it and try again.';

const BLOCKED_HINTS = [
  'safety guidelines',
  'community guidelines',
  'content_not_allowed',
  'content not allowed',
  "can't be published",
  'cannot be published',
  'couldn’t be published',
  "couldn't be published",
  'violates',
  'moderation',
];

export function isContentBlockedError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  return BLOCKED_HINTS.some((h) => msg.includes(h));
}

/** Professional toast for moderation (and generic API) errors */
export function notifyError(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (isContentBlockedError(err)) {
    toast.error(CONTENT_BLOCKED_TITLE, {
      description: CONTENT_BLOCKED_DESCRIPTION,
    });
    return;
  }
  const message = err instanceof Error ? err.message : fallback;
  toast.error(message);
}

export function notifyContentBlocked() {
  toast.error(CONTENT_BLOCKED_TITLE, {
    description: CONTENT_BLOCKED_DESCRIPTION,
  });
}
