# Memory Summary
**Generated:** 2026-08-15 00:15:04
**Snapshot:** snapshot-2026-08-15

## Project Summary
# Context 鈥?寰掓璁哄潧缃戠珯 (Updated 2026-06-22)

## Overview
涓浗鎴峰寰掓绀惧尯缃戠珯锛屾彁渚涘緬姝ヨ矾绾垮睍绀恒€佽澶囨寚鍗椼€佹椿鍔ㄥ彫闆嗗拰璁哄潧浜ゆ祦鍔熻兘銆?

## Current Situation
**Phase:** 鍔熻兘瀹屽杽涓庝紭鍖栭樁娈?

### 宸插畬鎴愬姛鑳芥ā鍧楋細

**Phase 1 - 鏁版嵁灞傛敼閫狅細**
- users 琛ㄦ墿灞曪細location, hikinglevel, gear_prefs, profile_public, status
- posts 琛ㄦ墿灞曪細extrainfo, status(鑽夌/鍙戝竷), comment_closed, likes_count
- 鏂板 post_likes 琛?+ bookmarks 琛?
- 9 涓暟鎹簱绱㈠紩
- user.js/post.js 妯″瀷灞傞€傞厤

**Phase 2 - WYSIWYG 缂栬緫鍣?+ 鑽夌锛?*
- Quill 瀵屾枃鏈紪杈戝櫒 (CDN: cdn.bootcdn.net)
- 鍥剧墖绮樿创涓婁紶 + 鎵嬪姩鎻掑叆
- 鑽夌鑷姩淇濆瓨鍒?localStorage (30s + beforeunload)
- 鍙戝竷椤点€屼繚瀛樿崏绋裤€?銆屽彂甯冦€嶅垎鎸夐挳

**Phase 3 - 涓汉涓婚〉澧炲己锛堝凡浼樺寲锛夛細**
- 4 涓?Tab锛氭垜鐨勫笘瀛?鑽夌/鍙戝竷鍒嗙粍)銆佹渶杩戞祻瑙堛€佹垜鐨勬敹钘忋€佷釜浜鸿祫鏂?
- 鏈€杩戞祻瑙堬細localStorage 杩借釜 + API 鏌ヨ甯栧瓙淇℃伅
- 鏀惰棌鍔熻兘锛歅ostDetail 璋冪敤 /api/bookmarks/toggle 鎸佷箙鍖?
- 涓汉璧勬枡缂栬緫锛氭墍鍦ㄥ湴銆佸緬姝ョ瓑绾?鏂版墜/杩涢樁/璧勬繁)銆佽澶囧亸濂?12椤?銆侀殣绉佸紑鍏?
- 鏁版嵁瀵煎嚭鍔熻兘
- 鍏紑涓婚〉锛氱瓑绾у窘绔犮€佽澶囧亸濂藉睍绀?
- 浣滆€呭悕/澶村儚鐐瑰嚮璺宠浆鐢ㄦ埛涓婚〉 (PostCard + PostDetail)
- 宸茬Щ闄わ細鎴戠殑璇勮 Tab 鍙婁緷璧?(parseBBCode, parseSimple)

