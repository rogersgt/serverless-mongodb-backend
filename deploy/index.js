/* eslint-disable no-console */
require('colors');
const Rhinocloud = require('rhinocloud-sdk');
const genPwd = require('generate-password');
const { SSM } = require('aws-sdk');
const upsertMongoUser = require('./upsertMongoUser');

let {
  API_USERNAME,
  API_PASSWORD,
  AWS_REGION = 'us-east-1',
  MONGO_MASTER_USERNAME,
  MONGO_MASTER_PASSWORD,
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

async function getApiCredsFromSSMStore() {
  const SSM_USERNAME_PATH = `${PARAM_PATH}/API_USERNAME`;
  const SSM_PW_PATH = `${PARAM_PATH}/API_PASSWORD`;
  const getParams = {
    Path: PARAM_PATH,
    WithDecryption: true,
  };
  const { Parameters:params } = await ssm.getParametersByPath(getParams).promise();
  const usernameParam = params.find((p) => p.Name === SSM_USERNAME_PATH);
  const passwordParam = params.find((p) => p.Name === SSM_PW_PATH);
  const ssmUserVal = !!usernameParam ? usernameParam.Value : undefined;
  const ssmPwVal = !!passwordParam ? passwordParam.Value : undefined;

  return {
    creds: {
      username: ssmUserVal,
      password: ssmPwVal,
    },
  };
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
  }, {
    key: 'ParamPath',
    value: PARAM_PATH,
  }];

  return params;
}

async function handleMongoApiUser() {
  console.log(`Updating MongoDB Credentials for the API...`);
  const { username, password } = await getApiCredsFromSSMStore();
  const newApiUsername = API_USERNAME || username || genPwd.generate({ length: 8, numbers: true });
  const newApiPassword = API_PASSWORD || password || genPwd.generate({ length: 20, numbers: true });

  if (newApiUsername !== username || newApiPassword !== password) {
    await upsertMongoUser({
      targetUsername: username,
      targetPassword: password,
      masterUsername: MONGO_MASTER_USERNAME,
      masterPassword: MONGO_MASTER_PASSWORD,
      dbName: DB_NAME,
      dbCloudFormationStack: CF_DB_STACKNAME,
    });

    return saveApiCreds({ username: newApiUsername, password: newApiPassword });
  }

  return {
    username,
    password,
  };
}

async function handleRootMongoCreds() {
  const params = await ssm.getParametersByPath({ Path: PARAM_PATH, WithDecryption: true }).promise();
  const stackExists = await rc.cloudformation.stackExists(CF_DB_STACKNAME);
  const userParam = params.find((p) => p.Name === `${PARAM_PATH}/MONGO_MASTER_USERNAME`);
  const pwParam = params.find((p) => p.Value === `${PARAM_PATH}/MONGO_MASTER_PASSWORD`);

  const ssmUserVal = !!userParam ? userParam.Value : undefined;
  const ssmPwVal = !!pwParam ? pwParam.Value : undefined;

  const newRootUsername = MONGO_MASTER_USERNAME || ssmUserVal || genPwd.generate({ length: 10, numbers: true });
  const newRootPass = MONGO_MASTER_PASSWORD || ssmPwVal || genPwd.generate({ length: 20, numbers: true });

  if (!newRootUsername !== ssmUserVal || newRootPass !== ssmPwVal) {
    await saveMasterCredentialsToParamStore({
      username: newRootUsername,
      password: newRootPass,
    });
  }

  if (stackExists) {
    await upsertMongoUser({
      dbCloudFormationStack: CF_DB_STACKNAME,
      targetUsername: newRootUsername,
      targetPassword: newRootPass,
      masterUsername: ssmUserVal,
      masterPassword: ssmPwVal,
    });
  }

  return {
    username: newRootUsername,
    password: newRootPass,
  };
}

async function saveApiCreds({ username, password }) {
  const USERNAME_PARAM_NAME = `${PARAM_PATH}/API_USERNAME`;
  const PASSWORD_PARAM_NAME = `${PARAM_PATH}/API_PASSWORD`;

  await ssm.putParameter({
    Name: USERNAME_PARAM_NAME,
    Value: username,
    Type: 'SecureString',
    Overwrite: true,
  }).promise();

  await ssm.putParameter({
    Name: PASSWORD_PARAM_NAME,
    Value: password,
    Type: 'SecureString',
    Overwrite: true,
  }).promise();

  return {
    username,
    password,
  };
}

async function saveMasterCredentialsToParamStore({ username, password }) {
  console.log(`Saving Master MongoDB Credentials to the SSM Parameter Store...`);
  await ssm.putParameter({
    Name: `${PARAM_PATH}/MONGO_MASTER_USERNAME`,
    Value: username,
    Description: `Master MongoDB Username used for stage: ${STAGE}`,
    Type: 'SecureString',
  }).promise();

  return ssm.putParameter({
    Name: `${PARAM_PATH}/MONGO_MASTER_PASSWORD`,
    Value: password,
    Description: `Master MongoDB Password used for stage: ${STAGE}`,
    Type: 'SecureString',
  }).promise();
}

// ---------------------- entry point ------------------- //
(function deploy() {
  return Promise.resolve()
    .then(handleRootMongoCreds)
    .then(createOrUpdateMongoDB)
    .then(handleMongoApiUser)
    .then(() => console.log('Completed deployment'))
    .catch((e) => {
      console.log(e);
      process.exit(1);
    });
})();
