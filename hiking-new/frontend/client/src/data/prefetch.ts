import { listPosts } from './post-store';
import { listEvents } from './event-store';

export async function prefetchPrimaryData(): Promise<void> {
  await Promise.allSettled([
    listPosts(),
    listEvents(),
  ]);
}
