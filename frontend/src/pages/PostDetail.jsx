import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/posts/${id}`)
      .then((data) => setPost(data.post))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!post) return <p className="muted">Loading post…</p>;
  return <PostCard post={post} />;
}
