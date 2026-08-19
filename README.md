# website

## Add Gallery Images

The gallery uses checked-in images in `images/` and same-site public paths in `gallery/gallery.json`. Its object keys become the gallery categories.

1. Open `gallery/gallery.json`.
2. Add the image to the matching `images/<category>/` folder.
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

The image paths are public wherever this repository is deployed, for example `images/birthdays/pic2.jpg`.
