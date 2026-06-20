const fs = require('fs');

const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', 'utf8');
const start = raw.indexOf('postContentsCleaned = ');
const objStr = raw.slice(start + 'postContentsCleaned = '.length);

// 用 Function 构造器代替 JSON.parse（支持单引号等）
const cleaned = {};
try {
  // 替换为合法 JSON：把内容中的 ' 转义
  // 实际上 HTML 内容里可能有 ' 导致 JSON 不合法
  // 用更粗暴的方法：手动提取每个 key
  
  // 找到每个 key 的边界
  const keyRegex = /"([^"]+)":\s*\{/g;
  const keys = [];
  let m;
  while ((m = keyRegex.exec(objStr)) !== null) {
    keys.push({ name: m[1], pos: m.index + m[0].length });
  }
  
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const next = keys[i + 1];
    // 截取到这个 key 的完整值
    let slice = objStr.slice(k.pos, next ? next.pos : objStr.length - 1);
    
    // 提取 html 内容（从 html: ` 到匹配的 `）
    const htmlStart = slice.indexOf('html: `');
    if (htmlStart === -1) continue;
    const contentStart = htmlStart + 7; // after `html: `
    
    // 找到匹配的闭合反引号
    let pos = contentStart;
    let content = '';
    while (pos < slice.length) {
      if (slice[pos] === '`' && slice[pos-1] !== '\\') {
        // 检查后面是否是 , 或 }
        const rest = slice.slice(pos + 1).trimStart();
        if (rest.startsWith(',') || rest.startsWith('}') || rest.startsWith('/*')) {
          content = slice.slice(contentStart, pos);
          break;
        }
      }
      pos++;
    }
    
    // 提取 image
    const imgMatch = slice.match(/image:\s*`([^`]*)`/);
    const image = imgMatch ? imgMatch[1] : '';
    
    // 提取 title
    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : k.name;
    title = title.replace(/ - 挑战人生第一座雪山$/, '').trim();
    
    cleaned[k.name] = { title, html: content, image };
    console.log(k.name, ': title="' + title + '"');
  }
} catch (e) {
  console.error('Error:', e.message);
}

console.log('Parsed', Object.keys(cleaned).length, 'posts');

// Now generate SQL
const lines = [];
for (const [key, val] of Object.entries(cleaned)) {
  let category = '其他';
  if (val.title.includes('登山') || val.title.includes('攀登') || val.title.includes('转山')) category = '登山经验';
  else if (val.title.includes('路线') || val.title.includes('徒步') || val.title.includes('攻略')) category = '路线攻略';
  else if (val.title.includes('装备') || val.title.includes('露营') || val.title.includes('鞋履') || val.title.includes('服装') || val.title.includes('背包') || val.title.includes('配件') || val.title.includes('导航')) category = '装备评测';
  else if (val.title.includes('摄影')) category = '摄影分享';
  else if (val.title.includes('技巧')) category = '户外技巧';
  
  const tags = [];
  if (val.title.includes('四姑娘山')) tags.push('雪山', '入门级');
  else if (val.title.includes('虎跳峡')) tags.push('云南', '经典路线');
  else if (val.title.includes('秋季')) tags.push('秋季', '装备');
  else if (val.title.includes('贡嘎')) tags.push('贡嘎', '重装');
  else if (val.title.includes('稻城')) tags.push('稻城亚丁');
  else if (val.title.includes('雨崩')) tags.push('雨崩', '梅里雪山');
  else if (val.title.includes('喀纳斯')) tags.push('喀纳斯', '新疆');
  else if (val.title.includes('墨脱')) tags.push('墨脱', '西藏');
  else if (val.title.includes('黄山')) tags.push('黄山', '安徽');
  else if (val.title.includes('露营')) tags.push('露营', '帐篷');
  else if (val.title.includes('鞋履')) tags.push('鞋履', '选购');
  else if (val.title.includes('服装')) tags.push('服装', '分层');
  else if (val.title.includes('导航')) tags.push('导航', '安全');
  else if (val.title.includes('背包')) tags.push('背包', '重装');
  else if (val.title.includes('配件')) tags.push('配件', '小物');
  
  const titleEscaped = val.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const contentEscaped = val.html.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  const categoryEscaped = category.replace(/'/g, "\\'");
  const tagsStr = tags.join(',');
  const tagsEscaped = tagsStr.replace(/'/g, "\\'");
  
  lines.push(`INSERT INTO posts (user_id, title, content, category, tags, image_urls) VALUES (3, '${titleEscaped}', '${contentEscaped}', '${categoryEscaped}', '${tagsEscaped}', '[]');`);
}

fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hikingchina-import.sql', lines.join('\n'));
console.log('\nGenerated', lines.length, 'INSERT statements');
console.log('SQL file size:', fs.statSync('D:/AI-Workspace/Projects/徒步论坛网站/hikingchina-import.sql').size, 'bytes');
