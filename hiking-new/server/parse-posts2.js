const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/data/postContent.js'), 'utf8');

// Parse the template objects embedded in HTML
const posts = [];
const re = /"([^"]+)":\s*\{\s*html:\s*`([\s\S]*?)`\s*,\s*image:\s*"([^"]+)"\s*\}/g;
let m;
while ((m = re.exec(content)) !== null) {
  const html = m[2];
  
  // Extract template object from HTML head
  const templateMatch = html.match(/<template[^>]*>\s*([\s\S]*?)\s*<\/template>/);
  let meta = { category: '其他', date: '', author: '徒步爱好者', views: 0, tags: [] };
  
  if (templateMatch) {
    const tpl = templateMatch[1];
    const catMatch = tpl.match(/category:\s*"([^"]+)"/);
    const dateMatch = tpl.match(/date:\s*"([^"]+)"/);
    const authorMatch = tpl.match(/author:\s*"([^"]+)"/);
    const viewsMatch = tpl.match(/views:\s*(\d+)/);
    const tagsMatch = tpl.match(/tags:\s*\[([^\]]*)\]/);
    
    if (catMatch) meta.category = catMatch[1];
    if (dateMatch) meta.date = dateMatch[1];
    if (authorMatch) meta.author = authorMatch[1];
    if (viewsMatch) meta.views = +viewsMatch[1];
    if (tagsMatch) meta.tags = tagsMatch[1].split(',').map(t => t.replace(/"/g, '').trim()).filter(Boolean);
  }
  
  // Extract title from h1 in body
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  
  posts.push({
    key: m[1],
    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
    ...meta,
    html: m[2],
    image: m[3]
  });
}

console.log('Found', posts.length, 'posts');
posts.forEach((p, i) => console.log(`${i+1}. ${p.key} | ${p.title.substring(0,30)} | ${p.category} | ${p.tags.join(',')}`));

fs.writeFileSync(path.join(__dirname, '../server/parsed-posts.json'), JSON.stringify(posts, null, 2));
console.log('Saved to parsed-posts.json');
