
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import SearchBox from './SearchBox';
import Toast from './Toast';
import { useCallback, useEffect, useState } from 'react';

export default function Layout() {
  const { user, setUser, notice, setNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingRequests, setPendingRequests] = useState(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setPendingRequests(0);
      return;
    }

    try {
      const data = await api('/api/notifications');
      setPendingRequests(data.pendingFriendRequests || 0);

      const unread = (data.notifications || []).find((item) => !item.read);
      if (unread) {
        setNotice(unread.message);
        api(`/api/notifications/${unread.id}/read`, { method: 'POST' }).catch(() => {});
      }
    } catch {
      // Keep the layout usable if notifications cannot be loaded.
    }
  }, [user, setNotice]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications, location.pathname]);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setPendingRequests(0);
    navigate('/');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to={user ? '/feed' : '/'} className="brand">
        Everstill
        </Link>

        {user && <SearchBox />}

        <nav className="nav">
          {user ? (
            <>
              <NavLink to="/feed">Feeds</NavLink>
              <NavLink to="/compose">Post</NavLink>
              <NavLink to={`/users/${user.username}`} className="profile-nav-link">
                Profile
                {pendingRequests > 0 && (
                  <span className="notification-badge" aria-label={`${pendingRequests} pending friend requests`}>
                    {pendingRequests > 99 ? '99+' : pendingRequests}
                  </span>
                )}
              </NavLink>
              {user.role === 'admin' && <NavLink to="/admin/reports">Reports</NavLink>}
              <button type="button" className="text-btn" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Join</NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <Toast message={notice} onClose={() => setNotice('')} />
    </div>
  );
}
