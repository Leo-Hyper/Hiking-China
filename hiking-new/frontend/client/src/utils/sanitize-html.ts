import DOMPurify from 'dompurify';
import { optimizedImagePath } from './base-path';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'a', 'img', 'code', 'pre', 'hr', 'span',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'loading', 'decoding', 'class'];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src');
    if (src) node.setAttribute('src', optimizedImagePath(src));
    node.setAttribute('loading', 'lazy');
    node.setAttribute('decoding', 'async');
  }
});

export function sanitizeRichText(html: string | undefined): string {
  return DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });
}
