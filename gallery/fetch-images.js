const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const galleryArgumentIndex = process.argv.indexOf('--file');
const GALLERY_JSON_PATH = galleryArgumentIndex >= 0 && process.argv[galleryArgumentIndex + 1]
  ? path.resolve(process.argv[galleryArgumentIndex + 1])
  : path.join(__dirname, 'gallery.json');
const DOWNLOADS_PATH = path.join(__dirname, '.downloads.json');
const SITE_CONFIG_PATH = path.join(ROOT, 'js', 'site-config.js');
const IMAGES_ROOT = path.join(ROOT, 'images');
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const CATEGORY_FOLDERS = {
  weddings: 'weddings',
  engagements: 'engagements',
  birthdays: 'birthdays',
  decorations: 'decorations',
  tents: 'tents',
  lighting: 'lighting',
  other: 'other'
};
const isDryRun = process.argv.includes('--dry-run');

function fail(message) {
  throw new Error(message);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Could not read valid ${label}: ${error.message}`);
  }
}

function readDownloads() {
  if (!fs.existsSync(DOWNLOADS_PATH)) return {};
  const data = readJson(DOWNLOADS_PATH, 'gallery/.downloads.json');
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('gallery/.downloads.json must contain an object.');
  return data;
}

function validateGallery(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('gallery.json must contain an object of category arrays.');
  const expected = new Set(Object.keys(CATEGORY_FOLDERS));
  const actual = new Set(Object.keys(data));
  for (const category of actual) {
    if (!expected.has(category)) fail(`Unknown gallery category "${category}". Use: ${[...expected].join(', ')}.`);
  }
  for (const category of expected) {
    if (!Array.isArray(data[category])) fail(`Category "${category}" must be an array of direct image URLs.`);
    for (const source of data[category]) {
      if (typeof source !== 'string' || !/^https?:\/\//i.test(source)) fail(`Invalid URL in "${category}": ${source}`);
      let parsed;
      try { parsed = new URL(source); } catch { fail(`Invalid URL in "${category}": ${source}`); }
      if (!['http:', 'https:'].includes(parsed.protocol)) fail(`Only HTTP and HTTPS URLs are allowed: ${source}`);
    }
  }
}

function extensionFromUrl(sourceUrl) {
  const extension = path.extname(new URL(sourceUrl).pathname).slice(1).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension) ? extension : '';
}

function chooseExtension(sourceUrl, detectedExtension) {
  const urlExtension = extensionFromUrl(sourceUrl);
  const jpegMatch = ['jpg', 'jpeg'].includes(urlExtension) && ['jpg', 'jpeg'].includes(detectedExtension);
  return urlExtension === detectedExtension || jpegMatch ? urlExtension : detectedExtension;
}

function detectImage(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'webp';
  if (buffer.subarray(4, 12).toString() === 'ftypavif' || buffer.subarray(4, 12).toString() === 'ftypavis') return 'avif';
  return '';
}

function requestImage(sourceUrl, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(sourceUrl);
    const transport = parsed.protocol === 'https:' ? https : http;
    const request = transport.get(parsed, { headers: { Accept: 'image/jpeg,image/png,image/webp,image/avif;q=0.9,*/*;q=0.1' } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        if (redirectCount >= MAX_REDIRECTS || !response.headers.location) return reject(new Error('Too many redirects or missing redirect target.'));
        let nextUrl;
        try { nextUrl = new URL(response.headers.location, parsed).toString(); } catch { return reject(new Error('Invalid redirect target.')); }
        if (!['http:', 'https:'].includes(new URL(nextUrl).protocol)) return reject(new Error('Redirected to a non-HTTP(S) URL.'));
        return resolve(requestImage(nextUrl, redirectCount + 1));
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        return reject(new Error(`HTTP ${response.statusCode || 'unknown'} response.`));
      }
      const chunks = [];
      let total = 0;
      response.on('data', (chunk) => {
        total += chunk.length;
        if (total > MAX_IMAGE_BYTES) {
          request.destroy(new Error(`Image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`));
        } else {
          chunks.push(chunk);
        }
      });
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const detectedExtension = detectImage(buffer);
        if (!detectedExtension) return reject(new Error('URL did not return a supported direct image.'));
        const extension = chooseExtension(sourceUrl, detectedExtension);
        resolve({ buffer, extension, finalUrl: sourceUrl });
      });
      response.on('error', reject);
    });
    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy(new Error('Request timed out.')));
    request.on('error', reject);
  });
}

function nextImagePath(folderPath) {
  const usedNumbers = new Set();
  if (fs.existsSync(folderPath)) {
    for (const file of fs.readdirSync(folderPath)) {
      const match = file.match(/^pic(\d+)\.(jpg|jpeg|png|webp|avif)$/i);
      if (match) usedNumbers.add(Number(match[1]));
    }
  }
  let number = 1;
  while (usedNumbers.has(number)) number += 1;
  return { number, fileName: `pic${number}` };
}

function updateSiteConfigFiles() {
  if (!fs.existsSync(SITE_CONFIG_PATH)) return;
  let source = fs.readFileSync(SITE_CONFIG_PATH, 'utf8');
  for (const [category, folder] of Object.entries(CATEGORY_FOLDERS)) {
    const folderPath = path.join(IMAGES_ROOT, folder);
    const files = fs.existsSync(folderPath)
      ? fs.readdirSync(folderPath).filter((file) => /^pic\d+\.(jpg|jpeg|png|webp|avif)$/i.test(file)).sort((first, second) => Number(first.match(/\d+/)[0]) - Number(second.match(/\d+/)[0]))
      : [];
    const linePattern = new RegExp(`(category:\\s*'${category === 'tents' ? 'tent-setup' : category === 'other' ? 'other-functions' : category}'[^\n]*files:\\s*)\\[[^\\]]*\\]`);
    source = source.replace(linePattern, `$1[${files.map((file) => `'${file}'`).join(', ')}]`);
  }
  fs.writeFileSync(SITE_CONFIG_PATH, source);
}

async function main() {
  const gallery = readJson(GALLERY_JSON_PATH, 'gallery/gallery.json');
  validateGallery(gallery);
  const downloads = readDownloads();
  const seenUrls = new Set();
  const failures = [];
  let downloaded = 0;
  let skipped = 0;

  for (const [category, sources] of Object.entries(gallery)) {
    const folderPath = path.join(IMAGES_ROOT, CATEGORY_FOLDERS[category]);
    fs.mkdirSync(folderPath, { recursive: true });
    for (const source of sources) {
      if (seenUrls.has(source)) {
        console.log(`[skip] duplicate URL in this run: ${source}`);
        skipped += 1;
        continue;
      }
      seenUrls.add(source);
      const previous = downloads[source];
      if (previous && previous.localFile && fs.existsSync(path.join(ROOT, previous.localFile))) {
        console.log(`[skip] already downloaded: ${source} -> ${previous.localFile}`);
        skipped += 1;
        continue;
      }
      if (isDryRun) {
        console.log(`[check] would download ${source} into images/${CATEGORY_FOLDERS[category]}/`);
        continue;
      }
      try {
        console.log(`[download] ${source}`);
        const result = await requestImage(source);
        const allocation = nextImagePath(folderPath);
        const relativeFile = path.posix.join('images', CATEGORY_FOLDERS[category], `${allocation.fileName}.${result.extension}`);
        const absoluteFile = path.join(ROOT, relativeFile);
        fs.writeFileSync(absoluteFile, result.buffer, { flag: 'wx' });
        downloads[source] = { localFile: relativeFile, downloadedAt: new Date().toISOString() };
        downloaded += 1;
        console.log(`         -> ${relativeFile}`);
      } catch (error) {
        failures.push(`${category}: ${source} (${error.message})`);
        console.error(`[failed] ${source}: ${error.message}`);
      }
    }
  }

  if (!isDryRun) {
    fs.writeFileSync(DOWNLOADS_PATH, `${JSON.stringify(downloads, null, 2)}\n`);
    updateSiteConfigFiles();
  }
  console.log(`\nComplete: ${downloaded} downloaded, ${skipped} skipped, ${failures.length} failed.`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exitCode = 1;
});
