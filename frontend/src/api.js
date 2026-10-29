export async function api(path, options = {}) {
  const { body, form, method = 'GET', headers: extra = {} } = options;
  const headers = { ...extra };
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers,
    body: payload,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
