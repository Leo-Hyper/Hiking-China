import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Mountain } from 'lucide-react';
import type { HikingEvent } from '@client/src/data/hiking-types';
import { resolveImageUrl, stripHtml } from '@client/src/utils/base-path';
import { Image } from '@client/src/components/ui/image';
import TrailTag from '@client/src/components/visual/TrailTag';

export interface EventDateParts {
  day: string;
  month: string;
}

export const getEventDateParts = (eventDate: string): EventDateParts => {
  const date: Date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return { day: '--', month: '' };
  }
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: `${date.getMonth() + 1}月`,
  };
};

export const formatEventDate = (eventDate: string): string => {
  const date: Date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return eventDate;
  }
  return date.toLocaleDateString('zh-CN');
};

export const isEventEnded = (eventDate: string): boolean => {
  const date: Date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const today: Date = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

export const getDisplaySignupCount = (event: HikingEvent, signedUp: boolean): number =>
  event.participants + (signedUp ? 1 : 0);

interface EventCardProps {
  event: HikingEvent;
  signedUp: boolean;
  onSignup: (event: HikingEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, signedUp, onSignup }) => {
  const dateParts: EventDateParts = getEventDateParts(event.eventDate);
  const ended: boolean = isEventEnded(event.eventDate);
  const deadlinePassed: boolean = !!event.signupDeadline && isEventEnded(event.signupDeadline);
  const count: number = getDisplaySignupCount(event, signedUp);
  const isFull: boolean = event.maxParticipants > 0 && count >= event.maxParticipants;
  const progress: number =
    event.maxParticipants > 0
      ? Math.min(100, Math.round((count / event.maxParticipants) * 100))
      : 0;
  const excerptText: string = stripHtml(event.content);
  const excerpt: string = excerptText.length > 80 ? excerptText.slice(0, 80) + '...' : excerptText;

  return (
    <Link
      to={`/events/${event.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition-all duration-300 ease-out hover:border-pine-300 hover:shadow-md md:flex md:items-stretch"
    >
      {event.imageUrl && (
        <div className="aspect-[21/9] shrink-0 overflow-hidden bg-muted md:aspect-auto md:w-52">
          <Image
            src={resolveImageUrl(event.imageUrl)}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-5 p-5 md:flex-row md:items-center md:p-6">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-pine-50">
          <span className="font-data text-base md:text-xl font-bold text-pine-700">{dateParts.day}</span>
          <span className="font-data text-[10px] text-pine-600">{dateParts.month}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-ink transition-colors group-hover:text-pine-700">{event.title}</h3>
            <TrailTag tone={ended || deadlinePassed ? 'neutral' : 'ember'}>
              {ended ? '已结束' : deadlinePassed ? '报名截止' : '报名中'}
            </TrailTag>
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-pine-600" />
              {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Mountain size={12} className="text-pine-600" />
              {event.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={12} className="text-pine-600" />
              {formatEventDate(event.eventDate)}
            </span>
          </div>
          {event.maxParticipants > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-pine-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="shrink-0 font-data text-[11px] tabular-nums text-muted-foreground">
                {count}/{event.maxParticipants}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            onSignup(event);
          }}
          disabled={ended || (deadlinePassed && !signedUp) || (isFull && !signedUp)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors min-h-11 md:min-h-0 disabled:cursor-not-allowed disabled:opacity-50 ${
            signedUp && !ended
              ? 'border border-pine-200 bg-pine-50 text-pine-700 hover:bg-pine-100'
              : 'bg-pine-700 text-paper hover:bg-pine-800'
          }`}
        >
          {ended ? '已结束' : signedUp ? '取消报名' : deadlinePassed ? '报名截止' : isFull ? '已满员' : '立即报名'}
        </button>
      </div>
    </Link>
  );
};

export default EventCard;
