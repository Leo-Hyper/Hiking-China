const { getDb } = require('./models/db');
const db = getDb();
db.all("SELECT id, title, image_urls FROM posts WHERE image_urls IS NOT NULL AND image_urls != '' LIMIT 10", [], (err, rows) => {
  if (err) console.error(err);
  else rows.forEach(r => console.log(r.id + ' | ' + r.title.substring(0,40) + ' | ' + (r.image_urls || '').substring(0,100)));
});
