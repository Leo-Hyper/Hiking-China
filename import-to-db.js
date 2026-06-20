const fs = require('fs');
const f = 'D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js';
const c = fs.readFileSync(f, 'utf8');
const m = c.match(/postContentsCleaned\s*=\s*({[\s\S]*});?\s*$/);
const posts = JSON.parse(m[1]);
const lines = [];

for (const [key, val] of Object.entries(posts)) {
  let cat = '其他';
  if (val.title.includes('登山') || val.title.includes('攀登') || val.title.includes('转山')) cat = '登山经验';
  else if (val.title.includes('路线') || val.title.includes('徒步') || val.title.includes('攻略')) cat = '路线攻略';
  else if (val.title.includes('装备') || val.title.includes('露营') || val.title.includes('鞋履') || val.title.includes('服装') || val.title.includes('背包') || val.title.includes('配件') || val.title.includes('导航')) cat = '装备评测';
  else if (val.title.includes('摄影')) cat = '摄影分享';
  else if (val.title.includes('技巧')) cat = '户外技巧';
  
  const tags = [];
  if (val.title.includes('四姑娘山')) tags.push('雪山','入门级');
  else if (val.title.includes('虎跳峡')) tags.push('云南','经典路线');
  else if (val.title.includes('秋季')) tags.push('秋季','装备');
  else if (val.title.includes('贡嘎')) tags.push('贡嘎','重装');
  else if (val.title.includes('稻城')) tags.push('稻城亚丁');
  else if (val.title.includes('雨崩')) tags.push('雨崩','梅里雪山');
  else if (val.title.includes('喀纳斯')) tags.push('喀纳斯','新疆');
  else if (val.title.includes('墨脱')) tags.push('墨脱','西藏');
  else if (val.title.includes('黄山')) tags.push('黄山','安徽');
  else if (val.title.includes('露营')) tags.push('露营','帐篷');
  else if (val.title.includes('鞋履')) tags.push('鞋履','选购');
  else if (val.title.includes('服装')) tags.push('服装','分层');
  else if (val.title.includes('导航')) tags.push('导航','安全');
  else if (val.title.includes('背包')) tags.push('背包','重装');
  else if (val.title.includes('配件')) tags.push('配件','小物');
  
  const t = val.title.replace(/\\/g,'\\\\\\\\\\').replace(/'/g, "\\\\\\\\'");
  const ct = val.html.replace(/\\/g,'\\\\\\\\\\').replace(/'/g, "\\\\\\\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
  const ca = cat.replace(/'/g, "\\\\\\\\'");
  const tg = tags.join(',').replace(/'/g, "\\\\\\\\'");
  
  lines.push("INSERT INTO posts (user_id,title,content,category,tags,image_urls) VALUES (3,'" + t + "','" + ct + "','" + ca + "','" + tg + "','[]');");
}

fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hikingchina-import.sql', lines.join('\n'));
console.log('Generated', lines.length, 'INSERT statements');
console.log('SQL file size:', fs.statSync('D:/AI-Workspace/Projects/徒步论坛网站/hikingchina-import.sql').size, 'bytes');

