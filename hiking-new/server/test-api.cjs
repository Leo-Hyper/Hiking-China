const http = require('http');
http.get('http://localhost:3001/api/posts/1', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const j = JSON.parse(data);
    const p = j.post;
    console.log('=== Post 1 ===');
    console.log('id:', p.id);
    console.log('image_urls raw:', p.image_urls);
    console.log('tags raw:', p.tags);
    console.log('has_literal_backslash_n:', p.content.includes('\\\\n'));
    let images = [];
    try { images = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : []; } catch(e) {}
    console.log('parsed images:', images);
    console.log('first image:', images[0] || 'MISSING');
    const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '').trim();
    console.log('excerpt:', stripHtml(p.content).substring(0, 80));
  });
});
