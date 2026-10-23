import { useRef, useState } from 'react';
import { FileUp, Loader2, Mountain, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createRoute, deleteRoute, parseRouteGpx, type ParsedGpx } from '@client/src/api';
import ImageUrlPicker from '@client/src/pages/PostDetail/ImageUrlPicker';

interface AdminRoutesPanelProps {
  routes: Record<string, unknown>[];
  onChanged: () => Promise<void> | void;
}

interface RouteFormState {
  name: string;
  region: string;
  difficulty: string;
  distance: string;
  duration: string;
  description: string;
  image: string;
}

const DEFAULT_FORM: RouteFormState = {
  name: '',
  region: '四川',
  difficulty: '中级',
  distance: '',
  duration: '',
  description: '',
  image: '/img/四姑娘山.jpg',
};

const AdminRoutesPanel = ({ routes, onChanged }: AdminRoutesPanelProps) => {
  const [form, setForm] = useState<RouteFormState>(DEFAULT_FORM);
  const [parsed, setParsed] = useState<ParsedGpx | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const updateField = <K extends keyof RouteFormState>(key: K, value: RouteFormState[K]): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleGpx = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      toast.error('请选择 .gpx 文件');
      return;
    }
    setParsing(true);
    try {
      const text = await file.text();
      const result = await parseRouteGpx(text);
      setParsed(result);
      setForm((current) => ({
        ...current,
        name: current.name || result.name,
        distance: current.distance || String(result.stats.distance),
      }));
      toast.success('GPX 解析成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'GPX 解析失败');
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('请填写路线名称');
      return;
    }
    setSaving(true);
    try {
      await createRoute({
        name: form.name.trim(),
        region: form.region.trim(),
        difficulty: form.difficulty,
        distance: Number(form.distance) || parsed?.stats.distance || 0,
        duration: form.duration.trim(),
        description: form.description.trim(),
        image: form.image,
        tags: form.region ? [form.region, form.difficulty] : [],
        geojson: parsed?.geojson,
        points: parsed?.points,
        ascentM: parsed?.stats.ascentM,
        descentM: parsed?.stats.descentM,
        minElevation: parsed?.stats.minElevation,
        maxElevation: parsed?.stats.maxElevation,
        pointCount: parsed?.stats.pointCount,
      });
      toast.success('路线已创建');
      setForm(DEFAULT_FORM);
      setParsed(null);
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '路线创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (routeId: number, name: string): Promise<void> => {
    if (!window.confirm(`确定删除路线「${name}」？该操作不可撤销。`)) return;
    try {
      await deleteRoute(routeId);
      toast.success('路线已删除');
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Mountain size={16} className="text-pine-700" />
          <h2 className="font-display text-lg text-ink">路线库</h2>
          <span className="ml-auto font-data text-xs text-muted-foreground">{routes.length} 条</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">路线</th>
                <th className="px-3 py-2 font-medium">地区</th>
                <th className="px-3 py-2 font-medium">难度</th>
                <th className="px-3 py-2 font-medium">距离</th>
                <th className="px-3 py-2 font-medium">轨迹点</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => {
                const routeId = Number(route.id);
                return (
                  <tr key={routeId} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-3 font-medium text-ink">{String(route.name || '')}</td>
                    <td className="px-3 py-3 text-muted-foreground">{String(route.region || '—')}</td>
                    <td className="px-3 py-3 text-muted-foreground">{String(route.difficulty || '—')}</td>
                    <td className="px-3 py-3 font-data text-muted-foreground">{Number(route.distance || 0)}km</td>
                    <td className="px-3 py-3 font-data text-muted-foreground">{Number(route.point_count || 0)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(routeId, String(route.name || ''))}
                        className="inline-flex items-center gap-1 text-xs text-destructive transition-opacity hover:opacity-70"
                      >
                        <Trash2 size={13} />
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-lg text-ink">新增路线</h2>
        <p className="mt-1 text-xs text-muted-foreground">上传 GPX 后会自动计算距离、爬升与海拔。</p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-ink">路线名称 *</span>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例如：四姑娘山大峰"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-ink">地区</span>
              <input
                value={form.region}
                onChange={(event) => updateField('region', event.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-ink">难度</span>
              <select
                value={form.difficulty}
                onChange={(event) => updateField('difficulty', event.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
              >
                <option value="初级">初级</option>
                <option value="中级">中级</option>
                <option value="高级">高级</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-ink">距离（km）</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.distance}
                onChange={(event) => updateField('distance', event.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-ink">耗时</span>
              <input
                value={form.duration}
                onChange={(event) => updateField('duration', event.target.value)}
                placeholder="例如：2天"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-ink">路线说明</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink">封面图</span>
            <ImageUrlPicker
              compact
              maxFiles={1}
              value={form.image ? [form.image] : []}
              onChange={(urls: string[]) => updateField('image', urls[0] || '')}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink">GPX 轨迹</span>
            <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-pine-300 px-3 text-sm text-pine-700 transition-colors hover:bg-pine-50">
              {parsing ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              {parsing ? '解析中…' : '选择 .gpx 文件'}
              <input
                ref={fileRef}
                type="file"
                accept=".gpx,application/gpx+xml"
                className="sr-only"
                onChange={(event) => void handleGpx(event.target.files?.[0])}
              />
            </label>
            {parsed && (
              <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center text-xs">
                <div>
                  <p className="font-data text-ink">{parsed.stats.distance}km</p>
                  <p className="mt-0.5 text-muted-foreground">距离</p>
                </div>
                <div>
                  <p className="font-data text-ink">{parsed.stats.ascentM}m</p>
                  <p className="mt-0.5 text-muted-foreground">爬升</p>
                </div>
                <div>
                  <p className="font-data text-ink">{parsed.stats.maxElevation ?? '—'}m</p>
                  <p className="mt-0.5 text-muted-foreground">最高</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 flex min-h-10 w-full items-center justify-center rounded-lg bg-pine-700 px-4 text-sm font-semibold text-paper transition-colors hover:bg-pine-800 disabled:opacity-60"
        >
          {saving ? '保存中…' : '创建路线'}
        </button>
      </form>
    </div>
  );
};

export default AdminRoutesPanel;
