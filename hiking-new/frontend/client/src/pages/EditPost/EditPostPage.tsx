import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPostById, updatePost } from '@client/src/data/hiking-store';
import { POST_CATEGORIES } from '@client/src/data/hiking-data';
import type { Post, PostExtraInfo } from '@client/src/data/hiking-types';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import { resolveImageUrl } from '@client/src/utils/base-path';
import RichTextEditor from '@client/src/components/RichTextEditor';
import MapPicker from '@client/src/components/MapPicker';
import ImageUrlPicker from '@client/src/pages/PostDetail/ImageUrlPicker';
import { Image } from '@client/src/components/ui/image';
import FormTopBar from '@client/src/components/FormTopBar';

interface EditFormState {
  title: string;
  content: string;
  category: string;
  tagsStr: string;
}

interface RouteExtraForm {
  difficulty: number;
  duration: string;
  elevationGain: string;
  distance: string;
  start: string;
  end: string;
}

interface GearExtraForm {
  brand: string;
  model: string;
  price: string;
  usage: string;
}

interface ExtraFormState {
  route: RouteExtraForm;
  gear: GearExtraForm;
}

const DEFAULT_EXTRA: ExtraFormState = {
  route: { difficulty: 3, duration: '', elevationGain: '', distance: '', start: '', end: '' },
  gear: { brand: '', model: '', price: '', usage: '' },
};

