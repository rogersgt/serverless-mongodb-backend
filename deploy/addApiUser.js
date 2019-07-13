require('colors');
const genPwd = require('generate-password');
const { MongoClient } = require('mongodb');

const {
  MONGO_URI = 'mongodb://127.0.0.1:27017',
  DB_NAME = 'db',
  API_USER = 'api',
  API_PASSWORD = genPwd.generate({ numbers: true, length: 10 })
} = process.env;

module.exports = async function initializeDB() {
  let conn;

  try {
    conn = await MongoClient.connect(MONGO_URI, { useNewUrlParser: true });

    const appDB = conn.db(DB_NAME);
    await appDB.addUser(API_USER, API_PASSWORD, {
      roles: [{
        role: 'readWrite',
        db: DB_NAME
      }]
    });
    conn.close();
    console.log(`
      Serverless API Credentials.
    `.gray,
    `
    **RETAIN THESE FOR FUTURE DEPLOYMENTS**
    `.red,
    `username:`.gray,
    `${API_USER}`.green,
    `password:`.gray,
    `${API_PASSWORD}`.green,
    `
    Include the connection uri in your env.json. Don't forget to replace the placeholders with
    your mongo host and port.
    {
      "MONGO_URI": "mongodb://${API_USER}:${API_PASSWORD}@<your mongo host>:<your mongo port>/${DB_NAME}"
    }
    `
    );
  } catch (error) {
    console.log(error);
    conn.close();
    process.exit(1);
  }
}
