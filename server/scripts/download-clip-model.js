/**
 * Download CLIP ONNX weights for image moderation (resumable).
 * Run: node scripts/download-clip-model.js
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const OUT_DIR = path.join(
  __dirname,
  '..',
  '.cache',
  'transformers',
  'Xenova',
  'clip-vit-base-patch32',
  'onnx'
);
const OUT_FILE = path.join(OUT_DIR, 'model_quantized.onnx');
const URL =
  'https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/main/onnx/model_quantized.onnx';
// Expected size from Hugging Face (~146.5 MiB)
const MIN_BYTES = 140 * 1024 * 1024;

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(OUT_FILE) && fs.statSync(OUT_FILE).size >= MIN_BYTES) {
    console.log('[Download] CLIP already complete:', (fs.statSync(OUT_FILE).size / 1e6).toFixed(1), 'MB');
    return;
  }
  if (fs.existsSync(OUT_FILE) && fs.statSync(OUT_FILE).size < MIN_BYTES) {
    console.log('[Download] Removing incomplete file…');
    fs.unlinkSync(OUT_FILE);
  }
  console.log('[Download] Fetching CLIP model (~147MB). This may take a while…');
  console.log('[Download]', URL);
  const result = spawnSync(
    'curl.exe',
    ['-L', '--retry', '5', '--retry-delay', '3', '--retry-all-errors', '-C', '-', '-o', OUT_FILE, URL],
    { stdio: 'inherit', shell: false }
  );
  if (result.status !== 0 || !fs.existsSync(OUT_FILE) || fs.statSync(OUT_FILE).size < MIN_BYTES) {
    console.error('[Download] Failed or incomplete. Re-run this script to resume.');
    process.exit(1);
  }
  console.log('[Download] Done:', (fs.statSync(OUT_FILE).size / 1e6).toFixed(1), 'MB');
}

main();
