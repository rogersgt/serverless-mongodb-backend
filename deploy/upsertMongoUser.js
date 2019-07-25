
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
  admin = false,
}) {
  const outputs = await rc.cloudformation.getStackOutputs(dbCloudFormationStack);
  const { OutputValue:dbHost } = outputs.find((o) => o.OutputKey === 'DbHost');
  const MONGO_URI = `mongodb://${masterUsername}:${masterPassword}@${dbHost}:27017/${dbName}?authSource=admin`;
  const conn = await getConnection(MONGO_URI);

  try {
    await conn.db('admin')
      .addUser(targetUsername, targetPassword, {
        roles: [{
          role: admin ? 'userAdmin' : 'readWrite',
          db: dbName,
        }],
      });
  } catch (e) {
    if (e.message && e.message === `User "${targetUsername}@admin" already exists`) {
      console.log(e.message);
    } else {
      throw e;
    }
  }

  return conn.close();
}
