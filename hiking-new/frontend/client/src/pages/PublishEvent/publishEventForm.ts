import { z } from 'zod';

export const DIFFICULTY_OPTIONS = ['初级', '中级', '高级'] as const;

const pad2 = (value: number): string => String(value).padStart(2, '0');

export const toDateString = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const todayString = (): string => toDateString(new Date());

export const formatDisplayDate = (value: string): string => {
  const date: Date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, '请填写活动标题').max(100, '标题不能超过100个字符'),
    eventDate: z.string().min(1, '请选择活动日期'),
    location: z.string().trim().min(1, '请填写集合地点'),
    difficulty: z.enum(DIFFICULTY_OPTIONS),
    maxParticipants: z
      .number()
      .int('人数上限需为整数')
      .min(0, '人数上限不能为负数')
      .max(500, '人数上限不能超过500'),
    signupDeadline: z.string(),
    imageUrl: z.string(),
    content: z.string(),
  })
  .superRefine((data, ctx) => {
    const today: string = todayString();
    if (data.eventDate && data.eventDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['eventDate'],
        message: '活动日期不能早于今天',
      });
    }
    if (data.signupDeadline) {
      if (data.signupDeadline < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['signupDeadline'],
          message: '报名截止不能早于今天',
        });
      } else if (data.eventDate && data.signupDeadline > data.eventDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['signupDeadline'],
          message: '报名截止不能晚于活动日期',
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

export const EVENT_FORM_DEFAULTS: EventFormValues = {
  title: '',
  eventDate: '',
  location: '',
  difficulty: '中级',
  maxParticipants: 0,
  signupDeadline: '',
  imageUrl: '',
  content: '',
};

const DRAFT_KEY = 'hiking_event_draft_v1';

export const loadEventDraft = (): EventFormValues | null => {
  try {
    const raw: string | null = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return { ...EVENT_FORM_DEFAULTS, ...(parsed as Partial<EventFormValues>) };
  } catch {
    /* 草稿损坏时回退默认值 */
    return null;
  }
};

export const saveEventDraft = (values: EventFormValues): void => {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    /* 存储不可用时忽略 */
  }
};

export const clearEventDraft = (): void => {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* 存储不可用时忽略 */
  }
};
