const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const content = fs.readFileSync(path.join(__dirname, '../src/data/postContent.js'), 'utf8');

// Extract posts
const posts = [];
const re = /key:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*date:\s*"([^"]+)",\s*author:\s*"([^"]+)",\s*views:\s*(\d+),\s*tags:\s*\[([^\]]*)\],\s*html:\s*`([\s\S]*?)`\s*,\s*image:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(content)) !== null) {
  posts.push({
    key: m[1],
    title: m[2],
    category: m[3],
    date: m[4],
    author: m[5],
    views: +m[6],
    tags: m[7].split(',').map(t => t.replace(/"/g, '').trim()).filter(Boolean),
    html: m[8],
    image: m[9]
  });
}

console.log('Found', posts.length, 'posts to import');

// Clean HTML: extract body content, remove extra elements
function cleanHtml(html) {
  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let body = bodyMatch ? bodyMatch[1] : html;
  
  // Remove script tags
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Remove header/navigation elements
  body = body.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  
  // Remove footer
  body = body.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  
  // Remove back-to-top button
  body = body.replace(/<button[^>]*class="[^"]*back.?top[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '');
  
  // Remove search overlay
  body = body.replace(/<search-overlay[^>]*>[\s\S]*?<\/search-overlay>/gi, '');
  
  // Remove any remaining nav elements
  body = body.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  
  // Remove title from body if present
  body = body.replace(/<h1[^>]*>\s*[^<]+<\/h1>/gi, '');
  
  // Remove tags section from body if present
  body = body.replace(/<div[^>]*class="[^"]*tags[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Remove comment sections
  body = body.replace(/<div[^>]*class="[^"]*comment[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Remove share/like buttons
  body = body.replace(/<div[^>]*class="[^"]*(share|like|action)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  
  // Remove return-to-home links
  body = body.replace(/<a[^>]*class="[^"]*return[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
  
  // Clean up extra whitespace
  body = body.replace(/\n\s*\n/g, '\n');
  
  return body.trim();
}

// Connect to DB
const dbPath = path.join(__dirname, '../data/hikingchina.db');
const db = new sqlite3.Database(dbPath);

// Get user_id for "Leo" (the test user)
db.get('SELECT id FROM users WHERE username LIKE "%Leo%" OR username LIKE "%hiker%" ORDER BY id DESC LIMIT 1', (err, user) => {
  if (err || !user) {
    console.log('No user found, using user_id=1');
    user = { id: 1 };
  }
  console.log('Using user_id:', user.id);
  
  db.serialize(() => {
    let imported = 0;
    
    posts.forEach((post, index) => {
      const cleanedContent = cleanHtml(post.html);
      const tagsStr = post.tags.join(',');
      const imageUrls = [post.image];
      
      db.run(
        'INSERT INTO posts (user_id, title, content, category, tags, image_urls, views) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, post.title, cleanedContent, post.category, tagsStr, JSON.stringify(imageUrls), post.views],
        function(err) {
          if (err) {
            console.log(`Failed to import post ${index + 1}: ${post.title}`);
            console.error(err.message);
          } else {
            imported++;
            console.log(`Imported: "${post.title}" (id=${this.lastID})`);
          }
          
          // Last post done
          if (index === posts.length - 1) {
            console.log(`\nTotal imported: ${imported}/${posts.length}`);
            db.close();
          }
        }
      );
    });
  });
});
