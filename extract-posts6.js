const fs = require('fs');

const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContent.js', 'utf8');

// 提取 postContents 对象
const start = raw.indexOf('export const postContents = {');
const end = raw.lastIndexOf('};');
const objCode = raw.slice(start + 'export const postContents = '.length, end + 1).replace('export const postContents = ', '');

// 安全执行
const postContents = {};
global.postContents = postContents;
eval(objCode);
delete global.postContents;

console.log('Loaded', Object.keys(postContents).length, 'posts');

function cleanHtml(html) {
  // Extract body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  
  // Remove back-button
  body = body.replace(/<a[^>]*class="[^"]*back-button[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  
  // Remove post-detail wrapper (includes post-header)
  body = body.replace(/<div[^>]*class="[^"]*post-detail[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Extract post-content-detail inner
  const contentMatch = body.match(/<div[^>]*class="[^"]*post-content-detail[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  let inner = contentMatch ? contentMatch[1] : body;
  
  // Remove container wrapper
  inner = inner.replace(/^<div[^>]*class="[^"]*container[^"]*"[^>]*>/i, '');
  inner = inner.replace(/<\/div>\s*$/i, '');
  
  // Remove script/style/link
  inner = inner.replace(/<script[\s\S]*?<\/script>/gi, '');
  inner = inner.replace(/<style[\s\S]*?<\/style>/gi, '');
  inner = inner.replace(/<link[\s\S]*?>/gi, '');
  
  return inner.trim();
}

const cleaned = {};
for (const [key, val] of Object.entries(postContents)) {
  const titleMatch = val.html.match(/<title>([\s\S]*?)<\/title>/);
  let title = titleMatch ? titleMatch[1] : key;
  title = title.replace(/ - 挑战人生第一座雪山$/, '').trim();
  
  cleaned[key] = {
    title,
    html: cleanHtml(val.html),
    image: val.image || '/img/四姑娘山.jpg',
  };
  console.log(key, ': title="' + title + '" htmlLen=' + cleaned[key].html.length);
}

const output = '// Auto-cleaned post content from original HTML files\nexport const postContentsCleaned = ' + JSON.stringify(cleaned, null, 2) + ';\n';
fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', output, 'utf8');
console.log('\nWritten to postContentCleaned.js');
