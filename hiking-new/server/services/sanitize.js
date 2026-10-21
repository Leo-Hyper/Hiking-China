const sanitizeHtml = require("sanitize-html");

const OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote",
    "ul", "ol", "li", "h1", "h2", "h3", "h4", "a", "img", "code", "pre", "hr", "span",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    span: ["class"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: attribs.target === "_blank" ? "_blank" : undefined,
        rel: "noopener noreferrer",
      },
    }),
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        loading: attribs.loading === "eager" ? "eager" : "lazy",
        decoding: "async",
      },
    }),
  },
};

function sanitizeRichText(value) {
  return sanitizeHtml(String(value || ""), OPTIONS).trim();
}

module.exports = { sanitizeRichText };
