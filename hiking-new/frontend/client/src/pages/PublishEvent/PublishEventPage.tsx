import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Eraser } from 'lucide-react';
import type { Matcher } from 'react-day-picker';
import { createEvent } from '@client/src/data/hiking-store';
import FormTopBar from '@client/src/components/FormTopBar';
import RichTextEditor from '@client/src/components/RichTextEditor';
import ImageUrlPicker from '@client/src/pages/PostDetail/ImageUrlPicker';
import { Button } from '@client/src/components/ui/button';
import { Calendar } from '@client/src/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@client/src/components/ui/form';
import { Input } from '@client/src/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  DIFFICULTY_OPTIONS,
  EVENT_FORM_DEFAULTS,
  eventFormSchema,
  clearEventDraft,
  formatDisplayDate,
  loadEventDraft,
  saveEventDraft,
  toDateString,
  todayString,
} from './publishEventForm';
import type { EventFormValues } from './publishEventForm';

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabledMatcher?: Matcher[];
}

const DateField: React.FC<DateFieldProps> = ({
  value,
  onChange,
  placeholder,
  disabledMatcher,
  ...rest
}) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 border-border bg-card px-3.5 py-2.5 text-sm font-normal text-ink hover:bg-muted"
          {...rest}
        >
          <CalendarDays size={14} className="shrink-0 text-muted-foreground" />
          {value ? (
            formatDisplayDate(value)
          ) : (
            <span className="text-muted-foreground/60">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(`${value}T00:00:00`) : undefined}
          onSelect={(date: Date | undefined) => {
            onChange(date ? toDateString(date) : '');
            if (date) setOpen(false);
          }}
          disabled={disabledMatcher}
          defaultMonth={value ? new Date(`${value}T00:00:00`) : new Date()}
        />
      </PopoverContent>
    </Popover>
  );
};

const PublishEventPage = () => {
  const navigate = useNavigate();
  const initialDraft = useRef<EventFormValues | null>(loadEventDraft());
  const [hasDraft, setHasDraft] = useState<boolean>(initialDraft.current !== null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const redirectTimer = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialDraft.current ?? EVENT_FORM_DEFAULTS,
  });

  useEffect(() => {
    return () => {
      if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (!form.formState.isDirty) return;
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveEventDraft(form.getValues());
      }, 300);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleClearDraft = (): void => {
    clearEventDraft();
    form.reset(EVENT_FORM_DEFAULTS);
    setHasDraft(false);
  };

  const onValid = async (values: EventFormValues): Promise<void> => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await createEvent({
        title: values.title.trim(),
        eventDate: values.eventDate,
        location: values.location.trim(),
        difficulty: values.difficulty,
        maxParticipants: values.maxParticipants || 0,
        content: values.content.trim(),
        imageUrl: values.imageUrl.trim() || undefined,
        signupDeadline: values.signupDeadline || undefined,
      });
      clearEventDraft();
      setSuccessMsg('发布成功！即将跳转...');
      redirectTimer.current = window.setTimeout(() => {
        navigate('/events');
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const todayDate: Date = new Date(`${todayString()}T00:00:00`);
  const eventDateValue: string = form.watch('eventDate');

  return (
    <div className="min-h-screen bg-paper">
      <FormTopBar />
      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <p className="text-kicker uppercase text-pine-600">Trail Event · 召集</p>
        <h1 className="mt-2 font-display text-xl md:text-h1 text-ink">发起活动</h1>
        <p className="mt-2 text-sm text-muted-foreground">组织线下徒步活动，号召伙伴一起出发</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onValid)}
          className="space-y-6 rounded-xl border border-border bg-card p-6 md:p-8"
        >
          {hasDraft && (
            <div className="flex items-center justify-between rounded-lg bg-pine-50 px-4 py-2.5 text-xs text-pine-700">
              <span>已恢复上次未发布的草稿</span>
              <button
                type="button"
                onClick={handleClearDraft}
                className="flex items-center gap-1 font-medium transition-colors hover:text-pine-900"
              >
                <Eraser size={12} />
                清除
              </button>
            </div>
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  活动标题 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="例如：周末·西山国家森林公园徒步"
                    maxLength={100}
                    className="border-border bg-card px-3.5 py-2.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    活动日期 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <DateField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="选择活动日期"
                      disabledMatcher={[{ before: todayDate }]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>难度</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-border bg-card px-3.5 py-2.5">
                        <SelectValue placeholder="请选择难度" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  集合地点 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="例如：北京市海淀区西山国家森林公园东门"
                    className="border-border bg-card px-3.5 py-2.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>人数上限</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      placeholder="不填则不限人数"
                      className="border-border bg-card px-3.5 py-2.5"
                      value={field.value === 0 ? '' : String(field.value)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const parsed: number = e.target.value === '' ? 0 : Number(e.target.value);
                        field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="signupDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>报名截止日期</FormLabel>
                  <FormControl>
                    <DateField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="可选，不填则以活动日期为准"
                      disabledMatcher={
                        eventDateValue
                          ? [
                              { before: todayDate },
                              { after: new Date(`${eventDateValue}T00:00:00`) },
                            ]
                          : [{ before: todayDate }]
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>活动封面图</FormLabel>
                <FormControl>
                  <ImageUrlPicker
                    value={field.value ? [field.value] : []}
                    onChange={(urls: string[]) => field.onChange(urls[0] ?? '')}
                    maxFiles={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>活动详情</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="描述活动路线、注意事项、所需装备等..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {errorMsg && <p className="text-xs text-destructive mt-1.5">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-pine-600 mt-1.5">{successMsg}</p>}

          <div className="flex gap-4 pt-2">
            <Link
              to="/events"
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2 md:px-5 md:py-2.5 text-center text-sm font-medium text-ink transition-colors hover:border-pine-300"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-pine-700 px-4 py-2 md:px-5 md:py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-800 disabled:opacity-50"
            >
              {loading ? '发布中...' : '发布活动'}
            </button>
          </div>
        </form>
      </Form>
      </div>
    </div>
  );
};

export default PublishEventPage;
