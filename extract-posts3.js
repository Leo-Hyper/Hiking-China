const fs = require('fs');

const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContent.js', 'utf8');

// 找到 export const postContents = { ... };
const startIdx = raw.indexOf('export const postContents = {');
const endIdx = raw.lastIndexOf('};');
const content = raw.slice(startIdx + 'export const postContents = {'.length, endIdx);

// 提取所有 key
const keyMatches = content.match(/"([^"]+)":\s*\{/g);
const keys = keyMatches ? keyMatches.map(k => k.replace(/"([^"]+)":\s*\{/, '$1')) : [];
console.log('Keys:', keys.length);

// 按 key 分割 content
let cleaned = {};
for (const key of keys) {
  // 找到这个 key 对应的 html 字符串
  const keyPattern = new RegExp('"' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '":\\s*\\{\\s*html:\\s*`([\\s\\S]*?)`\\s*(?:,\\s*image:\\s*`([^`]*)`)?\\s*\\}', 'g');
  const match = keyPattern.exec(content);
  
  if (match) {
    const html = match[1];
    const image = match[2] || '';
    
    // Extract title
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : key;
    title = title.replace(/ - 挑战人生第一座雪山$/, '').trim();
    
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
    
    cleaned[key] = { title, html: inner.trim(), image };
    console.log(key, ': title="' + title + '" htmlLen=' + inner.trim().length);
  } else {
    console.log(key, ': NO MATCH');
  }
}

// Write output
const output = '// Auto-cleaned post content from original HTML files\nexport const postContentsCleaned = ' + JSON.stringify(cleaned, null, 2) + ';\n';
fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', output, 'utf8');
console.log('\nWritten to postContentCleaned.js');
