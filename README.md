# website

## Add Gallery Images

The gallery uses checked-in images in `images/` and public GitHub raw URLs in `gallery/gallery.json`. Its object keys become the gallery categories.

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

The image URLs should use this repository's raw GitHub path so they remain publicly embeddable:

`https://raw.githubusercontent.com/events-bkpadu/website/images-link/images/<category>/<filename>`
