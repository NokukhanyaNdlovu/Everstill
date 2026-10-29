
import { useEffect, useState } from 'react';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function Feed() {
  const [mode, setMode] = useState('local');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  async function load(nextMode = mode) {
    setLoading(true);
    setError('');
    setPage(1);

    try {
      const data = await api(`/api/posts/feed/${nextMode}?page=1`);
      setPosts(data.posts || []);
      setHasMore(data.hasMore || false);
    } catch (err) {
      setError(err.message);
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setError('');

    try {
      const data = await api(
        `/api/posts/feed/${mode}?page=${nextPage}`
      );

      setPosts((current) => [...current, ...(data.posts || [])]);
      setPage(nextPage);
      setHasMore(data.hasMore || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <section className="feed-page">
      <div className="feed-switch">
        <button
          type="button"
          className={mode === 'local' ? 'active' : ''}
          onClick={() => setMode('local')}
        >
          Local
        </button>
        <button
          type="button"
          className={mode === 'global' ? 'active' : ''}
          onClick={() => setMode('global')}
        >
          Global
        </button>
      </div>

      <p className="muted">
        {mode === 'local'
          ? 'Activity from friends and you.'
          : 'Activity from everyone.'}
      </p>

      {loading && <p className="muted">Loading feed…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && posts.length === 0 && !error && (
        <p className="empty">No posts in this feed yet.</p>
      )}

      <div className="feed-list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onChange={() => load(mode)}
          />
        ))}
      </div>

      {!loading && hasMore && (
        <div className="feed-pagination">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading more…' : 'Load more posts'}
          </button>
        </div>
      )}

      {!loading && !hasMore && posts.length > 0 && (
        <p className="muted">You've reached the end of the feed.</p>
      )}
    </section>
  );
}
