const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// 把 .js 临时改名为 .mjs 再改回来不行，换个思路
// 直接读取文件并用正则提取每个 key 的 html 内容

const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContent.js', 'utf8');

// 找到所有 "key": { html: `...` } 块
// 由于模板字符串可能包含反引号，我们找 key 然后用平衡括号匹配
const keys = [];
const keyRegex = /"([^"]+)":\s*\{/g;
let km;
while ((km = keyRegex.exec(raw)) !== null) {
  keys.push({ name: km[1], start: km.index + km[0].length });
}

console.log('Found', keys.length, 'keys');

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
for (const keyInfo of keys) {
  // Find the closing ` for this key's html
  const htmlStart = raw.indexOf('html:', keyInfo.start);
  const templateStart = raw.indexOf('`', htmlStart);
  
  // Find matching closing template literal
  // We need to find the closing ` that is not escaped
  let depth = 0;
  let templateEnd = templateStart + 1;
  while (templateEnd < raw.length) {
    if (raw[templateEnd] === '`' && raw[templateEnd - 1] !== '\\') {
      depth++;
      if (depth > 0) {
        // Check if this closes the html template
        const after = raw.slice(templateEnd + 1).trim();
        if (after.startsWith(',') || after.startsWith('}') || after.startsWith('image:') || after.startsWith('//') || after.startsWith('*')) {
          break;
        }
      }
    }
    templateEnd++;
  }
  
  // Actually let's find it differently - look for the pattern after the closing `
  // The structure is: html: `...content...`, [image: `...`] }
  
  // Simpler approach: find "html: `" then scan for the matching closing `
  // that's followed by comma or }
  let pos = templateStart + 1;
  let found = false;
  while (pos < raw.length) {
    if (raw[pos] === '`' && raw[pos-1] !== '\\') {
      // Check what follows
      const rest = raw.slice(pos + 1).trimStart();
      if (rest.startsWith(',') || rest.startsWith('}') || rest.startsWith('/*') || rest.startsWith('//')) {
        const html = raw.slice(templateStart + 1, pos);
        
        // Extract title
        const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
        let title = titleMatch ? titleMatch[1] : keyInfo.name;
        title = title.replace(/ - 挑战人生第一座雪山$/, '').trim();
        
        // Try to find image
        const imageMatch = raw.slice(pos).match(/image:\s*`([^`]*)`/);
        const image = imageMatch ? imageMatch[1] : '';
        
        cleaned[keyInfo.name] = { title, html: cleanHtml(html), image };
        console.log(keyInfo.name, ': title="' + title + '" htmlLen=' + cleanHtml(html).length);
        found = true;
        break;
      }
    }
    pos++;
    if (pos > templateStart + 500000) break; // safety
  }
  if (!found) console.log(keyInfo.name, ': FAILED TO PARSE');
}

const output = '// Auto-cleaned post content from original HTML files\nexport const postContentsCleaned = ' + JSON.stringify(cleaned, null, 2) + ';\n';
fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', output, 'utf8');
console.log('\nWritten to postContentCleaned.js');
console.log('Total cleaned:', Object.keys(cleaned).length);
