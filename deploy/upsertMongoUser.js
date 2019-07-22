
/* eslint-disable no-console */
require('colors');
const Rhinocloud = require('rhinocloud-sdk');
const { getConnection } = require('./helpers');

const {
  AWS_REGION = 'us-east-1',
} = process.env;

const rc = new Rhinocloud({ region: AWS_REGION });


module.exports = async function({
  dbCloudFormationStack,
  dbName = 'db',
  targetUsername,
  targetPassword,
  masterUsername,
  masterPassword,
}) {
  const outputs = await rc.cloudformation.getStackOutputs(dbCloudFormationStack);
  const { OutputValue:dbHost } = outputs.find((o) => o.OutputKey === 'DbHost');
  const MONGO_URI = `mongodb://${masterUsername}:${masterPassword}@${dbHost}:27017/${dbName}?authSource=admin`;
  const conn = await getConnection(MONGO_URI);
  const appDB = conn.db(DB_NAME);

  const targetUser = await appDB.getUser(targetUsername);
  if (!targetUser) {
    await appDB.addUser(targetUsername, targetPassword, {
      roles: [{
        role: 'readWrite',
        db: dbName,
      }]
    });
  } else {
    await appDB.changeUserPassword(targetUsername, targetPassword);
  }

  return conn.close();
}
