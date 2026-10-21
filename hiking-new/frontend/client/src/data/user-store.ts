import * as api from '../api';
import type { HikingUser, UserStats } from './hiking-types';
import { mapUser } from './mappers';

export async function getUserById(id: number): Promise<HikingUser | undefined> {
  try {
    const data = await api.getPublicUser(id);
    return data.user ? mapUser(data.user) : undefined;
  } catch {
    return undefined;
  }
}

export async function getUserStats(userId: number): Promise<UserStats> {
  try {
    const data = await api.getPublicUser(userId);
    return {
      postCount: Number(data.user.post_count ?? 0),
      followersCount: Number(data.user.followers_count ?? 0),
      followingCount: Number(data.user.following_count ?? 0),
    };
  } catch {
    return { postCount: 0, followersCount: 0, followingCount: 0 };
  }
}