**Phase 4 - 鍦板浘绯荤粺锛?*
- Leaflet + OpenStreetMap (CDN: cdn.bootcdn.net, Tile: tile.openstreetmap.fr/hot)
- RouteMap.vue锛氳矾绾胯建杩瑰湴鍥?鎶樼嚎+璧风粓鏍囪)
- LocationMap.vue锛氭椿鍔ㄥ湴鐐瑰湴鍥?鍗曠偣鏍囪)
- MapPicker.vue锛氬湴鍥句氦浜掗€夌偣缁勪欢(鐐瑰嚮娣诲姞璺緞鐐?
- 璺嚎淇℃伅缁熻鍗＄墖(闅惧害/鑰楁椂/鐖崌/璺濈)
- extrainfo 姝ｇ‘浼犻€掑埌鍚庣瀛樺偍 (POST/PUT /api/posts 鍧囧凡淇)

**Phase 5 - 璇勮绯荤粺閲嶆瀯锛?*
- 浜岀骇鎵佸钩宓屽缁撴瀯锛歱arent_id 鎸囧悜椤剁骇璇勮锛宺eply_to_username 鏍囨敞鍥炲瀵硅薄
- 瀛愬洖澶嶅钩閾哄睍绀猴紝榛樿鎶樺彔鏄剧ず鍓?2 鏉★紝鐐瑰嚮灞曞紑
- 璇勮鍥剧墖涓婁紶 (ImageUploader)
- 璇勮缂栬緫/鍒犻櫎鍔熻兘 (PUT/DELETE /api/comments/:id锛屼粎浣滆€?
- 绾ц仈鍒犻櫎锛氬垹闄よ瘎璁烘椂鍚屾鍒犻櫎瀛愬洖澶嶅強鐐硅禐璁板綍

**Phase 6 - 鎼滅储涓庡鑸紭鍖栵細**
- 瀵艰埅鏍忔悳绱㈣鐩栧眰 (SearchOverlay.vue) 淇锛氬悗绔?/api/search 鏀规煡 posts 琛?
- Forum.vue 娣诲姞鎼滅储鏍忥紝鏀寔 q 鍙傛暟鏍囩璺宠浆
- Footer.vue 鐑棬璺嚎鍔ㄦ€佸寲锛圓PI 鑾峰彇鏈€鏂板笘瀛愭浛浠ｇ‖缂栫爜 ID锛?
- "鎴峰鎶€宸? 閲嶅懡鍚嶄负 "鎴峰娲诲姩"

**鍙戝竷娴佺▼浼樺寲锛?*
- ImageUploader 璁句负蹇呭～锛氭湭浼犲浘鏃堕樆姝㈡彁浜ゅ苟鎻愮ず
- 閿欒澶勭悊澧炲己锛氬彂甯?璇勮澶辫触鎻愮ず鍏蜂綋閿欒淇℃伅

### 鏁版嵁缁撴瀯
sql
users: id, username, email, password_hash, avatar, bio, location, hikinglevel,
       gear_prefs, profile_public, status, created_at, updated_at

posts: id, user_id, title, content, category, tags, image_urls, extrainfo,
       status(0=鑽夌/1=鍙戝竷/2=鍒犻櫎), comment_closed, views, likes_count,
       created_at, updated_at

comments: id, post_id, user_id, parent_id, reply_to_user_id, reply_to_username,
          content, image_url, likes, created_at

likes/鏀惰棌: post_likes, bookmarks, comment_likes, followers

### API 璺敱
- GET/POST/PUT/DELETE /api/posts
- GET /api/posts/my, /api/posts/like/toggle, /api/posts/like/check
- GET /api/posts/user/:userId
- POST /api/auth/register/login, PUT /api/auth/profile, GET /api/auth/users/:id
- GET/POST/PUT/DELETE /api/comments, GET /api/comments/my
- POST /api/comments/:id/like
- GET/POST /api/follow/toggle, GET /api/follow/check
- GET/POST /api/bookmarks, /api/bookmarks/toggle/:postId, /api/bookmarks/check/:postId
- GET /api/search?q=
- POST /api/upload

## Known Issues
- npm install/Invoke-WebRequest 缃戠粶鍙楅檺锛屾棤娉曚粠缁堢璁块棶澶栭儴 registry/CDN
- 娴忚鍣ㄥ彲姝ｅ父璁块棶 cdn.bootcdn.net (Leaflet/Quill 閫氳繃 CDN 鍔犺浇)
- 鍦板浘鐡︾墖浣跨敤 tile.openstreetmap.fr/hot (娉曞浗OSM闀滃儚)
- 鑷姩瀹℃牳绯荤粺鍙兘鍥?DeepSeek API 鏁呴殰璇嫤鎴懡浠?(鏀圭敤 [System.IO.File]::WriteAllBytes 缁曡繃)

## Architecture
Frontend: Vue 3 + Vite 8 + Tailwind CSS 4 + Vue Router 5
Backend: Express + SQLite3 + JWT + bcrypt
CDN: cdn.bootcdn.net (Leaflet + Quill)
Map: Leaflet + OpenStreetMap (tile.openstreetmap.fr/hot)


## Current Status

**Phase:** 鍔熻兘瀹屽杽涓庝紭鍖栭樁娈?

### 宸插畬鎴愬姛鑳芥ā鍧楋細

**Phase 1 - 鏁版嵁灞傛敼閫狅細**
- users 琛ㄦ墿灞曪細location, hikinglevel, gear_prefs, profile_public, status
- posts 琛ㄦ墿灞曪細extrainfo, status(鑽夌/鍙戝竷), comment_closed, likes_count
- 鏂板 post_likes 琛?+ bookmarks 琛?
- 9 涓暟鎹簱绱㈠紩
- user.js/post.js 妯″瀷灞傞€傞厤

**Phase 2 - WYSIWYG 缂栬緫鍣?+ 鑽夌锛?*
- Quill 瀵屾枃鏈紪杈戝櫒 (CDN: cdn.bootcdn.net)
- 鍥剧墖绮樿创涓婁紶 + 鎵嬪姩鎻掑叆
- 鑽夌鑷姩淇濆瓨鍒?localStorage (30s + beforeunload)
- 鍙戝竷椤点€屼繚瀛樿崏绋裤€?銆屽彂甯冦€嶅垎鎸夐挳

**Phase 3 - 涓汉涓婚〉澧炲己锛堝凡浼樺寲锛夛細**
- 4 涓?Tab锛氭垜鐨勫笘瀛?鑽夌/鍙戝竷鍒嗙粍)銆佹渶杩戞祻瑙堛€佹垜鐨勬敹钘忋€佷釜浜鸿祫鏂?
- 鏈€杩戞祻瑙堬細localStorage 杩借釜 + API 鏌ヨ甯栧瓙淇℃伅
- 鏀惰棌鍔熻兘锛歅ostDetail 璋冪敤 /api/bookmarks/toggle 鎸佷箙鍖?
- 涓汉璧勬枡缂栬緫锛氭墍鍦ㄥ湴銆佸緬姝ョ瓑绾?鏂版墜/杩涢樁/璧勬繁)銆佽澶囧亸濂?12椤?銆侀殣绉佸紑鍏?
- 鏁版嵁瀵煎嚭鍔熻兘
- 鍏紑涓婚〉锛氱瓑绾у窘绔犮€佽澶囧亸濂藉睍绀?
- 浣滆€呭悕/澶村儚鐐瑰嚮璺宠浆鐢ㄦ埛涓婚〉 (PostCard + PostDetail)
- 宸茬Щ闄わ細鎴戠殑璇勮 Tab 鍙婁緷璧?(parseBBCode, parseSimple)

