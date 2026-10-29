import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const EMOJIS = ['❤️', '😂', '🔥', '😮', '😢'];
const REASONS = [
  'Spam or scam',
  'Harassment or bullying',
  'Hate or hateful conduct',
  'Violence or dangerous content',
  'Nudity or sexual content',
  'Self-harm or suicide content',
  'False or misleading information',
  'Intellectual property/copyright concern',
  'Other',
];

export default function PostCard({ post, onChange }) {
  const { user } = useAuth();
  const [local, setLocal] = useState(post);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(post.description || '');
  const [hashtags, setHashtags] = useState((post.hashtags || []).join(' '));
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function reveal() {
    const data = await api(`/api/posts/${local.id}?reveal=1`);
    setLocal(data.post);
  }

  async function addComment(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api(`/api/posts/${local.id}/comments`, { method: 'POST', body: { text: comment } });
      setComment('');
      setLocal((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), data.comment],
        commentCount: (prev.commentCount || 0) + 1,
      }));
      setStatus('Comment posted');
    } catch (err) {
      setError(err.message);
    }
  }

  async function react(emoji) {
    try {
      const data = await api(`/api/posts/${local.id}/comments`, { method: 'POST', body: { emoji } });
      setLocal((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), data.comment],
        commentCount: (prev.commentCount || 0) + 1,
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    try {
      const data = await api(`/api/posts/${local.id}`, {
        method: 'PATCH',
        body: { description, hashtags },
      });
      setLocal(data.post);
      setEditing(false);
      setStatus('Post updated');
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this post and its comments?')) return;
  
    setError('');
    setStatus('');
  
    try {
      await api(`/api/posts/${local.id}`, { method: 'DELETE' });
  
      setStatus('Post deleted successfully.');
  
      if (onChange) onChange();
    } catch (err) {
      setError(err.message || 'Unable to delete the post. Please try again.');
    }
  }

  async function report(event) {
    event.preventDefault();
    try {
      await api('/api/reports', {
        method: 'POST',
        body: { postId: local.id, reason, explanation },
      });
      setReportOpen(false);
      setStatus('Report submitted');
    } catch (err) {
      setError(err.message);
    }
  }

  if (local.hidden) {
    return (
      <article className="card post-card hidden-post">
        <p className="notice">This post has been reported by the community.</p>
        <button type="button" onClick={reveal}>
          View post anyway
        </button>
      </article>
    );
  }

  const isOwner = user && local.creator && user.username === local.creator.username;
  const isAdmin = user && user.role === 'admin';

  return (
    <article className="card post-card">
      <header className="post-head">
        <Link to={`/users/${local.creator.username}`} className="who">
          {local.creator.profilePicture && <img src={local.creator.profilePicture} alt="" />}
          <span>{local.creator.name}</span>
          <em>@{local.creator.username}</em>
        </Link>
        <Link to={`/posts/${local.id}`} className="muted">
          Open
        </Link>
      </header>
      <img className="post-image" src={local.imageUrl} alt={local.description || 'Photo'} />
      {editing ? (
        <form onSubmit={saveEdit} className="stack">
          <label>
          Post description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write the post description..."/>
          </label>
          <label>
          Add hashtags
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="hashtags" />
          </label>
          <p className="muted">The photo cannot be replaced.</p>
          <button type="submit">Save</button>
        </form>
      ) : (
        <>
          <p>{local.description}</p>
          <p className="tags">
            {(local.hashtags || []).map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>
            ))}
          </p>
        </>
      )}
      <div className="emoji-row">
        {EMOJIS.map((emoji) => (
          <button type="button" key={emoji} onClick={() => react(emoji)} aria-label={`React ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
      <ul className="comments">
        {(local.comments || []).map((item) => (
          <li key={item.id} className={item.isEmoji ? 'emoji-comment' : ''}>
            <strong>{item.author?.name}</strong> {item.text}
          </li>
        ))}
      </ul>
      <form className="comment-form" onSubmit={addComment}>
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment" />
        <button type="submit">Send</button>
      </form>
      <div className="post-actions">
      {(isOwner || isAdmin) && (
  <>
    <button
      type="button"
      className="text-btn"
      onClick={() => setEditing((v) => !v)}
    >
      Edit text
    </button>
    <button type="button" className="text-btn" onClick={remove}>
      Delete
    </button>
  </>
)}
        <button type="button" className="text-btn" onClick={() => setReportOpen((v) => !v)}>
          Report
        </button>
      </div>
      {reportOpen && (
        <form className="stack" onSubmit={report}>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Short explanation (required for Other)" />
          <button type="submit">Submit report</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      {status && <p className="success">{status}</p>}
    </article>
  );
}
