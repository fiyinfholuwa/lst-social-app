import { API_BASE_URL } from '../api/config';

const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
const apiHost = apiOrigin.replace(/^https?:\/\//i, '').split('/')[0];

export const resolveMediaUri = uri => {
  if (typeof uri !== 'string' || !uri.trim()) return null;

  const value = uri.trim();
  if (/^(data|file|content|blob):/i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (value.startsWith('/')) return `${apiOrigin}${value}`;
  if (!/^https?:\/\//i.test(value)) return `${apiOrigin}/${value.replace(/^\/+/, '')}`;

  const valueHost = value.replace(/^https?:\/\//i, '').split('/')[0];
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(valueHost)) {
    return value.replace(/^https?:\/\/[^/]+/i, apiOrigin);
  }
  if (apiOrigin.startsWith('https://') && value.startsWith('http://') && valueHost === apiHost) {
    return `https://${value.slice('http://'.length)}`;
  }

  return value;
};
