const fs = require('fs');
const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', 'utf8');
const m = raw.match(/postContentsCleaned\s*=\s*({[\s\S]*});?\s*$/);
const posts = JSON.parse(m[1]);

// 映射 key -> title
const keyToTitle = {
  '四姑娘山': '四姑娘山大峰攀登全记录',
  '虎跳峡': '虎跳峡高路徒步 - 世界十大经典徒步路线体验',
  '秋季徒步装备指南': '秋季徒步装备指南 - 从入门到专业的完整清单',
  '贡嘎转山': '贡嘎转山 - 蜀山之王的朝圣之旅',
  '稻城亚丁徒步': '稻城亚丁徒步 - 最后的香格里拉',
  '雨崩村徒步': '雨崩村徒步 - 梅里雪山脚下的秘境',
  '喀纳斯徒步': '喀纳斯徒步 - 中国最美的人间净土',
  '墨脱徒步': '墨脱徒步 - 中国最神秘的徒步路线',
  '黄山徒步': '黄山徒步 - 中国山水之美典范',
  '露营装备': '徒步露营装备指南 - 野外安营扎寨的必备装备',
  '徒步鞋履': '徒步鞋履指南 - 选择合适的徒步鞋',
  '服装系统': '徒步服装系统指南 - 分层着装的艺术',
  '导航与安全': '徒步导航与安全装备指南 - 确保徒步安全的关键',
  '背包装备': '徒步背包装备指南 - 选择合适的背包',
  '其他配件': '徒步其他配件指南 - 提升徒步体验的小物件',
};

const sqlLines = [];
for (const [key, val] of Object.entries(posts)) {
  const title = keyToTitle[key];
  if (!title) continue;
  const img = val.image || '/img/四姑娘山.jpg';
  const titleEscaped = title.replace(/'/g, "''");
  sqlLines.push(`UPDATE posts SET image_urls='${img}' WHERE title='${titleEscaped}' AND id >= 25;`);
  console.log(title, '->', img);
}

fs.writeFileSync('D:/AI-Workspace/Projects/徒步论坛网站/update-images.sql', sqlLines.join('\n'));
console.log('\nGenerated', sqlLines.length, 'UPDATE statements');
