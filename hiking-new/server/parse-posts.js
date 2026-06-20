const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/data/postContent.js'), 'utf8');

// Find all post entries: "key": { html: `...`, image: "..." }
const posts = [];
// Match pattern: "KeyName": { html: `...content...`, image: "...path..." }
const re = /"([^"]+)":\s*\{\s*html:\s*`([\s\S]*?)`\s*,\s*image:\s*"([^"]+)"\s*\}/g;
let m;
while ((m = re.exec(content)) !== null) {
  const html = m[2];
  // Extract metadata from HTML
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const catMatch = html.match(/<span[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)<\/span>/);
  const dateMatch = html.match(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/);
  const authorMatch = html.match(/<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/);
  const viewsMatch = html.match(/<span[^>]*class="[^"]*views[^"]*"[^>]*>(\d+)/);
  const tagsMatch = html.match(/<span[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/span>/g);
  
  const tags = tagsMatch ? tagsMatch.map(t => t.match(/>([^<]+)</)[1]) : [];
  
  posts.push({
    key: m[1],
    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
    category: catMatch ? catMatch[1].trim() : '其他',
    date: dateMatch ? dateMatch[1].trim() : '',
    author: authorMatch ? authorMatch[1].trim() : '徒步爱好者',
    views: viewsMatch ? +viewsMatch[1] : 0,
    tags,
    html: m[2],
    image: m[3]
  });
}

console.log('Found', posts.length, 'posts');
posts.forEach((p, i) => console.log(`${i+1}. ${p.key} | ${p.title.substring(0,25)} | ${p.category} | image: ${p.image}`));

// Save parsed data for import script
fs.writeFileSync(path.join(__dirname, '../server/parsed-posts.json'), JSON.stringify(posts, null, 2));
console.log('Saved to parsed-posts.json');
