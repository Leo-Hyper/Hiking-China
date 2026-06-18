const fs = require("fs");
const files = ["src/components/PostCard.vue", "src/components/RouteCard.vue"];
for (const fp of files) {
  const fullPath = "D:\\AI-Workspace\\Projects\\徒步论坛网站\\hiking-new\\" + fp;
  let content = fs.readFileSync(fullPath, "utf8");
  const isPostCard = fp.includes("PostCard");
  const varName = isPostCard ? "post.id" : "routeData.id";
  const pattern = ":to=\"/post/\"";
  const replacement = ':to="`/post/${' + varName + '}`"';
  content = content.split(pattern).join(replacement);
  fs.writeFileSync(fullPath, content, "utf8");
  console.log("Fixed " + fp);
}
console.log("All done!");