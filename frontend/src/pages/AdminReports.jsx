import { useEffect, useState } from 'react';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api('/api/reports/admin');
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <section>
      <h1>Reported posts</h1>
      {items.length === 0 && <p className="empty">No active reports.</p>}
      {items.map((item) => (
        <div key={item.post.id} className="card report-block">
          <p>
            <strong>{item.reportCount}</strong> active report{item.reportCount === 1 ? '' : 's'}
          </p>
          <ul>
            {item.reports.map((report) => (
              <li key={report.id}>
                {report.reason}
                {report.explanation ? ` — ${report.explanation}` : ''} ({report.reporter?.name})
                <button
                  type="button"
                  className="text-btn"
                  onClick={async () => {
                    await api(`/api/reports/admin/reports/${report.id}`, { method: 'DELETE' });
                    await load();
                  }}
                >
                  Remove this report
                </button>
              </li>
            ))}
          </ul>
          <div className="row">
            <button
              type="button"
              onClick={async () => {
                await api(`/api/reports/admin/posts/${item.post.id}/clear-reports`, { method: 'POST' });
                await load();
              }}
            >
              Remove all reports
            </button>
            <button
              type="button"
              className="danger"
              onClick={async () => {
                await api(`/api/reports/admin/posts/${item.post.id}`, { method: 'DELETE' });
                await load();
              }}
            >
              Delete post
            </button>
          </div>
          <PostCard post={item.post} onChange={load} />
        </div>
      ))}
    </section>
  );
}
