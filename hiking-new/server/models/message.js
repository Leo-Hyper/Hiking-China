const { all, get, run } = require("./db");

async function isConversationMember(conversationId, userId) {
  const row = await get(
    "SELECT 1 AS ok FROM conversation_members WHERE conversation_id = ? AND user_id = ?",
    [conversationId, userId]
  );
  return Boolean(row);
}

async function listConversations(userId) {
  return all(
    `SELECT c.id, c.type, c.title, c.updated_at,
            other.id AS other_user_id, other.username AS other_username, other.avatar AS other_avatar,
            last_message.content AS last_message, last_message.created_at AS last_message_at,
            (SELECT COUNT(*) FROM messages unread
             WHERE unread.conversation_id = c.id
               AND unread.sender_id != ?
               AND (cm.last_read_at IS NULL OR unread.created_at > cm.last_read_at)) AS unread_count
     FROM conversations c
     JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = ?
     JOIN conversation_members other_member
       ON other_member.conversation_id = c.id AND other_member.user_id != ?
     JOIN users other ON other.id = other_member.user_id
     LEFT JOIN messages last_message
       ON last_message.id = (SELECT id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1)
     ORDER BY c.updated_at DESC
     LIMIT 100`,
    [userId, userId, userId]
  );
}

async function getOrCreateDirectConversation(userId, targetUserId) {
  if (Number(userId) === Number(targetUserId)) throw new Error("不能给自己发私信");
  const target = await get("SELECT id FROM users WHERE id = ? AND account_status = 'active'", [targetUserId]);
  if (!target) throw new Error("用户不存在");

  const existing = await get(
    `SELECT c.id FROM conversations c
     JOIN conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = ?
     JOIN conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = ?
     WHERE c.type = 'direct'
       AND (SELECT COUNT(*) FROM conversation_members cm WHERE cm.conversation_id = c.id) = 2
     LIMIT 1`,
    [userId, targetUserId]
  );
  if (existing) return { id: Number(existing.id), created: false };

  const conversation = await run(
    "INSERT INTO conversations (type, created_by) VALUES ('direct', ?)",
    [userId]
  );
  const conversationId = Number(conversation.lastInsertRowid);
  await run("INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)", [conversationId, userId]);
  await run("INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)", [conversationId, targetUserId]);
  return { id: conversationId, created: true };
}

async function listMessages(conversationId, userId, limit = 100) {
  if (!(await isConversationMember(conversationId, userId))) throw new Error("无权查看该会话");
  return all(
    `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
            u.username AS sender_name, u.avatar AS sender_avatar
     FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC
     LIMIT ?`,
    [conversationId, Math.min(Number(limit) || 100, 200)]
  );
}

async function sendMessage(conversationId, userId, content) {
  if (!(await isConversationMember(conversationId, userId))) throw new Error("无权发送消息");
  const text = String(content || "").trim();
  if (!text || text.length > 2000) throw new Error("消息内容需为1-2000字");
  const result = await run(
    "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)",
    [conversationId, userId, text]
  );
  await run("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", [conversationId]);
  return { id: Number(result.lastInsertRowid) };
}

async function markConversationRead(conversationId, userId) {
  if (!(await isConversationMember(conversationId, userId))) throw new Error("无权操作该会话");
  await run(
    "UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?",
    [new Date().toISOString(), conversationId, userId]
  );
  return { ok: true };
}

module.exports = {
  listConversations,
  getOrCreateDirectConversation,
  listMessages,
  sendMessage,
  markConversationRead,
};
