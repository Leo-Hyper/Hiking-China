import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormTopBar from '@client/src/components/FormTopBar';
import { createPost } from '@client/src/data/hiking-store';
import { POST_CATEGORIES } from '@client/src/data/hiking-data';
import type { PostExtraInfo } from '@client/src/data/hiking-types';
import RichTextEditor from '@client/src/components/RichTextEditor';
import MapPicker from '@client/src/components/MapPicker';
import ImageUrlPicker from '@client/src/pages/PostDetail/ImageUrlPicker';
import { MapPin, TriangleAlert } from 'lucide-react';

const DRAFT_KEY: string = 'publish_draft';

interface PublishFormState {
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
  routeCoordinates: [number, number][];
  gear: GearExtraForm;
}

interface DraftPayload {
  title: string;
  content: string;
  category: string;
  tagsStr: string;
  imageUrls: string[];
  extra: ExtraFormState;
  timestamp: number;
}

const DEFAULT_FORM: PublishFormState = { title: '', content: '', category: '登山经验', tagsStr: '' };

const DEFAULT_EXTRA: ExtraFormState = {
  route: { difficulty: 3, duration: '', elevationGain: '', distance: '', start: '', end: '' },
  routeCoordinates: [],
  gear: { brand: '', model: '', price: '', usage: '' },
};

const PublishPostPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [draftAvailable, setDraftAvailable] = useState<boolean>(false);
  const [form, setForm] = useState<PublishFormState>(DEFAULT_FORM);
  const [extra, setExtra] = useState<ExtraFormState>(DEFAULT_EXTRA);

  const tags: string[] = useMemo(() => {
    if (!form.tagsStr.trim()) return [];
    return form.tagsStr.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean);
  }, [form.tagsStr]);

  const buildExtrainfo = (): PostExtraInfo | undefined => {
    if (form.category === '路线攻略') {
      const coords: [number, number][] = (extra.routeCoordinates || []).map(
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

  const saveDraftToStorage = (): void => {
    if (!form.title && !form.content && !form.tagsStr && imageUrls.length === 0) return;
    const draft: DraftPayload = {
      title: form.title,
      content: form.content,
      category: form.category,
      tagsStr: form.tagsStr,
      imageUrls,
      extra,
      timestamp: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  };

  const restoreDraft = (): void => {
    const raw: string | null = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft: DraftPayload = JSON.parse(raw) as DraftPayload;
      setForm({
        title: draft.title || '',
        content: draft.content || '',
        category: draft.category || '登山经验',
        tagsStr: draft.tagsStr || '',
      });
      setImageUrls(draft.imageUrls || []);
      if (draft.extra) {
        setExtra({
          route: { ...DEFAULT_EXTRA.route, ...(draft.extra.route || {}) },
          routeCoordinates: draft.extra.routeCoordinates || [],
          gear: { ...DEFAULT_EXTRA.gear, ...(draft.extra.gear || {}) },
        });
      }
      localStorage.removeItem(DRAFT_KEY);
      setDraftAvailable(false);
    } catch {
      /* corrupted draft */
    }
  };

  const discardDraft = (): void => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftAvailable(false);
  };

  const checkDraft = (): void => {
    const raw: string | null = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft: DraftPayload = JSON.parse(raw) as DraftPayload;
      if (Date.now() - draft.timestamp > 24 * 3600 * 1000) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      setDraftAvailable(true);
    } catch {
      /* ignore */
    }
  };

  const saveAsDraft = async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    try {
      await createPost({
        title: form.title || '未命名草稿',
        content: form.content,
        category: form.category,
        tags,
        imageUrls,
        extrainfo: buildExtrainfo(),
        status: 0,
      });
      localStorage.removeItem(DRAFT_KEY);
      setDraftAvailable(false);
      setSuccessMsg('草稿已保存！');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (e) {
      setErrorMsg((e as Error).message || '保存草稿失败');
    } finally {
      setLoading(false);
    }
  };

  // watch(form) → 自动保存草稿
  useEffect(() => {
    saveDraftToStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.content, form.category, form.tagsStr, imageUrls]);

  useEffect(() => {
    checkDraft();
    window.addEventListener('beforeunload', saveDraftToStorage);
    return () => window.removeEventListener('beforeunload', saveDraftToStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const contentText: string = form.content.replace(/<[^>]*>/g, '').trim();
    if (!contentText) {
      setErrorMsg('请填写帖子内容');
      return;
    }
    if (imageUrls.length === 0) {
      setErrorMsg('请至少上传一张图片');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await createPost({
        title: form.title,
        content: form.content,
        category: form.category,
        tags,
        imageUrls,
        extrainfo: buildExtrainfo(),
        status: 1,
      });
      localStorage.removeItem(DRAFT_KEY);
      setDraftAvailable(false);
      setSuccessMsg('发布成功！即将跳转到帖子列表...');
      setTimeout(() => navigate('/forum'), 1500);
    } catch (err) {
      setErrorMsg((err as Error).message || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (): void => {
    setForm(DEFAULT_FORM);
    setImageUrls([]);
    setErrorMsg('');
    setSuccessMsg('');
    setExtra(JSON.parse(JSON.stringify(DEFAULT_EXTRA)) as ExtraFormState);
  };

  const inputCls: string = 'w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20';
  const labelCls: string = 'text-sm font-medium text-ink mb-1.5 block';

  return (
    <div className="min-h-screen bg-paper">
      <FormTopBar />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-kicker uppercase text-pine-600">Trail Journal · 分享</p>
          <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">发布帖子</h1>
          <p className="mt-2 text-sm text-muted-foreground">分享你的徒步经验、装备评测或路线攻略</p>
        </div>
        <Link
          to="/publish-event"
          className="shrink-0 pb-1 text-sm text-muted-foreground transition-colors hover:text-pine-700"
        >
          想召集线下徒步？<span className="font-medium text-pine-700">发布活动</span>
        </Link>
      </div>

      {/* 草稿恢复提示 */}
      {draftAvailable && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-ember-200 bg-ember-100 p-4">
          <div className="flex items-center gap-2 text-sm text-ember-700">
            <TriangleAlert size={18} className="text-ember-600" />
            检测到未发布的草稿
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={restoreDraft} className="rounded-lg bg-pine-700 px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-pine-800">恢复</button>
            <button type="button" onClick={discardDraft} className="px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-ink">忽略</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 md:p-8">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">标题 *</label>
          <input
            value={form.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev: PublishFormState) => ({ ...prev, title: e.target.value }))}
            type="text" required maxLength={100} placeholder="请输入帖子标题"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
          />
          <span className="font-data text-xs text-muted-foreground mt-1 block">{form.title.length}/100</span>
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">分类</label>
          <select
            value={form.category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((prev: PublishFormState) => ({ ...prev, category: e.target.value }))}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev: PublishFormState) => ({ ...prev, tagsStr: e.target.value }))}
            type="text" placeholder="例如: 四川, 雪山, 入门"
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">图片 *</label>
          <ImageUrlPicker value={imageUrls} onChange={setImageUrls} maxFiles={9} />
        </div>

        {/* === 附加信息表单（按分类动态展示） === */}
        {form.category === '路线攻略' && (
          <div className="rounded-xl border border-border bg-muted/50 p-5 space-y-4">
            <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <MapPin size={16} className="text-pine-600" />
              路线信息
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>难度 (1-5星)</label>
                <select value={extra.route.difficulty}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, difficulty: Number(e.target.value) } }))}
                  className={inputCls}>
                  <option value={1}>★ 简单</option>
                  <option value={2}>★★ 较易</option>
                  <option value={3}>★★★ 中等</option>
                  <option value={4}>★★★★ 较难</option>
                  <option value={5}>★★★★★ 极难</option>
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
                <input value={extra.route.start} placeholder="例如：成都" className={inputCls}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, start: e.target.value } }))} />
              </div>
              <div>
                <label className={labelCls}>终点</label>
                <input value={extra.route.end} placeholder="例如：四姑娘山" className={inputCls}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, route: { ...prev.route, end: e.target.value } }))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>路线轨迹（点击地图添加标记点）</label>
              <MapPicker value={extra.routeCoordinates}
                onChange={(coords: [number, number][]) => setExtra((prev: ExtraFormState) => ({ ...prev, routeCoordinates: coords }))} />
            </div>
          </div>
        )}

        {form.category === '装备评测' && (
          <div className="rounded-xl border border-border bg-muted/50 p-5 space-y-4">
            <p className="text-sm font-semibold text-ink">装备信息</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>品牌</label>
                <input value={extra.gear.brand} placeholder="例如：始祖鸟" className={inputCls}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, brand: e.target.value } }))} />
              </div>
              <div>
                <label className={labelCls}>型号</label>
                <input value={extra.gear.model} placeholder="例如：Alpha SV" className={inputCls}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, model: e.target.value } }))} />
              </div>
              <div>
                <label className={labelCls}>价格</label>
                <input value={extra.gear.price} placeholder="例如：¥5999" className={inputCls}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, price: e.target.value } }))} />
              </div>
              <div>
                <label className={labelCls}>使用时长</label>
                <input value={extra.gear.usage} placeholder="例如：2年" className={inputCls}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtra((prev: ExtraFormState) => ({ ...prev, gear: { ...prev.gear, usage: e.target.value } }))} />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">内容 *</label>
          <RichTextEditor
            value={form.content}
            onChange={(html: string) => setForm((prev: PublishFormState) => ({ ...prev, content: html }))}
            placeholder="开始撰写你的帖子..."
          />
          <span className="font-data text-xs text-muted-foreground mt-1 block">{form.content.length}/10000</span>
        </div>

        {errorMsg && <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{errorMsg}</div>}
        {successMsg && <div className="rounded-lg bg-pine-50 p-4 text-sm text-pine-700">{successMsg}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? '发布中...' : '发布帖子'}
          </button>
          <button type="button" onClick={saveAsDraft}
            className="rounded-lg border border-border bg-card px-4 py-2 md:px-5 md:py-2.5 text-sm font-medium text-ink transition-colors hover:border-pine-300">
            保存草稿
          </button>
          <button type="button" onClick={resetForm}
            className="rounded-lg border border-border bg-card px-4 py-2 md:px-5 md:py-2.5 text-sm font-medium text-ink transition-colors hover:border-pine-300">
            重置
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default PublishPostPage;
