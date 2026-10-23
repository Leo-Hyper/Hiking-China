import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Eye, Loader2, RotateCcw } from 'lucide-react';
import { updateProfile } from '@client/src/data/hiking-store';
import { uploadAvatarImage } from '@client/src/data/avatar-service';
import type { HikingUser } from '@client/src/data/hiking-types';
import { UserAvatar } from '@client/src/components/ui/user-avatar';
import { toast } from 'sonner';

interface ProfileEditFormProps {
  user: HikingUser;
}

const GEAR_GROUPS: { label: string; items: string[] }[] = [
  { label: '背负', items: ['背包', '登山杖'] },
  { label: '穿着', items: ['徒步鞋', '冲锋衣', '冲锋裤', '雪套', '冰爪'] },
  { label: '露营', items: ['帐篷', '睡袋', '登山炉'] },
  { label: '安全', items: ['头灯', '指南针'] },
];

const HIKING_LEVELS: { value: number; label: string; hint: string }[] = [
  { value: 1, label: '新手', hint: '休闲步道与入门路线' },
  { value: 2, label: '进阶', hint: '多日徒步与中等强度路线' },
  { value: 3, label: '资深', hint: '高海拔、长线与复杂地形' },
];

const inputClass: string =
  'w-full rounded-lg border border-border bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20';
const sectionClass: string = 'grid gap-5 p-5 md:grid-cols-[180px_minmax(0,1fr)] md:p-6';
const sectionTitleClass: string = 'text-sm font-semibold text-ink';
const sectionHintClass: string = 'mt-1.5 text-xs leading-relaxed text-muted-foreground';

