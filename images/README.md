# Local Gallery Images

Add your photographs to the matching category folder. When the server exposes directory listings, the website discovers the available files automatically with one directory request per category and does not probe missing filenames.

Use simple names such as:

- `images/weddings/pic1.jpg`
- `images/weddings/pic2.jpg`
- `images/weddings/pic3.webp`
- `images/decorations/pic1.webp`
- `images/hero/pic1.jpg` for the main hero photograph

Numbering gaps are allowed. For example, `pic1.jpg`, `pic2.jpg`, `pic5.jpg`, and `pic8.jpg` will all be discovered and displayed in that numeric order. The gallery counts the discovered files and paginates six images per page automatically.

If your hosting provider does not expose folder listings, add the filenames to that category's `files` array in `js/site-config.js`, for example `files: ['pic1.jpg', 'pic5.jpg', 'pic8.jpg']`. This fallback also makes deployment on static hosts predictable without generating 404 requests.