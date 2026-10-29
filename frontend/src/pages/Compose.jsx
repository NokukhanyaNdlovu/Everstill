import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Compose() {
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!file) {
      setError('Choose a photo');
      return;
    }
    const form = new FormData();
    form.append('image', file);
    form.append('description', description);
    form.append('hashtags', hashtags);
    try {
      const data = await api('/api/posts', { method: 'POST', form });
      navigate(`/posts/${data.post.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card stack compose" onSubmit={submit}>
      <h1>New photo</h1>
      <label>
        Photo
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Hashtags
        <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="harbour ocean" />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Publish</button>
    </form>
  );
}
