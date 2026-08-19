# website

## Add Gallery Images

The gallery uses one file only: `gallery/gallery.json`. Its object keys become the gallery categories, and each array contains public image URLs.

1. Open `gallery/gallery.json`.
2. Add direct public image URLs under the appropriate category.
3. Save the file.
4. Refresh the website.

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

Only public image URLs are supported. Categories are defined by the JSON keys, so you can add a new category without creating a folder or editing JavaScript. Real Srinivasa Tent House photographs should replace temporary reference images.
