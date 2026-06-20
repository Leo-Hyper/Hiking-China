const fs = require('fs');
const raw = fs.readFileSync('D:/AI-Workspace/Projects/徒步论坛网站/hiking-new/src/data/postContent.js', 'utf8');
const keys = raw.match(/"[^"]+":\s*\{/g);
console.log(keys ? keys.length + ' keys found' : 'none');
if (keys) keys.slice(0, 5).forEach(k => console.log(k.trim()));
