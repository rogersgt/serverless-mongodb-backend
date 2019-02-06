import headers from '../headers/default';

export default function(data) {
  return {
    statusCode: 400,
    body: JSON.stringify(data) || data || 'Bad Request',
    headers
  };
}
