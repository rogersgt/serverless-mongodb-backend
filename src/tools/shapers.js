export function handleEventBody(event={}) {
  const body = event.body;
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

export function objToSchema(obj={}) {
  const schema = {};
  for (const prop in obj) {
    schema[prop] = dataToType(obj[prop]);
  }
  return schema;

  function dataToType(data) {
    switch(typeof data) {
      case 'string': return String;
      case 'number': return Number;
      case 'date': return Date;
      default: return String;
    }
  }
}
