# website

## Add Gallery Images

Use the public-image importer so the normal gallery source remains one JSON file.

1. Open `gallery/gallery.json`.
2. Add direct public image URLs under the appropriate category.
3. Save the file.
4. Run:

```sh
node gallery/fetch-images.js
```

5. Refresh the website.

Example:

```json
{
	"weddings": [
		"https://example.com/wedding1.jpg",
		"https://example.com/wedding2.webp"
	],
	"engagements": [],
	"birthdays": [],
	"decorations": [],
	"tents": [],
	"lighting": [],
	"other": []
}
```

`gallery.json` is intentionally plain JSON. JSON does not support comments, so keep explanations in this README instead of adding comments to that file.

Only direct public HTTP/HTTPS image URLs are supported. Website pages, Google Drive share links, Google Photos pages, Instagram pages, and other non-image URLs are rejected. Supported image formats are JPG, JPEG, PNG, WebP, and AVIF. Categories map to `images/weddings`, `images/engagements`, `images/birthdays`, `images/decorations`, `images/tents`, `images/lighting`, and `images/other`.

The downloader chooses a safe unused `picN` filename and never overwrites existing photographs. Duplicate URLs are skipped using `gallery/.downloads.json`, which is generated metadata and should not be edited normally. Failed downloads are printed clearly and make the command exit with a non-zero status after processing the remaining URLs.

The script also refreshes the generated `files` fallback in `js/site-config.js`, so the gallery can work on static hosts that do not expose directory listings. Real Srinivasa Tent House photographs should replace temporary reference images.

For validation without downloading, run:

```sh
node gallery/fetch-images.js --dry-run
```

The optional `--file path/to/test-gallery.json` argument is useful for validating a temporary JSON fixture.
