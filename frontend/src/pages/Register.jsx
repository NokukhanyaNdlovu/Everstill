import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/api/auth/register', { method: 'POST', body: form });
      setUser(data.user);
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="auth-card card" onSubmit={submit}>
      <h1>Join Everstill</h1>
      <label>
        Name
        <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
      </label>
      <label>
        Username
        <input value={form.username} onChange={(e) => update('username', e.target.value)} required />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit">Create account</button>
      <p className="muted">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
