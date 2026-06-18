# post-detail.js 代码说明

## 文件概述

`post-detail.js`是帖子详情页的通用功能代码，负责实现评论展示、点赞、收藏、分享、评论提交等交互功能。该文件与HTML页面结合使用，通过DOM操作实现动态内容更新和用户交互。

## 变量说明

### replyingToCommentId
```javascript
// 记录当前正在回复的评论ID
let replyingToCommentId = null;
```

- **功能**：全局变量，用于记录用户当前正在回复的评论ID
- **初始值**：`null`，表示用户当前未处于回复状态
- **用途**：当用户点击某条评论的"回复"按钮时，该变量会被设置为对应评论的ID，提交评论时根据该变量判断是发表新评论还是回复某条评论

## 功能函数详解

### renderComments() 函数

```javascript
// 渲染评论列表
function renderComments() {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    
    postData.commentsList.forEach(comment => {
        // 创建评论元素
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${comment.date}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <div class="comment-action like-action" data-id="${comment.id}">
                    <i class="far fa-thumbs-up"></i> ${comment.likes}
                </div>
                <div class="comment-action reply-action" data-id="${comment.id}">
                    <i class="far fa-comment"></i> 回复
                </div>
            </div>
        `;
        
        // 如果有回复，添加回复列表
        if (comment.replies && comment.replies.length > 0) {
            const repliesElement = document.createElement('div');
            repliesElement.className = 'replies';
            
            comment.replies.forEach(reply => {
                const replyElement = document.createElement('div');
                replyElement.className = 'reply';
                replyElement.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-author">${reply.author}</span>
                        <span class="comment-date">${reply.date}</span>
                    </div>
                    <div class="comment-content">${reply.content}</div>
                    <div class="comment-actions">
                        <div class="comment-action reply-like-action" data-id="${reply.id}">
                            <i class="far fa-thumbs-up"></i> ${reply.likes}
                        </div>
                    </div>
                `;
                repliesElement.appendChild(replyElement);
            });
            
            commentElement.appendChild(repliesElement);
        }
        
        commentsList.appendChild(commentElement);
    });
    
    // 添加点赞事件监听
    document.querySelectorAll('.like-action').forEach(element => {
        element.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            const comment = postData.commentsList.find(c => c.id === id);
            if (comment) {
                comment.likes++;
                this.innerHTML = `<i class="far fa-thumbs-up"></i> ${comment.likes}`;
            }
        });
    });
    
    document.querySelectorAll('.reply-like-action').forEach(element => {
        element.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            // 查找回复并增加点赞数
            postData.commentsList.forEach(comment => {
                const reply = comment.replies.find(r => r.id === id);
                if (reply) {
                    reply.likes++;
                    this.innerHTML = `<i class="far fa-thumbs-up"></i> ${reply.likes}`;
                }
            });
        });
    });
    
    // 添加回复事件监听
    document.querySelectorAll('.reply-action').forEach(element => {
        element.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            const comment = postData.commentsList.find(c => c.id === id);
            // 记录正在回复的评论ID
            replyingToCommentId = id;
            document.getElementById('comment-text').placeholder = `回复 @${comment.author}：`;
            document.getElementById('comment-text').focus();
        });
    });
}
```

- **功能**：渲染评论列表，包括主评论和回复，并为每个评论添加点赞和回复功能
- **实现步骤**：
  1. 获取评论列表容器元素，清空原有内容
  2. 遍历`postData.commentsList`中的每个评论对象
  3. 为每个评论创建HTML元素，包括评论头部（作者、日期）、评论内容和操作按钮（点赞、回复）
  4. 如果评论有回复，递归创建回复列表
  5. 将评论元素添加到评论列表容器中
  6. 为所有点赞按钮添加点击事件监听
  7. 为所有回复按钮添加点击事件监听

- **事件监听**：
  - `like-action`：点击后增加对应评论的点赞数并更新显示
  - `reply-like-action`：点击后增加对应回复的点赞数并更新显示
  - `reply-action`：点击后设置回复状态，更新评论框占位符并聚焦

### 点赞按钮事件

```javascript
// 点赞按钮事件
if (document.getElementById('like-post')) {
    document.getElementById('like-post').addEventListener('click', function() {
        postData.likes++;
        if (document.getElementById('post-detail-likes')) {
            document.getElementById('post-detail-likes').textContent = postData.likes;
        }
        this.innerHTML = '<i class="fas fa-heart"></i> 已点赞';
        this.disabled = true;
    });
}
```

- **功能**：实现帖子点赞功能
- **实现逻辑**：
  1. 首先检查页面中是否存在点赞按钮元素
  2. 为点赞按钮添加点击事件监听器
  3. 点击时：
     - 增加`postData.likes`点赞计数
     - 更新页面中显示点赞数的元素内容
     - 改变按钮样式和文字（变为红色心形和"已点赞"）
     - 禁用按钮，防止重复点赞

### 收藏按钮事件

```javascript
// 收藏按钮事件
document.getElementById('bookmark-post').addEventListener('click', function() {
    this.innerHTML = '<i class="fas fa-bookmark"></i> 已收藏';
    alert('已收藏该帖子！');
});
```

- **功能**：实现帖子收藏功能
- **实现逻辑**：
  1. 获取收藏按钮元素并添加点击事件监听器
  2. 点击时：
     - 改变按钮样式和文字（变为实心书签图标和"已收藏"）
     - 弹出提示框，提示用户已收藏帖子

### 分享按钮事件

```javascript
// 分享按钮事件
document.getElementById('share-post').addEventListener('click', function() {
    alert('分享功能已触发！');
});
```

- **功能**：实现帖子分享功能
- **实现逻辑**：
  1. 获取分享按钮元素并添加点击事件监听器
  2. 点击时弹出提示框，提示分享功能已触发
  3. 注：此处仅为示例实现，实际应用中应替换为具体的分享逻辑

### 提交评论事件

```javascript
// 提交评论事件
if (document.getElementById('submit-comment')) {
    document.getElementById('submit-comment').addEventListener('click', function() {
        const commentText = document.getElementById('comment-text').value.trim();
        if (commentText) {
            // 创建新评论或回复
            const newComment = {
                id: Date.now(),
                author: "当前用户", // 实际应用中应替换为登录用户
                date: new Date().toLocaleString(),
                content: commentText,
                likes: 0
            };
            
            if (replyingToCommentId) {
                // 如果是回复，找到被回复的评论并添加到其replies数组中
                const parentComment = postData.commentsList.find(c => c.id === replyingToCommentId);
                if (parentComment) {
                    if (!parentComment.replies) {
                        parentComment.replies = [];
                    }
                    parentComment.replies.push(newComment);
                    alert('回复发表成功！');
                }
                // 重置回复状态
                replyingToCommentId = null;
            } else {
                // 如果是新评论，添加到评论列表顶部
                newComment.replies = [];
                postData.commentsList.unshift(newComment);
                postData.comments++;
                if (document.getElementById('comments-count')) {
                    document.getElementById('comments-count').textContent = postData.comments;
                }
                if (document.getElementById('post-detail-comments')) {
                    document.getElementById('post-detail-comments').textContent = postData.comments;
                }
                alert('评论发表成功！');
            }
            
            // 清空评论框
            document.getElementById('comment-text').value = '';
            document.getElementById('comment-text').placeholder = '写下你的评论...';
            
            // 重新渲染评论列表
            renderComments();
        } else {
            alert('请输入评论内容！');
        }
    });
}
```

- **功能**：实现评论提交功能，支持发表新评论和回复某条评论
- **实现逻辑**：
  1. 检查页面中是否存在提交评论按钮
  2. 为提交按钮添加点击事件监听器
  3. 点击时：
     - 获取评论框中的文本内容并去除首尾空格
     - 验证评论内容是否为空
     - 创建新评论对象，包含ID、作者、日期、内容和点赞数
     - 根据`replyingToCommentId`判断是发表新评论还是回复：
       - 如果是回复（`replyingToCommentId`不为null），将新评论添加到被回复评论的`replies`数组中
       - 如果是新评论，将新评论添加到评论列表顶部
     - 更新相关统计数据
     - 显示成功提示
     - 清空评论框并重置状态
     - 重新渲染评论列表

### 返回按钮事件

```javascript
// 返回按钮事件
document.querySelector('.back-button').addEventListener('click', function(e) {
    if (window.history.length > 1) {
        // 有历史记录时返回上一页
        window.history.back();
    } else {
        // 没有历史记录时跳转到论坛页面
        alert('返回论坛首页');
        // 实际应用中应替换为真实的论坛页面URL
    }
});
```

- **功能**：实现返回按钮功能
- **实现逻辑**：
  1. 获取返回按钮元素并添加点击事件监听器
  2. 点击时：
     - 检查浏览器历史记录长度
     - 如果有历史记录，使用`window.history.back()`返回上一页
     - 如果没有历史记录，弹出提示（实际应用中应跳转到论坛首页）

### 页面初始化

```javascript
// 初始化页面
window.addEventListener('DOMContentLoaded', function() {
    // 设置初始评论数量
    if (document.getElementById('comments-count')) {
        document.getElementById('comments-count').textContent = postData.commentsList.length;
    }
    
    // 渲染评论
    renderComments();
});
```

- **功能**：页面加载完成后初始化内容
- **实现逻辑**：
  1. 监听页面`DOMContentLoaded`事件，确保页面DOM元素已完全加载
  2. 设置初始评论数量显示
  3. 调用`renderComments()`函数渲染评论列表

## 代码依赖

该文件依赖于以下内容：

1. **HTML页面结构**：需要包含特定ID的元素，如`comments-list`、`like-post`、`bookmark-post`、`share-post`等
2. **postData对象**：需要在页面中定义`postData`对象，包含以下属性：
   - `likes`：帖子点赞数
   - `comments`：帖子评论数
   - `commentsList`：评论列表数组，包含评论对象
3. **Font Awesome图标**：使用了Font Awesome图标库，需要在页面中引入

## 数据结构

### postData.commentsList 数据结构

```javascript
postData.commentsList = [
    {
        id: 1,
        author: "用户名",
        date: "2023-10-01 10:00",
        content: "评论内容",
        likes: 0,
        replies: [
            {
                id: 2,
                author: "回复者",
                date: "2023-10-01 10:30",
                content: "回复内容",
                likes: 0
            }
        ]
    }
];
```

## 使用说明

1. 在帖子详情页HTML文件中引入该JavaScript文件
2. 确保页面中包含所需的HTML元素和`postData`对象
3. 根据实际需求修改代码中的提示信息和跳转逻辑
4. 可以根据需要扩展功能，如添加评论删除、评论排序等

## 代码优化建议

1. **错误处理**：增加对`postData`对象和DOM元素的存在性检查，提高代码健壮性
2. **模块化**：将不同功能拆分为独立模块，提高代码可维护性
3. **数据持久化**：添加本地存储或后端API调用，实现数据持久化
4. **性能优化**：对于大量评论的情况，可以实现分页加载或虚拟滚动
5. **无障碍支持**：添加适当的ARIA属性，提高页面无障碍性
6. **用户体验**：优化提示方式，使用更友好的通知组件代替alert弹窗

## 浏览器兼容性

该代码使用了现代JavaScript特性和DOM API，兼容所有现代浏览器（Chrome、Firefox、Safari、Edge）。对于旧版浏览器（如IE11），可能需要进行兼容性处理。