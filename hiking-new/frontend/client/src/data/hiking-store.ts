// Compatibility facade: existing pages keep importing from this module while
// domain logic lives in focused stores under the same directory.
export { getStoreVersion, subscribeStore } from './store-runtime';
export {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
} from './session-store';
export {
  createPost,
  deletePost,
  getPostById,
  listMyPosts,
  listPosts,
  listRecentViewPosts,
  listUserPosts,
  recordView,
  updatePost,
} from './post-store';
export type { ListPostsOptions } from './post-store';
export {
  addComment,
  deleteComment,
  editComment,
  isCommentLiked,
  listComments,
  toggleLikeComment,
} from './comment-store';
export type { AddCommentInput } from './comment-store';
export {
  createEvent,
  getEventById,
  isEventSignedUp,
  listEvents,
  toggleEventSignup,
} from './event-store';
export {
  isBookmarked,
  isFollowing,
  listBookmarkedPosts,
  toggleBookmark,
  toggleFollow,
} from './social-store';
export { getUserById, getUserStats } from './user-store';