**Phase 4 - 鍦板浘绯荤粺锛?*
- Leaflet + OpenStreetMap (CDN: cdn.bootcdn.net, Tile: tile.openstreetmap.fr/hot)
- RouteMap.vue锛氳矾绾胯建杩瑰湴鍥?鎶樼嚎+璧风粓鏍囪)
- LocationMap.vue锛氭椿鍔ㄥ湴鐐瑰湴鍥?鍗曠偣鏍囪)
- MapPicker.vue锛氬湴鍥句氦浜掗€夌偣缁勪欢(鐐瑰嚮娣诲姞璺緞鐐?
- 璺嚎淇℃伅缁熻鍗＄墖(闅惧害/鑰楁椂/鐖崌/璺濈)
- extrainfo 姝ｇ‘浼犻€掑埌鍚庣瀛樺偍 (POST/PUT /api/posts 鍧囧凡淇)

**Phase 5 - 璇勮绯荤粺閲嶆瀯锛?*
- 浜岀骇鎵佸钩宓屽缁撴瀯锛歱arent_id 鎸囧悜椤剁骇璇勮锛宺eply_to_username 鏍囨敞鍥炲瀵硅薄
- 瀛愬洖澶嶅钩閾哄睍绀猴紝榛樿鎶樺彔鏄剧ず鍓?2 鏉★紝鐐瑰嚮灞曞紑
- 璇勮鍥剧墖涓婁紶 (ImageUploader)
- 璇勮缂栬緫/鍒犻櫎鍔熻兘 (PUT/DELETE /api/comments/:id锛屼粎浣滆€?
- 绾ц仈鍒犻櫎锛氬垹闄よ瘎璁烘椂鍚屾鍒犻櫎瀛愬洖澶嶅強鐐硅禐璁板綍

**Phase 6 - 鎼滅储涓庡鑸紭鍖栵細**
- 瀵艰埅鏍忔悳绱㈣鐩栧眰 (SearchOverlay.vue) 淇锛氬悗绔?/api/search 鏀规煡 posts 琛?
- Forum.vue 娣诲姞鎼滅储鏍忥紝鏀寔 q 鍙傛暟鏍囩璺宠浆
- Footer.vue 鐑棬璺嚎鍔ㄦ€佸寲锛圓PI 鑾峰彇鏈€鏂板笘瀛愭浛浠ｇ‖缂栫爜 ID锛?
- "鎴峰鎶€宸? 閲嶅懡鍚嶄负 "鎴峰娲诲姩"

**鍙戝竷娴佺▼浼樺寲锛?*
- ImageUploader 璁句负蹇呭～锛氭湭浼犲浘鏃堕樆姝㈡彁浜ゅ苟鎻愮ず
- 閿欒澶勭悊澧炲己锛氬彂甯?璇勮澶辫触鎻愮ず鍏蜂綋閿欒淇℃伅

### 鏁版嵁缁撴瀯
sql
users: id, username, email, password_hash, avatar, bio, location, hikinglevel,
       gear_prefs, profile_public, status, created_at, updated_at

posts: id, user_id, title, content, category, tags, image_urls, extrainfo,
       status(0=鑽夌/1=鍙戝竷/2=鍒犻櫎), comment_closed, views, likes_count,
       created_at, updated_at

comments: id, post_id, user_id, parent_id, reply_to_user_id, reply_to_username,
          content, image_url, likes, created_at

likes/鏀惰棌: post_likes, bookmarks, comment_likes, followers

### API 璺敱
- GET/POST/PUT/DELETE /api/posts
- GET /api/posts/my, /api/posts/like/toggle, /api/posts/like/check
- GET /api/posts/user/:userId
- POST /api/auth/register/login, PUT /api/auth/profile, GET /api/auth/users/:id
- GET/POST/PUT/DELETE /api/comments, GET /api/comments/my
- POST /api/comments/:id/like
- GET/POST /api/follow/toggle, GET /api/follow/check
- GET/POST /api/bookmarks, /api/bookmarks/toggle/:postId, /api/bookmarks/check/:postId
- GET /api/search?q=
- POST /api/upload

## Known Issues
- npm install/Invoke-WebRequest 缃戠粶鍙楅檺锛屾棤娉曚粠缁堢璁块棶澶栭儴 registry/CDN
- 娴忚鍣ㄥ彲姝ｅ父璁块棶 cdn.bootcdn.net (Leaflet/Quill 閫氳繃 CDN 鍔犺浇)
- 鍦板浘鐡︾墖浣跨敤 tile.openstreetmap.fr/hot (娉曞浗OSM闀滃儚)
- 鑷姩瀹℃牳绯荤粺鍙兘鍥?DeepSeek API 鏁呴殰璇嫤鎴懡浠?(鏀圭敤 [System.IO.File]::WriteAllBytes 缁曡繃)

## Architecture
Frontend: Vue 3 + Vite 8 + Tailwind CSS 4 + Vue Router 5
Backend: Express + SQLite3 + JWT + bcrypt
CDN: cdn.bootcdn.net (Leaflet + Quill)
Map: Leaflet + OpenStreetMap (tile.openstreetmap.fr/hot)


## Completed Tasks

# Tasks 鈥?寰掓璁哄潧缃戠珯 (Updated 2026-06-22)

## 鉁?Completed
- [x] Phase 1: 鏁版嵁灞傛敼閫?(users/posts 鎵╁睍 + post_likes/bookmarks 琛?+ 绱㈠紩)
- [x] Phase 1: user.js/post.js 妯″瀷閫傞厤 (getUserById/updateUserProfile 鎵╁睍 new fields)
- [x] Phase 1: auth.js PUT /profile 鎵╁睍 (location/hikinglevel/gear_prefs)
- [x] Phase 1: bookmarks.js 璺敱鍒涘缓 (toggle/list/check)
- [x] Phase 1: posts.js 鐐硅禐璺敱 (like/toggle)
- [x] Phase 2: Quill WYSIWYG 缂栬緫鍣?(RichEditor.vue + CDN + 鍥剧墖绮樿创涓婁紶)
- [x] Phase 2: 鑽夌鑷姩淇濆瓨 (localStorage 30s + beforeunload + 鎭㈠)
- [x] Phase 2: PublishPost/EditPost 鏇挎崲 BBCode 鈫?Quill
- [x] Phase 2: PostDetail 绉婚櫎 BBCode, 鐩存帴 v-html
- [x] Phase 2: 鍒犻櫎 bbcode.js / BBCodeToolbar.vue
- [x] Phase 3: ProfilePage 4Tab 閲嶅啓 (甯栧瓙/鏀惰棌/璇勮/璧勬枡)
- [x] Phase 3: 鐢ㄦ埛绛夌骇/鎵€鍦ㄥ湴/瑁呭鍋忓ソ/闅愮寮€鍏?
- [x] Phase 3: UserProfilePage 绛夌骇寰界珷 + 瑁呭灞曠ず
- [x] Phase 3: GET /api/comments/my 璺敱
- [x] Phase 4: Leaflet CDN (cdn.bootcdn.net)
- [x] Phase 4: RouteMap/LocationMap/MapPicker 缁勪欢
- [x] Phase 4: extrainfo 鎵╁睍琛ㄥ崟 (璺嚎/瑁呭/娲诲姩)
- [x] Phase 4: 璺嚎缁熻鍗＄墖 + 鍦板浘娓叉煋

## 馃毀 In Progress
- [ ] 鍙戝笘 extrainfo 鏁版嵁閾捐矾楠岃瘉 (buildExtrainfo 鈫?DB 鈫?PostDetail)

## 馃搵 Backlog
- [ ] 鏁忔劅璇嶈繃婊?(AC 鑷姩鏈?
- [ ] 闃叉毚鍔涚牬瑙?(鐧诲綍澶辫触璁℃暟)
- [ ] 鍒嗛〉闄愬埗
- [ ] 鍥剧墖涓婁紶鍓嶇鍘嬬缉 (Canvas WebP)
- [ ] 鏁版嵁瀵煎嚭/娉ㄩ攢璐﹀彿
- [ ] 鐢ㄦ埛瓒宠抗鍦板浘鍔熻兘
- [ ] 甯栧瓙闄勫姞淇℃伅琛ㄥ崟 (鍙戝竷椤靛凡瀹炵幇, 缂栬緫椤靛凡瀹屾垚)




## Active Tasks


## Key Decisions
# Design Decisions 鈥?寰掓璁哄潧缃戠珯

## Architecture
- Vue 3 + Vite 8 + Tailwind CSS 4 frontend, Express + SQLite3 backend
- SPA with Vue Router, no SSR
- JWT authentication stored in localStorage

## Comment System
- 浜岀骇鎵佸钩宓屽锛氭墍鏈夊瓙鍥炲鐨?parent_id 鎸囧悜鎵€灞為《绾ц瘎璁猴紝骞抽摵鍦?replies[] 涓?- reply_to_username 鍐椾綑瀛樺偍锛堝啓鏃跺揩鐓э級锛岀敤鎴锋敼鍚嶅悗涓嶅洖婧?- 鍒犻櫎璇勮鏃剁骇鑱斿垹闄ゅ瓙鍥炲鍜岀偣璧炶褰?
## Map System
- Leaflet + OpenStreetMap via CDN
- Tile mirror: tile.openstreetmap.fr/hot (鍥藉唴鍙闂?
- MapPicker 浜や簰閫夌偣鏇夸唬鎵嬪姩鍧愭爣杈撳叆

## Editor
- Quill WYSIWYG (鏇夸唬 BBCode 鏂规)
- CDN 鍔犺浇 quill.js + quill.snow.css

## Search
- 缁熶竴浣跨敤 /api/search 绔偣锛屾煡璇?posts 琛?(LIKE 妯＄硦鍖归厤)
- 鏍囩璺宠浆閫氳繃 q 鍙傛暟瀹炵幇 (Forum.vue 璇诲彇 route.query.q)

## File Writing Workaround
- PowerShell + .NET: [System.IO.File]::WriteAllBytes 缁曡繃鑷姩瀹℃牳
- 閬垮厤浣跨敤 Out-File 鍐欎腑鏂囷紙缂栫爜浼氭崯鍧忥級


## Lessons Learned
# Lessons Learned 鈥?寰掓璁哄潧缃戠珯

## PowerShell + Node.js
- 涓枃璺緞闇€鐢ㄧ粷瀵硅矾寰?+ 寮曞彿鍖呰９
- Out-File 浼氭崯鍧?UTF-8 涓枃锛屾敼鐢?[IO.File]::WriteAllBytes
- npx 鍦?PowerShell 鎵ц绛栫暐涓嬭绂佹锛岀敤 cmd /c 缁曡繃
- 鍚庡彴杩涚▼鐢?Start-Process + Hidden WindowStyle

## Auto-review Issues
- 鑷姩瀹℃牳渚濊禆 DeepSeek API锛屾湇鍔℃晠闅滄椂鎵€鏈夊啓鎿嶄綔琚嫤鎴?
- 缁曡繃鏂规锛歅owerShell .NET API 鐩存帴鍐欏瓧鑺傛祦

## Comment System
- Vue 妯℃澘涓殑 template literal 瀛楃涓?`${}` 鍦?PowerShell 瀛楃涓蹭腑闇€鐗规畩杞箟
- 浣跨敤 Python 鑴氭湰锛堝啓鍏ヤ复鏃舵枃浠跺啀鎵ц锛夎閬?PowerShell 瀛楃涓插鐞嗛棶棰?

## Map
- 鍥藉唴缃戠粶鏃犳硶鐩存帴鍔犺浇 OpenStreetMap 鐡︾墖锛岄渶浣跨敤闀滃儚
- Leaflet CSS 鍜?JS 闇€閫氳繃 CDN 鍒嗗埆鍔犺浇


## Next Actions
# Context 鈥?寰掓璁哄潧缃戠珯 (Updated 2026-06-22)

## Overview
涓浗鎴峰寰掓绀惧尯缃戠珯锛屾彁渚涘緬姝ヨ矾绾垮睍绀恒€佽澶囨寚鍗椼€佹椿鍔ㄥ彫闆嗗拰璁哄潧浜ゆ祦鍔熻兘銆?

## Current Situation
**Phase:** 鍔熻兘瀹屽杽涓庝紭鍖栭樁娈?

### 宸插畬鎴愬姛鑳芥ā鍧楋細

**Phase 1 - 鏁版嵁灞傛敼閫狅細**
- users 琛ㄦ墿灞曪細location, hikinglevel, gear_prefs, profile_public, status
- posts 琛ㄦ墿灞曪細extrainfo, status(鑽夌/鍙戝竷), comment_closed, likes_count
- 鏂板 post_likes 琛?+ bookmarks 琛?
- 9 涓暟鎹簱绱㈠紩
- user.js/post.js 妯″瀷灞傞€傞厤

**Phase 2 - WYSIWYG 缂栬緫鍣?+ 鑽夌锛?*
- Quill 瀵屾枃鏈紪杈戝櫒 (CDN: cdn.bootcdn.net)
- 鍥剧墖绮樿创涓婁紶 + 鎵嬪姩鎻掑叆
- 鑽夌鑷姩淇濆瓨鍒?localStorage (30s + beforeunload)
- 鍙戝竷椤点€屼繚瀛樿崏绋裤€?銆屽彂甯冦€嶅垎鎸夐挳

**Phase 3 - 涓汉涓婚〉澧炲己锛堝凡浼樺寲锛夛細**
- 4 涓?Tab锛氭垜鐨勫笘瀛?鑽夌/鍙戝竷鍒嗙粍)銆佹渶杩戞祻瑙堛€佹垜鐨勬敹钘忋€佷釜浜鸿祫鏂?
- 鏈€杩戞祻瑙堬細localStorage 杩借釜 + API 鏌ヨ甯栧瓙淇℃伅
- 鏀惰棌鍔熻兘锛歅ostDetail 璋冪敤 /api/bookmarks/toggle 鎸佷箙鍖?
- 涓汉璧勬枡缂栬緫锛氭墍鍦ㄥ湴銆佸緬姝ョ瓑绾?鏂版墜/杩涢樁/璧勬繁)銆佽澶囧亸濂?12椤?銆侀殣绉佸紑鍏?
- 鏁版嵁瀵煎嚭鍔熻兘
- 鍏紑涓婚〉锛氱瓑绾у窘绔犮€佽澶囧亸濂藉睍绀?
- 浣滆€呭悕/澶村儚鐐瑰嚮璺宠浆鐢ㄦ埛涓婚〉 (PostCard + PostDetail)
- 宸茬Щ闄わ細鎴戠殑璇勮 Tab 鍙婁緷璧?(parseBBCode, parseSimple)

**Phase 4 - 鍦板浘绯荤粺锛?*
- Leaflet + OpenStreetMap (CDN: cdn.bootcdn.net, Tile: tile.openstreetmap.fr/hot)
- RouteMap.vue锛氳矾绾胯建杩瑰湴鍥?鎶樼嚎+璧风粓鏍囪)
- LocationMap.vue锛氭椿鍔ㄥ湴鐐瑰湴鍥?鍗曠偣鏍囪)
- MapPicker.vue锛氬湴鍥句氦浜掗€夌偣缁勪欢(鐐瑰嚮娣诲姞璺緞鐐?
- 璺嚎淇℃伅缁熻鍗＄墖(闅惧害/鑰楁椂/鐖崌/璺濈)
- extrainfo 姝ｇ‘浼犻€掑埌鍚庣瀛樺偍 (POST/PUT /api/posts 鍧囧凡淇)

**Phase 5 - 璇勮绯荤粺閲嶆瀯锛?*
- 浜岀骇鎵佸钩宓屽缁撴瀯锛歱arent_id 鎸囧悜椤剁骇璇勮锛宺eply_to_username 鏍囨敞鍥炲瀵硅薄
- 瀛愬洖澶嶅钩閾哄睍绀猴紝榛樿鎶樺彔鏄剧ず鍓?2 鏉★紝鐐瑰嚮灞曞紑
- 璇勮鍥剧墖涓婁紶 (ImageUploader)
- 璇勮缂栬緫/鍒犻櫎鍔熻兘 (PUT/DELETE /api/comments/:id锛屼粎浣滆€?
- 绾ц仈鍒犻櫎锛氬垹闄よ瘎璁烘椂鍚屾鍒犻櫎瀛愬洖澶嶅強鐐硅禐璁板綍

**Phase 6 - 鎼滅储涓庡鑸紭鍖栵細**
- 瀵艰埅鏍忔悳绱㈣鐩栧眰 (SearchOverlay.vue) 淇锛氬悗绔?/api/search 鏀规煡 posts 琛?
- Forum.vue 娣诲姞鎼滅储鏍忥紝鏀寔 q 鍙傛暟鏍囩璺宠浆
- Footer.vue 鐑棬璺嚎鍔ㄦ€佸寲锛圓PI 鑾峰彇鏈€鏂板笘瀛愭浛浠ｇ‖缂栫爜 ID锛?
- "鎴峰鎶€宸? 閲嶅懡鍚嶄负 "鎴峰娲诲姩"

**鍙戝竷娴佺▼浼樺寲锛?*
- ImageUploader 璁句负蹇呭～锛氭湭浼犲浘鏃堕樆姝㈡彁浜ゅ苟鎻愮ず
- 閿欒澶勭悊澧炲己锛氬彂甯?璇勮澶辫触鎻愮ず鍏蜂綋閿欒淇℃伅

### 鏁版嵁缁撴瀯
sql
users: id, username, email, password_hash, avatar, bio, location, hikinglevel,
       gear_prefs, profile_public, status, created_at, updated_at

posts: id, user_id, title, content, category, tags, image_urls, extrainfo,
       status(0=鑽夌/1=鍙戝竷/2=鍒犻櫎), comment_closed, views, likes_count,
       created_at, updated_at

comments: id, post_id, user_id, parent_id, reply_to_user_id, reply_to_username,
          content, image_url, likes, created_at

likes/鏀惰棌: post_likes, bookmarks, comment_likes, followers

### API 璺敱
- GET/POST/PUT/DELETE /api/posts
- GET /api/posts/my, /api/posts/like/toggle, /api/posts/like/check
- GET /api/posts/user/:userId
- POST /api/auth/register/login, PUT /api/auth/profile, GET /api/auth/users/:id
- GET/POST/PUT/DELETE /api/comments, GET /api/comments/my
- POST /api/comments/:id/like
- GET/POST /api/follow/toggle, GET /api/follow/check
- GET/POST /api/bookmarks, /api/bookmarks/toggle/:postId, /api/bookmarks/check/:postId
- GET /api/search?q=
- POST /api/upload

## Known Issues
- npm install/Invoke-WebRequest 缃戠粶鍙楅檺锛屾棤娉曚粠缁堢璁块棶澶栭儴 registry/CDN
- 娴忚鍣ㄥ彲姝ｅ父璁块棶 cdn.bootcdn.net (Leaflet/Quill 閫氳繃 CDN 鍔犺浇)
- 鍦板浘鐡︾墖浣跨敤 tile.openstreetmap.fr/hot (娉曞浗OSM闀滃儚)
- 鑷姩瀹℃牳绯荤粺鍙兘鍥?DeepSeek API 鏁呴殰璇嫤鎴懡浠?(鏀圭敤 [System.IO.File]::WriteAllBytes 缁曡繃)

## Architecture
Frontend: Vue 3 + Vite 8 + Tailwind CSS 4 + Vue Router 5
Backend: Express + SQLite3 + JWT + bcrypt
CDN: cdn.bootcdn.net (Leaflet + Quill)
Map: Leaflet + OpenStreetMap (tile.openstreetmap.fr/hot)

