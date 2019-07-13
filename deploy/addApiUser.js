require('colors');
const genPwd = require('generate-password');
const Rhinocloud = require('rhinocloud-sdk');
const { SSM } = require('aws-sdk');
const { MongoClient } = require('mongodb');

const {
  AWS_REGION = 'us-east-1',
} = process.env;

const WAIT_MS = 15000;

const rc = new Rhinocloud({ region: AWS_REGION });
const ssm = new SSM({ region: AWS_REGION });

async function getConnection(mongoUri) {
  try {
    conn = await MongoClient.connect(mongoUri, { useNewUrlParser: true });
    return conn;
  } catch (error) {
    if (error.name === 'MongoNetworkError') {
      console.log(`Mongo server not ready yet. Retrying in ${WAIT_MS / 1000}s...`);
      await new Promise((res) => setTimeout(res, WAIT_MS));
    } else {
      throw error;
    }
  }
}

async function saveApiCredentials({ username, password, paramPath }) {
  await ssm.putParameter({
    Name: `${paramPath}/API_USERNAME`,
    Value: username,
    Type: 'SecureString',
  }).promise();

  return ssm.putParameter({
    Name: `${paramPath}/API_PASSWORD`,
    Value: password,
    Type: 'SecureString',
  }).promise();
}

module.exports = async function initializeDB({
  dbCloudFormationStack,
  dbName = 'db',
  apiUserName,
  apiPassword,
  paramPath,
}) {
  let conn;

  try {
    const outputs = await rc.cloudformation.getStackOutputs(dbCloudFormationStack);
    const { OutputValue:dbHost } = outputs.find((o) => o.OutputKey === 'DbHost');
    const MONGO_URI = `mongodb://${apiUserName}:${apiPassword}@${dbHost}:27017/${dbName}?authSource=admin`;
    conn = await getConnection(MONGO_URI);

    const appDB = conn.db(DB_NAME);
    await appDB.addUser(API_USER, API_PASSWORD, {
      roles: [{
        role: 'readWrite',
        db: DB_NAME
      }]
    });
    conn.close();

    await saveApiCredentials({
      username: API_USER,
      password: API_PASSWORD,
      paramPath,
    });
  } catch (error) {
    console.log(error);
    conn.close();
    process.exit(1);
  }
}
