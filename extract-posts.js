const fs = require('fs');
const path = require('path');

const contentFile = 'D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContent.js';
const raw = fs.readFileSync(contentFile, 'utf8');

// 提取 export const postContents = { ... }
const braceStart = raw.indexOf('{');
const braceEnd = raw.lastIndexOf('}');
const objStr = raw.slice(braceStart + 1, braceEnd);

// 手动解析 key-value 对
const postContents = {};
const regex = /"([^"]+)":\s*\{\s*html:\s*`([\s\S]*?)`\s*,?\s*(?:,\s*image:\s*`([^`]*)`)?\s*\}/g;
let m;

while ((m = regex.exec(raw)) !== null) {
  const key = m[1];
  const html = m[2];
  const image = m[3] || '';
  
  // 提取 title 从 <title> 标签
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(/ - 挑战人生第一座雪山$/, '').trim() : key;
  
  // 提取 .post-content-detail 内部
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  
  // 找到 post-content-detail div
  const contentDivMatch = body.match(/<div[\s\S]*?class="[\s\S]*?post-content-detail[\s\S]*?">([\s\S]*?)<\/div>/i);
  let inner = contentDivMatch ? contentDivMatch[1] : body;
  
  // 移除 post-header
  inner = inner.replace(/<div[\s\S]*?class="[\s\S]*?post-header[\s\S]*?">[\s\S]*?<\/div>/gi, '');
  
  // 移除 back-button
  inner = inner.replace(/<a[\s\S]*?class="[\s\S]*?back-button[\s\S]*?">[\s\S]*?<\/a>/gi, '');
  
  // 移除 container div 外层
  inner = inner.replace(/^<div[\s\S]*?class="[\s\S]*?container[\s\S]*?">/, '');
  inner = inner.replace(/<\/div>\s*$/, '');
  
  // 移除 script/style/link
  inner = inner.replace(/<script[\s\S]*?<\/script>/gi, '');
  inner = inner.replace(/<style[\s\S]*?<\/style>/gi, '');
  inner = inner.replace(/<link[\s\S]*?>/gi, '');
  
  postContents[key] = { title, html: inner.trim(), image };
  console.log('Processed:', key, '| title:', title, '| html len:', inner.trim().length);
}

// 写入 cleaned 文件
const cleanedObj = {};
for (const [key, val] of Object.entries(postContents)) {
  cleanedObj[key] = { title: val.title, html: val.html, image: val.image };
}

const output = '// Auto-cleaned post content\nexport const postContentsCleaned = ' + JSON.stringify(cleanedObj, null, 2) + ';\n';
fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', output, 'utf8');
console.log('\nDone! Processed', Object.keys(postContents).length, 'posts');
