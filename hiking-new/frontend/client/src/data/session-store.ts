import * as api from '../api';
import { invalidateGetCache, setToken } from '../utils/http';
import type { HikingUser } from './hiking-types';
import { mapUser } from './mappers';
import { notify, readJson, SESSION_USER_KEY, writeJson } from './store-runtime';

export function getCurrentUser(): HikingUser | null {
  return readJson<HikingUser | null>(SESSION_USER_KEY, null);
}

function saveSessionUser(user: HikingUser): void {
  writeJson(SESSION_USER_KEY, user);
}

export async function registerUser(username: string, email: string, password: string): Promise<HikingUser> {
  const data = await api.register({ username, email, password });
  setToken(data.token);
  const user = mapUser(data.user);
  saveSessionUser(user);
  invalidateGetCache('/api/auth/users');
  notify();
  return user;
}

export async function loginUser(email: string, password: string): Promise<HikingUser> {
  const data = await api.login({ email, password });
  setToken(data.token);
  const user = mapUser(data.user);
  saveSessionUser(user);
  notify();
  return user;
}

export function logoutUser(): void {
  setToken(null);
  try {
    localStorage.removeItem(SESSION_USER_KEY);
  } catch {
    // Storage can be unavailable in private browsing modes.
  }
  notify();
}

export async function updateProfile(
  patch: Partial<Pick<HikingUser, 'username' | 'bio' | 'location' | 'hikinglevel' | 'gearPrefs' | 'profilePublic' | 'avatar'>>,
): Promise<HikingUser> {
  const body: Record<string, unknown> = {};
  if (patch.username !== undefined) body.username = patch.username;
  if (patch.avatar !== undefined) body.avatar = patch.avatar;
  if (patch.bio !== undefined) body.bio = patch.bio;
  if (patch.location !== undefined) body.location = patch.location;
  if (patch.hikinglevel !== undefined) body.hikinglevel = patch.hikinglevel;
  if (patch.gearPrefs !== undefined) body.gear_prefs = patch.gearPrefs;
  if (patch.profilePublic !== undefined) body.profile_public = patch.profilePublic ? 1 : 0;
  const data = await api.updateProfile(body);
  const user = mapUser(data.user);
  saveSessionUser(user);
  invalidateGetCache('/api/auth/users');
  notify();
  return user;
}

export async function sendVerificationEmail(): Promise<void> {
  await api.sendVerification();
}

export async function verifyEmail(token: string): Promise<void> {
  await api.verifyEmail(token);
  const current = getCurrentUser();
  if (current) {
    saveSessionUser({ ...current, emailVerified: true });
    notify();
  }
}

export async function requestPasswordReset(email: string): Promise<string> {
  const data = await api.forgotPassword(email);
  return data.message;
}

export async function resetPassword(token: string, password: string): Promise<string> {
  const data = await api.resetPassword(token, password);
  return data.message;
}

export async function requestAccountDeletion(email: string, password: string): Promise<string> {
  const data = await api.requestAccountDeletion(email, password);
  return data.message;
}

export async function cancelAccountDeletion(): Promise<string> {
  const data = await api.cancelAccountDeletion();
  return data.message;
}
