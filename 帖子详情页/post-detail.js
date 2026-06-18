// 帖子详情页通用功能代码

// 记录当前正在回复的评论ID
let replyingToCommentId = null;

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

// 收藏按钮事件
document.getElementById('bookmark-post').addEventListener('click', function() {
    this.innerHTML = '<i class="fas fa-bookmark"></i> 已收藏';
    alert('已收藏该帖子！');
});

// 分享按钮事件
document.getElementById('share-post').addEventListener('click', function() {
    alert('分享功能已触发！');
});

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

// 初始化页面
window.addEventListener('DOMContentLoaded', function() {
    // 设置初始评论数量
    if (document.getElementById('comments-count')) {
        document.getElementById('comments-count').textContent = postData.commentsList.length;
    }
    
    // 渲染评论
    renderComments();
});