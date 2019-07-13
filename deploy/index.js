/* eslint-disable no-console */
require('colors');
const Rhinocloud = require('rhinocloud-sdk');
const genPwd = require('generate-password');
const { SSM } = require('aws-sdk');
const addApiUser = require('./addApiUser');

const {
  API_USERNAME = genPwd.generate({ length: 8, numbers: true }),
  API_PASSWORD = genPwd.generate({ length: 20, numbers: true }),
  AWS_REGION = 'us-east-1',
  MONGO_MASTER_USERNAME = genPwd.generate({ length: 8, numbers: true }),
  MONGO_MASTER_PASSWORD = genPwd.generate({ length: 20, numbers: true }),
  DB_LOG_RETENTION = 1,
  DB_INSTANCE_TYPE = 't2.small',
  DB_STORAGE = '10GB',
  DB_NAME = 'db',
  STAGE = 'dev',
  CF_DB_STACKNAME = `mongodb-${STAGE}`,
  PARAM_PATH = `/${CF_DB_STACKNAME}`,
  IOPS = 100,
  IMAGE_ID = '',
  KEYPAIR_NAME = '',
  MONGO_VERSION = 'latest',
  SSH_ALLOW_ORIGIN = '',
  WHITELIST_CIDR_IP = '0.0.0.0/0',
} = process.env;

let IS_NEW_DEPLOYMENT = true;

const rc = new Rhinocloud({ region: AWS_REGION });
const ssm = new SSM({ region: AWS_REGION });

// --------------------- functions ----------------------- //
function createOrUpdateMongoDB() {
  console.log(`Upserting CloudFormation for mongodb...`);
  return rc.cloudformation.cloudForm({
    stackName: CF_DB_STACKNAME,
    templatePath: `${__dirname}/../cf.mongodb.yml`,
    options: {
      parameters: getParameters(),
      protectedResourceTypes: [ // never cause a db replacement to deployed cluster
        'AWS::EC2::Instance',
        'AWS::EC2::Volume',
        'AWS::EC2::LaunchTemplate',
      ],
    },
  });
}

function getParameters() {
  const params = [{
    key: 'InstanceType',
    value: DB_INSTANCE_TYPE,
  }, {
    key: 'WhitelistCidrIp',
    value: WHITELIST_CIDR_IP,
  }, {
    key: 'MongoVersion',
    value: MONGO_VERSION,
  }, {
    key: 'DBStorage',
    value: DB_STORAGE,
  }, {
    key: 'Iops',
    value: `${IOPS}`,
  }, {
    key: 'Stage',
    value: STAGE,
  }, {
    key: 'LogRetention',
    value: `${DB_LOG_RETENTION}`,
  }, {
    key: 'KeyPairName',
    value: KEYPAIR_NAME,
  }, {
    key: 'SSHAllowedOriginIP',
    value: SSH_ALLOW_ORIGIN,
  }, {
    key: 'MasterUsername',
    value: MONGO_MASTER_USERNAME,
  }, {
    key: 'MasterPassword',
    value: MONGO_MASTER_PASSWORD,
  }, {
    key: 'ImageId',
    value: IMAGE_ID,
  }];

  return params;
}

function handleApiCredentials() {
  if (IS_NEW_DEPLOYMENT) {
    console.log(`Creating MongoDB Credentials for the API...`);
    return addApiUser({
      apiUserName: API_USERNAME,
      apiPassword: API_PASSWORD,
      paramPath: PARAM_PATH,
      dbName: DB_NAME,
      dbCloudFormationStack: CF_DB_STACKNAME,
    });
  }
  console.log('Not a new deployment, skipping create API user...');
  return Promise.resolve(false);
}

async function saveMasterCredentials() {
  if (IS_NEW_DEPLOYMENT) {
    console.log(`Saving Master MongoDB Credentials to the SSM Parameter Store...`);
    await ssm.putParameter({
      Name: `${PARAM_PATH}/MONGO_MASTER_USERNAME`,
      Value: `${MONGO_MASTER_USERNAME}`,
      Description: `Master MongoDB Username used for stage: ${STAGE}`,
      Type: 'SecureString',
    }).promise();

    return ssm.putParameter({
      Name: `${PARAM_PATH}/MONGO_MASTER_PASSWORD`,
      Value: `${MONGO_MASTER_PASSWORD}`,
      Description: `Master MongoDB Password used for stage: ${STAGE}`,
      Type: 'SecureString',
    }).promise();
  }
  return true;
}

async function setIsNewDeployment() {
  const exists = await rc.cloudformation.stackExists(CF_DB_STACKNAME);
  IS_NEW_DEPLOYMENT = !exists;
}


// ---------------------- entry point ------------------- //
(function deploy() {
  setIsNewDeployment()
  .then(createOrUpdateMongoDB)
  .then(saveMasterCredentials)
  .then(handleApiCredentials)
  .then(() => console.log('Completed deployment'))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
})();
