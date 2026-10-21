import * as api from '../api';
import type { HikingEvent } from './hiking-types';
import { mapEvent } from './mappers';
import { notify } from './store-runtime';

export async function listEvents(): Promise<HikingEvent[]> {
  const data = await api.listEvents();
  return (data.events || []).map(mapEvent);
}

export async function getEventById(id: number): Promise<HikingEvent | undefined> {
  try {
    const data = await api.getEvent(id);
    return data.event ? mapEvent(data.event) : undefined;
  } catch {
    return undefined;
  }
}

export async function createEvent(input: Omit<HikingEvent, 'id' | 'participants'>): Promise<HikingEvent> {
  const data = await api.createEvent({
    title: input.title,
    content: input.content,
    location: input.location,
    event_date: input.eventDate,
    difficulty: input.difficulty,
    max_participants: input.maxParticipants,
    image_url: input.imageUrl || '',
    signup_deadline: input.signupDeadline || '',
  });
  const event = await getEventById(data.id);
  if (!event) throw new Error('活动创建后读取失败');
  return event;
}

export async function isEventSignedUp(eventId: number): Promise<boolean> {
  const data = await api.checkJoined(eventId);
  return data.joined;
}

export async function toggleEventSignup(eventId: number): Promise<boolean> {
  const { joined } = await api.checkJoined(eventId);
  if (joined) {
    await api.leaveEvent(eventId);
    notify();
    return false;
  }
  await api.joinEvent(eventId);
  notify();
  return true;
}
