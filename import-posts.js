const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = 'D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/data/hikingchina.db';
const db = new sqlite3.Database(dbPath);

// 读取 cleaned 数据
const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContentCleaned.js', 'utf8');
const start = raw.indexOf('postContentsCleaned = ');
const objStr = raw.slice(start + 'postContentsCleaned = '.length);
const posts = JSON.parse(objStr);

// 找到用户 Leo 的 user_id
db.get('SELECT id FROM users WHERE username = ?', ['Leo'], (err, user) => {
  if (err || !user) {
    console.log('User Leo not found, using user_id=3');
    user = { id: 3 };
  }
  const userId = user.id;
  console.log('Using user_id:', userId);
  
  const stmt = db.prepare('INSERT INTO posts (user_id, title, content, category, tags, image_urls) VALUES (?, ?, ?, ?, ?, ?)');
  
  let count = 0;
  for (const [key, val] of Object.entries(posts)) {
    // Map title to category
    let category = '其他';
    if (val.title.includes('登山') || val.title.includes('攀登') || val.title.includes('转山')) category = '登山经验';
    else if (val.title.includes('路线') || val.title.includes('徒步') || val.title.includes('攻略')) category = '路线攻略';
    else if (val.title.includes('装备') || val.title.includes('露营') || val.title.includes('鞋履') || val.title.includes('服装') || val.title.includes('背包') || val.title.includes('配件') || val.title.includes('导航')) category = '装备评测';
    else if (val.title.includes('摄影')) category = '摄影分享';
    else if (val.title.includes('技巧')) category = '户外技巧';
    
    // Extract tags from title
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
    
    stmt.run(userId, val.title, val.html, category, tags.join(','), JSON.stringify([]), function(err) {
      if (err) console.log('Error inserting', val.title, ':', err.message);
      else count++;
    });
  }
  
  stmt.finalize(() => {
    console.log('Inserted', count, 'posts');
    db.close();
  });
});
