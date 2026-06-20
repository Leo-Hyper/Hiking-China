const fs = require('fs');

const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', 'utf8');
const start = raw.indexOf('postContentsCleaned = ');
const objStr = raw.slice(start + 'postContentsCleaned = '.length);
const posts = JSON.parse(objStr);

const dbPath = 'D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/data/hikingchina.db';
const lines = [];
lines.push('.mode csv');
lines.push('.import /dev/null temp_import');

// Generate INSERT statements
for (const [key, val] of Object.entries(posts)) {
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
  
  const titleEscaped = val.title.replace(/'/g, "''");
  const contentEscaped = val.html.replace(/'/g, "''");
  const categoryEscaped = category.replace(/'/g, "''");
  const tagsStr = tags.join(',');
  const tagsEscaped = tagsStr.replace(/'/g, "''");
  
  lines.push(`INSERT INTO posts (user_id, title, content, category, tags, image_urls) VALUES (3, '${titleEscaped}', '${contentEscaped}', '${categoryEscaped}', '${tagsEscaped}', '[]');`);
}

fs.writeFileSync(dbPath + '.sql', lines.join('\n'));
console.log('Generated', lines.length, 'SQL statements');
