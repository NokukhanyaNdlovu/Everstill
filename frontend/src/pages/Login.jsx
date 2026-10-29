import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { identifier, password } });
      setUser(data.user);
      setSuccess('Signed in');
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="auth-card card" onSubmit={submit}>
      <h1>Sign in</h1>
      <label>
        Email or username
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button type="submit">Continue</button>
      <p className="muted">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );
}
