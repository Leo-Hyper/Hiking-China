import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2 } from 'lucide-react';
import {
  cancelAccountDeletion,
  logoutUser,
  requestAccountDeletion,
  updateProfile,
} from '@client/src/data/hiking-store';
import { uploadAvatarImage } from '@client/src/data/avatar-service';
import type { HikingUser } from '@client/src/data/hiking-types';
import { UserAvatar } from '@client/src/components/ui/user-avatar';

interface ProfileEditFormProps {
  user: HikingUser;
}

const GEAR_OPTIONS: string[] = [
  '徒步鞋',
  '背包',
  '帐篷',
  '登山杖',
  '冲锋衣',
  '登山炉',
  '头灯',
  '冰爪',
  '雪套',
  '睡袋',
  '冲锋裤',
  '指南针',
];

const ProfileEditForm = ({ user }: ProfileEditFormProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUsername, setEditingUsername] = useState<string>(user.username || '');
  const [editingBio, setEditingBio] = useState<string>(user.bio || '');
  const [editingLocation, setEditingLocation] = useState<string>(user.location || '');
  const [editingHikinglevel, setEditingHikinglevel] = useState<number>(user.hikinglevel || 1);
  const [editingGear, setEditingGear] = useState<string[]>(
    Array.isArray(user.gearPrefs) ? user.gearPrefs : []
  );
  const [editingProfilePublic, setEditingProfilePublic] = useState<boolean>(
    user.profilePublic !== false
  );
  const [editingAvatar, setEditingAvatar] = useState<string | undefined>(user.avatar);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMsg, setSaveMsg] = useState<string>('');
  const [saveError, setSaveError] = useState<boolean>(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toggleGear = (gear: string): void => {
    setEditingGear((prev: string[]) =>
      prev.includes(gear) ? prev.filter((g: string) => g !== gear) : [...prev, gear]
    );
  };

  const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file: File | undefined = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError('');
    try {
      const url: string = await uploadAvatarImage(file);
      setEditingAvatar(url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : '头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async (): Promise<void> => {
    setSaving(true);
    setSaveMsg('');
    setSaveError(false);
    try {
      await updateProfile({
        username: editingUsername.trim(),
        bio: editingBio.trim(),
        location: editingLocation.trim(),
        hikinglevel: editingHikinglevel,
        gearPrefs: editingGear,
        profilePublic: editingProfilePublic,
        avatar: editingAvatar,
      });
      setSaveMsg('保存成功！');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : '保存失败');
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const exportData = (): void => {
    const data: Record<string, unknown> = {
      username: user.username,
      email: user.email,
      bio: user.bio,
      location: user.location,
      hikinglevel: user.hikinglevel,
      gear_prefs: user.gearPrefs,
      created_at: user.createdAt,
    };
    const blob: Blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = '个人数据.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = (): void => {
    logoutUser();
    navigate('/login');
  };

  const requestDeletion = async (): Promise<void> => {
    if (!user.email) {
      setDeleteMessage('当前账号缺少邮箱，无法自助注销');
      return;
    }
    setDeleteLoading(true);
    setDeleteMessage('');
    try {
      setDeleteMessage(await requestAccountDeletion(user.email, deletePassword));
      setDeletePassword('');
    } catch (err) {
      setDeleteMessage(err instanceof Error ? err.message : '注销申请失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeletion = async (): Promise<void> => {
    setDeleteLoading(true);
    setDeleteMessage('');
    try {
      setDeleteMessage(await cancelAccountDeletion());
    } catch (err) {
      setDeleteMessage(err instanceof Error ? err.message : '撤销失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="space-y-5">
        {/* 头像 */}
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">头像</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => void handleAvatarSelect(e)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="group relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-pine-200 transition-colors hover:ring-pine-400 focus:outline-none focus:ring-pine-500"
            title="更换头像"
          >
            <UserAvatar
              src={editingAvatar}
              name={user.username}
              className="w-full h-full"
              fallbackClassName="text-xl md:text-3xl"
            />
            <span
              className={`absolute inset-0 flex items-center justify-center gap-1 bg-ink/55 text-paper text-[10px] font-medium transition-opacity ${
                uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {uploadingAvatar ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Camera size={13} />
                  更换
                </>
              )}
            </span>
          </button>
          {avatarError && <p className="mt-1.5 text-xs text-destructive">{avatarError}</p>}
        </div>

        {/* 用户名 */}
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">用户名</label>
          <input
            value={editingUsername}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingUsername(e.target.value)}
            type="text"
            maxLength={20}
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
          />
        </div>

        {/* 个人简介 */}
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">个人简介</label>
          <textarea
            value={editingBio}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingBio(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="介绍一下你自己..."
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20 resize-none"
          ></textarea>
        </div>

        {/* 所在地 */}
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">所在地</label>
          <input
            value={editingLocation}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingLocation(e.target.value)}
            type="text"
            maxLength={64}
            placeholder="例如：四川·成都"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
          />
        </div>

        {/* 徒步等级 */}
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">徒步等级</label>
          <select
            value={editingHikinglevel}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setEditingHikinglevel(Number(e.target.value))
            }
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
          >
            <option value={1}>新手</option>
            <option value={2}>进阶</option>
            <option value={3}>资深</option>
          </select>
        </div>

        {/* 装备偏好 */}
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">装备偏好</label>
          <div className="flex flex-wrap gap-2">
            {GEAR_OPTIONS.map((gear: string) => (
              <button
                key={gear}
                onClick={() => toggleGear(gear)}
                type="button"
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  editingGear.includes(gear)
                    ? 'border-pine-300 bg-pine-50 text-pine-700'
                    : 'border-border bg-card text-muted-foreground hover:border-pine-300'
                }`}
              >
                {gear}
              </button>
            ))}
          </div>
        </div>

        {/* 隐私设置 */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-ink">资料公开</span>
          <button
            onClick={() => setEditingProfilePublic(!editingProfilePublic)}
            type="button"
            className={`relative w-11 h-6 rounded-full transition-colors ${
              editingProfilePublic ? 'bg-pine-600' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-paper rounded-full shadow transition-transform ${
                editingProfilePublic ? 'translate-x-5' : ''
              }`}
            ></span>
          </button>
        </div>

        {/* 保存 */}
        <div className="pt-2">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full bg-pine-700 hover:bg-pine-800 text-paper rounded-lg px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
          {saveMsg && (
            <p className={`text-sm mt-2 text-center ${saveError ? 'text-destructive' : 'text-pine-600'}`}>
              {saveMsg}
            </p>
          )}
        </div>

        {/* 数据管理 */}
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-sm font-medium text-ink mb-2">数据管理</p>
          <button onClick={exportData} className="block text-xs font-medium text-pine-600 transition-colors hover:text-pine-700">
            导出个人数据
          </button>
          <button onClick={handleLogout} className="block text-xs font-medium text-destructive transition-colors hover:opacity-80">
            退出登录
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteAccount((value) => !value)}
            className="block text-xs font-medium text-destructive/80 transition-colors hover:text-destructive"
          >
            注销账号
          </button>
          {showDeleteAccount && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                提交后进入 7 天冷静期，期间可撤销。到期后账号信息会匿名化，公开内容默认保留。
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="输入当前密码确认"
                className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none focus:border-destructive"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={requestDeletion}
                  disabled={deleteLoading || !deletePassword}
                  className="rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
                >
                  {deleteLoading ? '提交中...' : '提交注销申请'}
                </button>
                <button
                  type="button"
                  onClick={cancelDeletion}
                  disabled={deleteLoading}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-ink disabled:opacity-50"
                >
                  撤销注销
                </button>
              </div>
              {deleteMessage && <p className="mt-2 text-xs text-muted-foreground">{deleteMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEditForm;
