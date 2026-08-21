import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import Home from './pages/Home/Home';
import RoutesPage from './pages/Routes/RoutesPage';
import ForumPage from './pages/Forum/ForumPage';
import GearPage from './pages/Gear/GearPage';
import EventsPage from './pages/Events/EventsPage';
import EventDetailPage from './pages/Events/EventDetailPage';
import PostDetailPage from './pages/PostDetail/PostDetailPage';
import PublishPostPage from './pages/PublishPost/PublishPostPage';
import EditPostPage from './pages/EditPost/EditPostPage';
import PublishEventPage from './pages/PublishEvent/PublishEventPage';
import AuthPage from './pages/Auth/AuthPage';
import ProfilePage from './pages/Profile/ProfilePage';
import UserProfilePage from './pages/UserProfile/UserProfilePage';
import { useAuth } from './hooks/use-hiking';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

const RoutesComponent = () => {
  return (
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
  );
};

export default RoutesComponent;