const ProfileEditForm = ({ user }: ProfileEditFormProps) => {
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

  const isDirty: boolean = useMemo(() => {
    const currentGear = [...editingGear].sort().join('|');
    const originalGear = [...(user.gearPrefs || [])].sort().join('|');
    return editingUsername.trim() !== (user.username || '')
      || editingBio.trim() !== (user.bio || '')
      || editingLocation.trim() !== (user.location || '')
      || editingHikinglevel !== (user.hikinglevel || 1)
      || currentGear !== originalGear
      || editingProfilePublic !== (user.profilePublic !== false)
      || (editingAvatar || '') !== (user.avatar || '');
  }, [
    editingAvatar,
    editingBio,
    editingGear,
    editingHikinglevel,
    editingLocation,
    editingProfilePublic,
    editingUsername,
    user,
  ]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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
    if (!isDirty) return;
    setSaving(true);
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
      toast.success('个人资料已保存');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = (): void => {
    setEditingUsername(user.username || '');
    setEditingBio(user.bio || '');
    setEditingLocation(user.location || '');
    setEditingHikinglevel(user.hikinglevel || 1);
    setEditingGear(Array.isArray(user.gearPrefs) ? [...user.gearPrefs] : []);
    setEditingProfilePublic(user.profilePublic !== false);
    setEditingAvatar(user.avatar);
    setAvatarError('');
  };

  return (
    <section className="rounded-xl border border-border bg-card shadow-2xs" aria-labelledby="profile-settings-title">
      <header className="border-b border-border px-5 py-5 md:px-6">
        <p className="text-kicker uppercase text-ember-600">Public identity</p>
        <h2 id="profile-settings-title" className="mt-1 font-display text-lg text-ink">
          公开资料与徒步偏好
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          这些信息会展示在你的公开主页，帮助同行者了解你的经验和偏好。
        </p>
      </header>

      <form onSubmit={(event) => { event.preventDefault(); void saveProfile(); }}>
        <div className="divide-y divide-border">
          <section className={sectionClass}>
            <div>
              <h3 className={sectionTitleClass}>基础资料</h3>
              <p className={sectionHintClass}>头像、用户名和简介是其他成员最先看到的信息。</p>
            </div>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/35 p-4">
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
                  className="group relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-pine-200 transition-colors hover:ring-pine-400 focus:outline-none focus:ring-pine-500"
                  aria-label="更换头像"
                  title="更换头像"
                >
                  <UserAvatar
                    src={editingAvatar}
                    name={editingUsername || user.username}
                    className="h-full w-full"
                    fallbackClassName="text-xl"
                  />
                  <span
                    className={`absolute inset-0 flex items-center justify-center gap-1 bg-ink/55 text-[10px] font-medium text-paper transition-opacity ${
                      uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={15} />}
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">个人头像</p>
                  <p className="mt-1 text-xs text-muted-foreground">支持常见图片格式，建议使用清晰的正方形图片。</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="mt-2 text-xs font-semibold text-pine-700 hover:text-pine-800 disabled:opacity-50"
                  >
                    {uploadingAvatar ? '上传中...' : '上传新头像'}
                  </button>
                </div>
              </div>
              {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}

              <div>
                <label htmlFor="profile-username" className="mb-1.5 block text-xs font-medium text-ink">
                  用户名
                </label>
                <input
                  id="profile-username"
                  value={editingUsername}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingUsername(e.target.value)}
                  type="text"
                  maxLength={20}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="profile-bio" className="text-xs font-medium text-ink">个人简介</label>
                  <span className="font-data text-[10px] text-muted-foreground">{editingBio.length}/200</span>
                </div>
                <textarea
                  id="profile-bio"
                  value={editingBio}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingBio(e.target.value)}
                  rows={4}
                  maxLength={200}
                  placeholder="介绍一下你的徒步经历、偏好或下一次想去的地方..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label htmlFor="profile-location" className="mb-1.5 block text-xs font-medium text-ink">
                  所在地
                </label>
                <input
                  id="profile-location"
                  value={editingLocation}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingLocation(e.target.value)}
                  type="text"
                  maxLength={64}
                  placeholder="例如：四川·成都"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <div>
              <h3 className={sectionTitleClass}>徒步等级</h3>
              <p className={sectionHintClass}>选择最符合你当前经验的等级，方便同行者判断路线匹配度。</p>
            </div>
            <div role="radiogroup" aria-label="徒步等级" className="grid gap-2 sm:grid-cols-3">
              {HIKING_LEVELS.map((level) => {
                const selected = editingHikinglevel === level.value;
                return (
                  <button
                    key={level.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setEditingHikinglevel(level.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selected
                        ? 'border-pine-400 bg-pine-50'
                        : 'border-border bg-paper hover:border-pine-300'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${selected ? 'text-pine-800' : 'text-ink'}`}>
                      {level.label}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      {level.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={sectionClass}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={sectionTitleClass}>装备偏好</h3>
                <span className="font-data text-[10px] text-muted-foreground">{editingGear.length}/12</span>
              </div>
              <p className={sectionHintClass}>按使用场景选择你关注或熟悉的装备类型。</p>
            </div>
            <div className="space-y-4">
              {GEAR_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((gear: string) => {
                      const selected = editingGear.includes(gear);
                      return (
                        <button
                          key={gear}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleGear(gear)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            selected
                              ? 'border-pine-300 bg-pine-50 font-medium text-pine-700'
                              : 'border-border bg-paper text-muted-foreground hover:border-pine-300'
                          }`}
                        >
                          {gear}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <div>
              <h3 className={sectionTitleClass}>隐私设置</h3>
              <p className={sectionHintClass}>关闭后，其他成员将无法从公开入口查看你的资料与公开游记。</p>
            </div>
            <div className="rounded-lg border border-border bg-paper p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">公开个人主页</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {editingProfilePublic ? '当前对外公开，可被其他成员访问。' : '当前仅自己可见。'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editingProfilePublic}
                  aria-label="公开个人主页"
                  onClick={() => setEditingProfilePublic(!editingProfilePublic)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    editingProfilePublic ? 'bg-pine-600' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform ${
                      editingProfilePublic ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
              <Link
                to={`/user/${user.id}`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-pine-700 hover:text-pine-800"
              >
                <Eye size={14} />
                查看公开主页
              </Link>
            </div>
          </section>
        </div>

        <div className="sticky bottom-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border bg-card/95 px-5 py-4 backdrop-blur md:bottom-0 md:px-6">
          <p className={`text-xs ${isDirty ? 'font-medium text-ember-700' : 'text-muted-foreground'}`}>
            {isDirty ? '你有尚未保存的修改' : '个人资料已是最新状态'}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={discardChanges}
              disabled={!isDirty || saving}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-ink disabled:opacity-40"
            >
              <RotateCcw size={14} />
              撤销更改
            </button>
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="inline-flex min-h-10 items-center rounded-lg bg-pine-700 px-4 text-xs font-semibold text-paper transition-colors hover:bg-pine-800 disabled:opacity-45"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default ProfileEditForm;
