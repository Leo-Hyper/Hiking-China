import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, CalendarDays, ChevronLeft, MapPin, Mountain, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  getEventById,
  isEventSignedUp,
  toggleEventSignup,
} from '@client/src/data/hiking-store';
import type { HikingEvent } from '@client/src/data/hiking-types';
import { useAsyncData, useAuth } from '@client/src/hooks/use-hiking';
import { resolveImageUrl } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import TrailTag from '@client/src/components/visual/TrailTag';
import EmptyState from '@client/src/components/visual/EmptyState';
import { formatEventDate, getDisplaySignupCount, isEventEnded } from './EventCard';

interface InfoCell {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}

const EventDetailPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const eventId: number = Number(params.id);

  const { data: event, loading } = useAsyncData<HikingEvent | undefined>(
    () => (Number.isNaN(eventId) ? Promise.resolve(undefined) : getEventById(eventId)),
    [eventId]
  );
  const [signedUp, setSignedUp] = useState<boolean>(false);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    isEventSignedUp(event.id)
      .then((v: boolean) => {
        if (!cancelled) setSignedUp(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [event]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <div className="animate-pulse rounded-xl bg-muted aspect-[16/10] md:aspect-[21/9]" />
        <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i: number) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <EmptyState
          icon={CalendarDays}
          title="活动不存在"
          description="该活动可能已被删除，去看看其他召集中的活动吧"
          action={
            <Link
              to="/events"
              className="inline-flex items-center rounded-lg bg-pine-700 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-pine-800"
            >
              返回活动列表
            </Link>
          }
        />
      </div>
    );
  }

  const ended: boolean = isEventEnded(event.eventDate);
  const deadlinePassed: boolean = !!event.signupDeadline && isEventEnded(event.signupDeadline);
  const count: number = getDisplaySignupCount(event, signedUp);
  const isFull: boolean = event.maxParticipants > 0 && count >= event.maxParticipants;
  const progress: number =
    event.maxParticipants > 0
      ? Math.min(100, Math.round((count / event.maxParticipants) * 100))
      : 0;

  const handleSignup = async (): Promise<void> => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      const next: boolean = await toggleEventSignup(event.id);
      setSignedUp(next);
      toast.success(next ? '报名成功' : '已取消报名');
    } catch (err) {
      toast(err instanceof Error ? err.message : '操作失败，请重试');
    }
  };

  const ctaDisabled: boolean = ended || (deadlinePassed && !signedUp) || (isFull && !signedUp);
  const ctaLabel: string = ended
    ? '活动已结束'
    : signedUp
      ? '取消报名'
      : deadlinePassed
        ? '报名截止'
        : isFull
          ? '已满员'
          : '立即报名';
  const ctaClass: string = `rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors min-h-11 md:min-h-0 disabled:cursor-not-allowed disabled:opacity-50 ${
    signedUp && !ended
      ? 'border border-pine-200 bg-pine-50 text-pine-700 hover:bg-pine-100'
      : 'bg-pine-700 text-paper hover:bg-pine-800'
  }`;

  const infoCells: InfoCell[] = [
    { icon: CalendarDays, label: '活动时间', value: formatEventDate(event.eventDate) },
    ...(event.signupDeadline
      ? [{ icon: CalendarClock, label: '报名截止', value: formatEventDate(event.signupDeadline) }]
      : []),
    { icon: MapPin, label: '活动地点', value: event.location },
    { icon: Mountain, label: '路线难度', value: event.difficulty },
    ...(event.maxParticipants === 0
      ? [{ icon: Users, label: '报名人数', value: `${count} 人报名` }]
      : []),
  ];

  const gridColsClass: string =
    infoCells.length >= 5
      ? 'md:grid-cols-5'
      : infoCells.length === 4
        ? 'md:grid-cols-4'
        : 'md:grid-cols-3';

  return (
    <div className="mx-auto max-w-4xl px-6 pb-40 pt-10 md:pb-16 md:pt-16 lg:px-8">
      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-ink group"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        返回活动列表
      </Link>

      {event.imageUrl ? (
        <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted md:aspect-[21/9]">
          <Image
            src={resolveImageUrl(event.imageUrl)}
            alt={event.title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-pine-700 to-pine-900 md:aspect-[21/9]">
          <CalendarDays size={48} className="text-paper/40" />
        </div>
      )}

      <header className="mt-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <TrailTag tone={ended || deadlinePassed ? 'neutral' : 'ember'}>
            {ended ? '已结束' : deadlinePassed ? '报名截止' : '报名中'}
          </TrailTag>
          <TrailTag tone="pine">{event.difficulty}</TrailTag>
        </div>
        <h1 className="font-display text-xl text-ink md:text-h2">{event.title}</h1>
      </header>

      <div className={`mt-6 grid grid-cols-2 gap-3 ${gridColsClass}`}>
        {infoCells.map((cell: InfoCell) => {
          const Icon = cell.icon;
          return (
            <div key={cell.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Icon size={13} className="text-pine-600" />
                {cell.label}
              </div>
              <p className="text-sm font-medium text-ink">{cell.value}</p>
            </div>
          );
        })}
      </div>

      {event.maxParticipants > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>报名进度</span>
            <span className="font-data tabular-nums">{count}/{event.maxParticipants} 人</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-pine-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-8 hidden md:block">
        <button onClick={handleSignup} disabled={ctaDisabled} className={ctaClass}>
          {ctaLabel}
        </button>
      </div>

      <section className="mt-10">
        <h3 className="font-display text-lg text-ink md:text-h3">活动介绍</h3>
        <div className="h-px bg-border mt-3 mb-4" />
        <div className="prose max-w-none text-sm leading-[1.9] text-foreground md:text-[15px]"
          dangerouslySetInnerHTML={{ __html: event.content }} />
      </section>

      <div className="fixed inset-x-0 bottom-[calc(2.75rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-paper p-4 md:hidden">
        <button onClick={handleSignup} disabled={ctaDisabled} className={`w-full ${ctaClass}`}>
          {ctaLabel}
        </button>
      </div>
    </div>
  );
};

export default EventDetailPage;
