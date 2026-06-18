import json, os

base = r'D:\AI-Workspace\Projects\徒步论坛网站'
data_dir = os.path.join(base, 'hiking-new', 'src', 'data')

with open(os.path.join(data_dir, 'posts.json'), 'rb') as f:
    d = f.read().decode('utf-8-sig')
    data = json.loads(d)

img_map = {'四姑娘山':'/img/四姑娘山.jpg','虎跳峡':'/img/虎跳峡.jpg','稻城亚丁徒步':'/img/稻城亚丁.jpg','雨崩村徒步':'/img/雨崩村.webp','贡嘎转山':'/img/贡嘎转山.png','喀纳斯徒步':'/img/喀纳斯.jpg','墨脱徒步':'/img/墨脱.jpg','黄山徒步':'/img/黄山.jpg','露营装备':'/img/露营.webp','徒步鞋履':'/img/鞋履.jpg','服装系统':'/img/服装.jpg','背包装备':'/img/背包.webp','秋季徒步装备指南':'/img/徒步装备.avif','导航与安全':'/img/导航.jpg','其他配件':'/img/其他装备.jpg'}

lines = ['export const postContents = {']
for k in data:
    html = data[k]
    # Only escape backticks and backslashes that are inside template literals
    html = html.replace('', '\\')
    html = html.replace('\\', '\\\\')
    img = img_map.get(k, '/img/四姑娘山.jpg')
    lines.append('  "' + k + '": { html: ' + html + ', image: "' + img + '" },')
lines.append('};')

with open(os.path.join(data_dir, 'postContent.js'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('Done')
