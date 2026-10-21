import * as api from '../api';
import type { Post } from './hiking-types';
import { mapPost } from './mappers';

export async function toggleBookmark(postId: number): Promise<boolean> {
  const data = await api.toggleBookmark(postId);
  return data.bookmarked;
}

export async function isBookmarked(postId: number): Promise<boolean> {
  const data = await api.checkBookmark(postId);
  return data.bookmarked;
}

export async function listBookmarkedPosts(): Promise<Post[]> {
  const data = await api.listBookmarks();
  return (data.bookmarks || []).map(mapPost);
}

export async function toggleFollow(userId: number): Promise<boolean> {
  const data = await api.toggleFollow(userId);
  return data.following;
}

export async function isFollowing(userId: number): Promise<boolean> {
  const data = await api.checkFollow(userId);
  return data.following;
}
