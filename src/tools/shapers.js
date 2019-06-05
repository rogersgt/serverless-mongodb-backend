export function handleEventBody(event={}) {
  const { body } = event;
  if (typeof body === 'object') {
    return body;
  }

  const isJsonString = isJSON(body);
  return isJsonString ? JSON.parse(body) : body;
}

export function isJSON(stringInQuestion='') {
  try {
    JSON.parse(stringInQuestion);
    return true;
  } catch (error) {
    return false;
  }
}
