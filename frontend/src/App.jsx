import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Compose from './pages/Compose';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import AlbumDetail from './pages/AlbumDetail';
import Search from './pages/Search';
import AdminReports from './pages/AdminReports';

function Guard({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Checking session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/feed" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={loading ? <p className="muted">Loading…</p> : user ? <Navigate to="/feed" /> : <Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/feed"
          element={
            <Guard>
              <Feed />
            </Guard>
          }
        />
        <Route
          path="/compose"
          element={
            <Guard>
              <Compose />
            </Guard>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <Guard>
              <PostDetail />
            </Guard>
          }
        />
        <Route
          path="/users/:username"
          element={
            <Guard>
              <Profile />
            </Guard>
          }
        />
        <Route
          path="/albums/:id"
          element={
            <Guard>
              <AlbumDetail />
            </Guard>
          }
        />
        <Route
          path="/search"
          element={
            <Guard>
              <Search />
            </Guard>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <Guard admin>
              <AdminReports />
            </Guard>
          }
        />
      </Route>
    </Routes>
  );
}
