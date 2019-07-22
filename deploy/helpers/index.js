const { MongoClient } = require('mongodb');

const WAIT_MS = 15000;

export async function getConnection(mongoUri) {
  try {
    const conn = await MongoClient.connect(mongoUri, { useNewUrlParser: true });
    return conn;
  } catch (error) {
    if (error.name === 'MongoNetworkError') {
      console.log(`Mongo server not ready yet. Retrying in ${WAIT_MS / 1000}s...`); // eslint-disable-line no-console
      await new Promise((res) => setTimeout(res, WAIT_MS));
      return getConnection(mongoUri);
    } else {
      throw error;
    }
  }
}