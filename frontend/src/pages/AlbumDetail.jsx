import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import PostCard from '../components/PostCard';

export default function AlbumDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ name: '', description: '', hashtags: '' });
  const [myPosts, setMyPosts] = useState([]);

  async function load() {
    try {
      const data = await api(`/api/albums/${id}`);
      setAlbum(data.album);
      setForm({
        name: data.album.name,
        description: data.album.description,
        hashtags: (data.album.hashtags || []).join(' '),
      });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user) {
      api(`/api/users/${user.username}/posts`).then((data) => setMyPosts(data.posts || []));
    }
  }, [user]);

  if (!album) {
    if (error) {
      return <p className="error" role="alert">{error}</p>;
    }
  
    return <p className="muted">Loading album…</p>;
  }

  const isOwner = user && album.owner && user.username === album.owner.username;

  async function save(event) {
    event.preventDefault();
    setError('');
    setStatus('');
  
    try {
      const data = await api(`/api/albums/${id}`, {
        method: 'PATCH',
        body: form,
      });
  
      await load();
      setStatus(data.message || 'Album updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to save the album. Please try again.');
    }
  }

  async function removeAlbum() {
    if (!window.confirm('Delete this album? Posts will stay online.')) return;
    await api(`/api/albums/${id}`, { method: 'DELETE' });
    navigate(`/users/${user.username}`);
  }

  return (
    <section>
      {error && <p className="error" role="alert">{error}</p>}
      {status && <p className="success" role="status">{status}</p>}
      <div className="card">
        <h1>{album.name}</h1>
        <p>{album.description}</p>
        <p className="tags">
          {(album.hashtags || []).map((tag) => (
            <a key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
              #{tag}
            </a>
          ))}
        </p>
      </div>
      {isOwner && (
  <form className="card stack" onSubmit={save}>
    <h2>Edit album</h2>

    {error && <p className="error" role="alert">{error}</p>}
    {status && <p className="success" role="status">{status}</p>}
          <input aria-label="Album name"
  placeholder="Album name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea aria-label="Album description"
  placeholder="Describe your album (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input aria-label="Album hashtags"
  placeholder="Hashtags (e.g. travel nature memories)" value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} />
          <button type="submit">Save album</button>
          <button type="button" className="danger" onClick={removeAlbum}>
            Delete album
          </button>
          <h3>Add or remove your posts</h3>
          {myPosts.map((post) => {
            const inAlbum = (album.posts || []).some((item) => item.id === post.id);
            return (
              <div key={post.id} className="row">
                <span>{post.description || 'Untitled photo'}</span>
                {inAlbum ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await api(`/api/albums/${id}/posts/${post.id}`, { method: 'DELETE' });
                      await load();
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await api(`/api/albums/${id}/posts`, { method: 'POST', body: { postId: post.id } });
                      await load();
                    }}
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </form>
      )}
      <div className="feed-list">
        {(album.posts || []).map((post) => (
          <PostCard key={post.id} post={post} onChange={load} />
        ))}
      </div>
    </section>
  );
}
