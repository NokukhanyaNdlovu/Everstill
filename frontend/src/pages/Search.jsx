import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api(`/api/search?q=${encodeURIComponent(q)}`)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q]);

  if (!q) return <p className="muted">Type a search in the header.</p>;
  if (loading) return <p className="muted">Searching…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!result) return null;

  return (
    <section className="search-page">
      <h1>Results for “{result.query}”</h1>
      <p className="muted">Matches include incomplete, swapped, and nearby spellings.</p>

      <h2>People</h2>
      <ul className="result-list">
        {result.users.map((item) => (
          <li key={item.user.id}>
            <Link to={`/users/${item.user.username}`}>
              {item.user.name} <em>@{item.user.username}</em>
            </Link>
          </li>
        ))}
        {result.users.length === 0 && <li className="empty">No people found.</li>}
      </ul>

      <h2>Hashtags</h2>
      <p className="tags">
        {result.hashtags.map((item) => (
          <Link key={item.hashtag} to={`/search?q=${encodeURIComponent(item.hashtag)}`}>
            #{item.hashtag}
          </Link>
        ))}
        {result.hashtags.length === 0 && <span className="empty">No hashtags found.</span>}
      </p>

      <h2>Albums</h2>
      <div className="album-grid">
        {result.albums.map((item) => (
          <Link key={item.album.id} className="card album-tile" to={`/albums/${item.album.id}`}>
            <h3>{item.album.name}</h3>
            <p>{item.album.description}</p>
          </Link>
        ))}
        {result.albums.length === 0 && <p className="empty">No albums found.</p>}
      </div>

      <h2>Posts</h2>
      <div className="feed-list">
        {result.posts.map((item) => (
          <PostCard key={item.post.id} post={item.post} />
        ))}
        {result.posts.length === 0 && <p className="empty">No posts found.</p>}
      </div>
    </section>
  );
}
