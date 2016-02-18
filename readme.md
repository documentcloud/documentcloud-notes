# DocumentCloud Notes

*This project is a part of [DocumentCloud][].*

DocumentCloud Notes are a minimalist and responsive way to display a highlighted region of an image.

Notes are represented as blob of JSON (and previously, wrapped in a `dc.embed.noteCallback()` function):

```
{
  "id": 176629,
  "page": 1,
  "title": "The UN Logo",
  "content": "The United Nations (UN) is an intergovernmental organization established on 24 October 1945 to promote international co-operation. A replacement for the ineffective League of Nations, the organization was created following the Second World War to prevent another such conflict. At its founding, the UN had 51 member states; there are now 193. (Excerpted from \u003ca href=\"http://en.wikipedia.org/wiki/United_Nations\"\u003eWikipedia\u003c/a\u003e)",
  "access": "public",
  "location": {"image":"892,482,942,55"},
  "image_url": "https://assets.documentcloud.org/documents/1282616/pages/undeclarationofhr-tl-p{page}-{size}.gif",
  "published_url": "https://www.documentcloud.org/documents/1282616-undeclarationofhr-tl.html",
  "canonical_url_":"https://www.documentcloud.org/documents/1282616-undeclarationofhr-tl/annotations/176629.html"
  "resource_url":"https://www.documentcloud.org/documents/1282616-undeclarationofhr-tl/annotations/176629.js"
}

```

Notes can then be embedded with three things: a target DIV, the note JavaScript code, and an invocation to load the note resource:

```
  <div id="DC-note-175279" class="DC-note-container"></div>
  <script src="//assets.documentcloud.org/notes/loader.js"></script>
  <script>
    dc.embed.loadNote('//www.documentcloud.org/documents/1282616-undeclarationofhr-tl/annotations/175279.js');
  </script>
```

[DocumentCloud]: https://www.documentcloud.org