const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const postId: number = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [forbidden, setForbidden] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [editRouteCoordinates, setEditRouteCoordinates] = useState<[number, number][]>([]);
  const [form, setForm] = useState<EditFormState>({ title: '', content: '', category: '其他', tagsStr: '' });
  const [extra, setExtra] = useState<ExtraFormState>(DEFAULT_EXTRA);

  const { data: postData, loading } = useAsyncData<Post | undefined>(() => getPostById(postId), [
    postId,
  ]);

  const tags: string[] = useMemo(() => {
    if (!form.tagsStr.trim()) return [];
    return form.tagsStr.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean);
  }, [form.tagsStr]);

  const previewHtml: string = form.content
    ? form.content.replace(/\n/g, '<br>')
    : '<p class="text-muted-foreground">暂无内容</p>';

  // 帖子数据就绪后填充表单
  useEffect(() => {
    const p: Post | undefined = postData ?? undefined;
    if (loading) return;
    if (!p) {
      setForbidden(true);
      return;
    }
    if (!user) return;
    if (user.id !== p.authorId) {
      setForbidden(true);
      return;
    }
    setForbidden(false);

    setForm({
      title: p.title || '',
      content: p.content || '',
      category: p.category || '其他',
      tagsStr: (Array.isArray(p.tags) ? p.tags : []).join(', '),
    });
    setExistingImages(Array.isArray(p.imageUrls) ? p.imageUrls : []);

    // 恢复 extrainfo
    const ei: PostExtraInfo | undefined = p.extrainfo;
    const nextExtra: ExtraFormState = JSON.parse(JSON.stringify(DEFAULT_EXTRA)) as ExtraFormState;
    if (ei?.route) {
      nextExtra.route = {
        difficulty: ei.route.difficulty || 3,
        duration: ei.route.duration || '',
        elevationGain: ei.route.elevationGain || '',
        distance: ei.route.distance ? String(ei.route.distance) : '',
        start: ei.route.start || '',
        end: ei.route.end || '',
      };
      setEditRouteCoordinates(ei.route.coordinates || []);
    }
    if (ei?.gear) {
      nextExtra.gear = { ...nextExtra.gear, ...ei.gear };
    }
    setExtra(nextExtra);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postData, loading, user]);

  const buildExtrainfo = (): PostExtraInfo | undefined => {
    if (form.category === '路线攻略') {
      const coords: [number, number][] = (editRouteCoordinates || []).map(
        (c: [number, number]) => [c[0], c[1]] as [number, number]
      );
      return {
        route: {
          difficulty: extra.route.difficulty,
          duration: extra.route.duration,
          elevationGain: extra.route.elevationGain,
          distance: Number.parseFloat(extra.route.distance) || 0,
          start: extra.route.start,
          end: extra.route.end,
          coordinates: coords,
        },
      };
    } else if (form.category === '装备评测') {
      return { gear: { ...extra.gear } };
    }
    return undefined;
  };

  const removeExistingImage = (index: number): void => {
    setExistingImages((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const allImages: string[] = [...existingImages, ...newImages];
      await updatePost(postId, {
        title: form.title,
        content: form.content,
        category: form.category,
        tags,
        imageUrls: allImages,
        extrainfo: buildExtrainfo(),
        status: 1,
      });
      setSuccessMsg('保存成功！即将返回...');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls: string = 'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20';
  const labelCls: string = 'text-sm font-medium text-ink mb-1.5 block';

  return (
    <div className="min-h-screen bg-paper">
      <FormTopBar />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 md:py-12">

      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-pine-500/30 border-t-pine-600 rounded-full animate-spin"></div>
          <p className="text-muted-foreground mt-4">加载帖子数据...</p>
        </div>
      )}

      {!loading && forbidden && (
        <div className="rounded-xl border border-border bg-card py-20 text-center">
          <p className="text-lg text-muted-foreground">无权编辑此帖子</p>
          <Link to="/profile" className="mt-4 inline-flex rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800">返回个人中心</Link>
        </div>
      )}

      {!loading && !forbidden && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="mb-2">
            <p className="text-kicker uppercase text-pine-600">Trail Journal · 编辑</p>
            <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">编辑帖子</h1>
            <p className="mt-2 text-sm text-muted-foreground">修改你的帖子内容</p>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">标题 *</label>
            <input
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev: EditFormState) => ({ ...prev, title: e.target.value }))}
              type="text" required maxLength={100} placeholder="请输入帖子标题"
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
            />
            <span className="font-data text-xs text-muted-foreground mt-1 block">{form.title.length}/100</span>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">分类</label>
            <select
              value={form.category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((prev: EditFormState) => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
            >
              {POST_CATEGORIES.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">标签（用逗号分隔）</label>
            <input
              value={form.tagsStr}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev: EditFormState) => ({ ...prev, tagsStr: e.target.value }))}
              type="text" placeholder="例如: 四川, 雪山, 入门"
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
            />
          </div>

          {existingImages.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">现有图片</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {existingImages.map((img: string, i: number) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden bg-muted aspect-square">
                    <Image src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-ink/50 hover:bg-destructive text-paper rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all">&times;</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">添加新图片</label>
            <ImageUrlPicker value={newImages} onChange={setNewImages} maxFiles={Math.max(0, 9 - existingImages.length)} />
          </div>

          {/* === 附加信息表单 === */}
          {form.category === '路线攻略' && (
            <div className="rounded-xl border border-border bg-muted/50 p-5 space-y-4">
              <p className="text-sm font-semibold text-ink">路线信息</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>难度 (1-5星)</label>
                  <select value={extra.route.difficulty}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, difficulty: Number(e.target.value) } }))}
                    className={inputCls}>
                    <option value={1}>★ 简单</option><option value={2}>★★ 较易</option><option value={3}>★★★ 中等</option><option value={4}>★★★★ 较难</option><option value={5}>★★★★★ 极难</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>预计耗时</label>
                  <input value={extra.route.duration} placeholder="例如：4小时" className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, duration: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>累计爬升</label>
                  <input value={extra.route.elevationGain} placeholder="例如：800m" className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, elevationGain: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>全程距离（km）</label>
                  <input value={extra.route.distance} placeholder="例如：12" className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, distance: e.target.value } }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>起点</label>
                  <input value={extra.route.start} className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, start: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>终点</label>
                  <input value={extra.route.end} className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, end: e.target.value } }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>路线轨迹（点击地图添加标记点）</label>
                <MapPicker value={editRouteCoordinates} onChange={setEditRouteCoordinates} />
              </div>
            </div>
          )}

          {form.category === '装备评测' && (
            <div className="rounded-xl border border-border bg-muted/50 p-5 space-y-4">
              <p className="text-sm font-semibold text-ink">装备信息</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>品牌</label>
                  <input value={extra.gear.brand} className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, brand: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>型号</label>
                  <input value={extra.gear.model} className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, model: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>价格</label>
                  <input value={extra.gear.price} className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, price: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls}>使用时长</label>
                  <input value={extra.gear.usage} className={inputCls}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, usage: e.target.value } }))} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">内容 *</label>
            <div className="flex gap-1 self-start rounded-lg bg-muted p-1">
              <button type="button" onClick={() => setPreviewMode(false)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${!previewMode ? 'bg-card text-ink shadow-2xs' : 'text-muted-foreground hover:text-ink'}`}>编辑</button>
              <button type="button" onClick={() => setPreviewMode(true)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${previewMode ? 'bg-card text-ink shadow-2xs' : 'text-muted-foreground hover:text-ink'}`}>预览</button>
            </div>
            {!previewMode ? (
              <RichTextEditor
                value={form.content}
                onChange={(html: string) => setForm((prev: EditFormState) => ({ ...prev, content: html }))}
                placeholder="开始撰写..."
              />
            ) : (
              <div className="w-full min-h-[300px] rounded-lg border border-border bg-card px-4 py-3 prose prose-sm max-w-none text-ink leading-relaxed"
                dangerouslySetInnerHTML={{ __html: previewHtml }} />
            )}
            <span className="font-data text-xs text-muted-foreground mt-1 block">{form.content.length}/10000</span>
          </div>

          {errorMsg && <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{errorMsg}</div>}
          {successMsg && <div className="rounded-lg bg-pine-50 p-4 text-sm text-pine-700">{successMsg}</div>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800 disabled:opacity-50">
              {saving ? '保存中...' : '保存修改'}
            </button>
            <Link to="/profile" className="rounded-lg border border-border bg-card px-4 py-2 md:px-5 md:py-2.5 text-sm font-medium text-ink transition-colors hover:border-pine-300 text-center">取消</Link>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};

export default EditPostPage;
