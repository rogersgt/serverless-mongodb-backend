import headers from '../headers/default';

export default function(data) {
  return {
    statusCode: 401,
    body: JSON.stringify(data) || data || 'Unauthorized',
    headers
  };
}
