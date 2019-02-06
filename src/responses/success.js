import headers from '../headers/default';

export default function(data) {
  return {
    statusCode: !!data ? 200 : 204,
    ...data && { body: JSON.stringify(data) || data },
    headers
  };
}
