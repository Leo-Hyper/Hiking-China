const fs = require('fs');

const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContent.js', 'utf8');

// 匹配每个 key: "key": { html: `...` }
// 用正则分割
const pattern = /"([^"]+)":\s*\{\s*html:\s*`([\s\S]*?)`\s*(,\s*image:\s*`([^`]*)`)?\s*\}/g;
const results = [];
let match;

while ((match = pattern.exec(raw)) !== null) {
  const key = match[1];
  const html = match[2];
  const image = match[4] || '';
  
  // 提取 title
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  let title = titleMatch ? titleMatch[1] : key;
  // 去掉后缀
  title = title.replace(/ - 挑战人生第一座雪山$/, '').trim();
  
  // 提取 body 内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  
  // 移除 container div 和内部冗余
  // 1. 移除 back-button
  body = body.replace(/<a[^>]*class="[^"]*back-button[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  
  // 2. 移除 post-header
  body = body.replace(/<div[^>]*class="[^"]*post-detail[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // 3. 提取 post-content-detail 内部
  const contentMatch = body.match(/<div[^>]*class="[^"]*post-content-detail[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  let inner = contentMatch ? contentMatch[1] : body;
  
  // 4. 移除 container 外层 div
  inner = inner.replace(/^<div[^>]*class="[^"]*container[^"]*"[^>]*>/i, '');
  inner = inner.replace(/<\/div>\s*$/i, '');
  
  // 5. 移除 script/style/link
  inner = inner.replace(/<script[\s\S]*?<\/script>/gi, '');
  inner = inner.replace(/<style[\s\S]*?<\/style>/gi, '');
  inner = inner.replace(/<link[\s\S]*?>/gi, '');
  
  results.push({ key, title, html: inner.trim(), image });
}

console.log('Found', results.length, 'posts');

// 写入 cleaned file
const obj = {};
results.forEach(r => { obj[r.key] = { title: r.title, html: r.html, image: r.image }; });

const output = '// Auto-cleaned post content from original HTML\nexport const postContentsCleaned = ' + JSON.stringify(obj, null, 2) + ';\n';
fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', output, 'utf8');
console.log('Written to postContentCleaned.js');

// 打印前两个帖子的标题和长度
results.slice(0, 3).forEach(r => {
  console.log(`  ${r.key}: title="${r.title}" htmlLen=${r.html.length}`);
});
