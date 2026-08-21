export interface HikingUser {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  hikinglevel: number;
  gearPrefs: string[];
  profilePublic: boolean;
  createdAt: string;
}

export interface UserStats {
  postCount: number;
  followersCount: number;
  followingCount: number;
}

export interface RouteExtra {
  difficulty: number;
  duration: string;
  elevationGain: string;
  distance: number;
  start: string;
  end: string;
  coordinates: [number, number][];
}

export interface GearExtra {
  brand: string;
  model: string;
  price: string;
  usage: string;
}

export interface PostExtraInfo {
  route?: RouteExtra;
  gear?: GearExtra;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  imageUrls: string[];
  authorId: number;
  authorName: string;
  views: number;
  status: number;
  createdAt: string;
  extrainfo?: PostExtraInfo;
  isUserPost?: boolean;
}

export interface PostInput {
  title: string;
  content: string;
  category: string;
  tags: string[];
  imageUrls: string[];
  extrainfo?: PostExtraInfo;
  status: number;
}

export interface HikingComment {
  id: number;
  postId: number;
  parentId: number | null;
  replyToUserId?: number;
  replyToUsername?: string;
  userId: number;
  username: string;
  avatar?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  createdAt: string;
  replies?: HikingComment[];
}

export interface RouteItem {
  id: number;
  name: string;
  region: string;
  difficulty: string;
  description: string;
  distance: number;
  duration: string;
  rating: number;
  image: string;
  postId?: number;
}

export interface GearItem {
  id: number;
  name: string;
  category: string;
  desc: string;
  image: string;
}

export interface HikingEvent {
  id: number;
  title: string;
  eventDate: string;
  location: string;
  difficulty: string;
  maxParticipants: number;
  content: string;
  imageUrl?: string;
  signupDeadline?: string;
  participants: number;
}

export interface SearchItem {
  id: number;
  type: 'post' | 'forum' | 'gear' | 'route';
  title: string;
  category: string;
  date: string;
  author: string;
  tags: string[];
  excerpt: string;
  route: string;
}
