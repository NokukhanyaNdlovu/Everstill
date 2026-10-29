const base = process.env.API_BASE || 'http://localhost:4000';
let cookie = '';

async function request(method, urlPath, body) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const setCookie = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  if (setCookie.length) {
    cookie = setCookie.map((value) => value.split(';')[0]).join('; ');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${urlPath} -> ${response.status} ${data.error || ''}`);
  }
  return data;
}

async function main() {
  const health = await request('GET', '/api/health');
  if (!health.ok) throw new Error('Health check failed');

  const login = await request('POST', '/api/auth/login', { identifier: 'alice', password: 'Password123!' });
  if (!login.user || login.user.username !== 'alice') throw new Error('Alice login failed');
  if (!cookie.includes('sid=')) throw new Error('Session cookie was not set');

  const me = await request('GET', '/api/auth/me');
  if (me.user.username !== 'alice') throw new Error('Session did not persist');

  const local = await request('GET', '/api/posts/feed/local');
  const global = await request('GET', '/api/posts/feed/global');
  if (!local.posts.length) throw new Error('Local feed empty for alice (expected friend activity)');
  if (global.posts.length < 10) throw new Error('Global feed does not meet seed size');

  const hidden = global.posts.find((post) => post.hidden);
  if (!hidden) throw new Error('Expected a post hidden behind 3+ reports');
  const revealed = await request('GET', `/api/posts/${hidden.id}?reveal=1`);
  if (!revealed.post.imageUrl) throw new Error('Reveal did not return post content');

  const stranger = await request('GET', '/api/users/elena');
  if (!stranger.user.limited) throw new Error('Non-friend profile should be limited');

  const friend = await request('GET', '/api/users/bob');
  if (friend.user.limited || !friend.user.bio) throw new Error('Friend profile should be complete');

  const search = await request('GET', '/api/search?q=alcie');
  if (!search.users.some((item) => item.user.username === 'alice')) {
    throw new Error('Fuzzy user search did not match alice from "alcie"');
  }

  cookie = '';
  const adminLogin = await request('POST', '/api/auth/login', { identifier: 'admin', password: 'Password123!' });
  if (adminLogin.user.role !== 'admin') throw new Error('Admin login failed');
  const reports = await request('GET', '/api/reports/admin');
  if (!reports.items.length) throw new Error('Admin report feed empty');

  console.log('API checks passed: health, session cookie, feeds, profile visibility, report threshold, fuzzy search, admin reports.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
