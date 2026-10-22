import { useState } from 'react';
import { Flag } from 'lucide-react';
import * as api from '@client/src/api';
import { useAuth } from '@client/src/hooks/use-hiking';
import { toast } from 'sonner';

type ReportTargetType = 'post' | 'comment' | 'user' | 'event';
const REASONS = ['广告', '辱骂', '违法', '隐私', '其他'] as const;

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: number;
  className?: string;
  label?: string;
}

const ReportButton = ({ targetType, targetId, className = '', label = '举报' }: ReportButtonProps) => {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('广告');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (): Promise<void> => {
    if (!isLoggedIn) {
      toast('请先登录');
      return;
    }
    setSubmitting(true);
    try {
      await api.createReport({ target_type: targetType, target_id: targetId, reason, detail });
      toast.success('举报已提交，感谢你的反馈');
      setOpen(false);
      setDetail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '举报提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-ink md:min-h-0 ${className}`}
      >
        <Flag size={14} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4" onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="font-display text-lg text-ink">提交举报</h3>
            <p className="mt-1 text-xs text-muted-foreground">请选择原因，管理员会尽快处理。</p>
            <label className="mt-4 block text-xs font-medium text-ink">
              举报原因
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value as (typeof REASONS)[number])}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
              >
                {REASONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-ink">
              补充说明
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="可选，请勿填写敏感信息"
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pine-500"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-ink">
                取消
              </button>
              <button type="button" onClick={submit} disabled={submitting} className="rounded-lg bg-pine-700 px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50">
                {submitting ? '提交中...' : '提交举报'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;
