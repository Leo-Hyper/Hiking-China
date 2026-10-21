import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './hooks/use-hiking';

const loadHome = () => import('./pages/Home/Home');
const loadRoutesPage = () => import('./pages/Routes/RoutesPage');
const loadForumPage = () => import('./pages/Forum/ForumPage');
const loadGearPage = () => import('./pages/Gear/GearPage');
const loadEventsPage = () => import('./pages/Events/EventsPage');

const Home = lazy(loadHome);
const RoutesPage = lazy(loadRoutesPage);
const ForumPage = lazy(loadForumPage);
const GearPage = lazy(loadGearPage);
const EventsPage = lazy(loadEventsPage);
const EventDetailPage = lazy(() => import('./pages/Events/EventDetailPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetail/PostDetailPage'));
const PublishPostPage = lazy(() => import('./pages/PublishPost/PublishPostPage'));
const EditPostPage = lazy(() => import('./pages/EditPost/EditPostPage'));
const PublishEventPage = lazy(() => import('./pages/PublishEvent/PublishEventPage'));
const AuthPage = lazy(() => import('./pages/Auth/AuthPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const UserProfilePage = lazy(() => import('./pages/UserProfile/UserProfilePage'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

const PageFallback = () => (
  <div className="mx-auto max-w-7xl px-4 py-16 md:px-8" aria-label="页面加载中">
    <div className="h-8 w-48 animate-pulse rounded bg-muted" />
    <div className="mt-6 aspect-[16/8] animate-pulse rounded-lg bg-muted" />
  </div>
);

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

const RoutesComponent = () => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRoutesPage();
      void loadGearPage();
      void loadEventsPage();
      void loadForumPage();
      void import('./data/prefetch')
        .then(({ prefetchPrimaryData }) => prefetchPrimaryData())
        .catch(() => {});
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="gear" element={<GearPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="forum" element={<ForumPage />} />
          <Route path="post/:id" element={<PostDetailPage />} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="user/:id" element={<UserProfilePage />} />
        </Route>
        <Route path="publish" element={<RequireAuth><PublishPostPage /></RequireAuth>} />
        <Route path="publish-event" element={<RequireAuth><PublishEventPage /></RequireAuth>} />
        <Route path="post/:id/edit" element={<RequireAuth><EditPostPage /></RequireAuth>} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default RoutesComponent;
