const { get, run } = require("./db");

// 切换关注状态（关注/取关）
async function toggleFollow(followerId, followingId) {
  const row = await get(
    "SELECT * FROM followers WHERE follower_id = ? AND following_id = ?",
    [followerId, followingId]
  );
  if (row) {
    // 已关注 → 取关
    await run("DELETE FROM followers WHERE follower_id = ? AND following_id = ?", [followerId, followingId]);
    return { following: false };
  }
  // 未关注 → 关注
  await run("INSERT INTO followers (follower_id, following_id) VALUES (?, ?)", [followerId, followingId]);
  return { following: true };
}

// 查询是否关注
async function isFollowing(followerId, followingId) {
  const row = await get(
    "SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?",
    [followerId, followingId]
  );
  return !!row;
}

// 获取关注数量
async function getFollowCounts(userId) {
  const row = await get(
    "SELECT (SELECT COUNT(*) FROM followers WHERE following_id = ?) as followers_count, (SELECT COUNT(*) FROM followers WHERE follower_id = ?) as following_count",
    [userId, userId]
  );
  return { followers: row.followers_count, following: row.following_count };
}

module.exports = { toggleFollow, isFollowing, getFollowCounts };