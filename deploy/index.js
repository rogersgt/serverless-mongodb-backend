const Rhinocloud = require('rhinocloud-sdk');
const addApiUser = require('./addApiUser');

const rc = new Rhinocloud();

const {
  MONGO_MASTER_USERNAME,
  MONGO_MASTER_PASSWORD,
  DB_LOG_RETENTION = 1,
  DB_INSTANCE_TYPE = 't2.small',
  DB_STORAGE = '10GB',
  STAGE = 'dev',
  CF_DB_STACKNAME = `mongodb-${STAGE}`,
  IOPS = 100,
  KEYPAIR_NAME,
  MONGO_VERSION = 'latest',
  SSH_ALLOW_ORIGIN,
  WHITELIST_CIDR_IP = '0.0.0.0/0',
} = process.env;

let IS_NEW_DEPLOYMENT = true;


// --------------------- functions ----------------------- //
function createOrUpdateMongoDB() {
  return rc.cloudformation.cloudForm({
    stackName: CF_DB_STACKNAME,
    templatePath: `${__dirname}/cf.mongodb.yml`,
    options: {
      parameters: getParameters(),
      protectedResourceTypes: ['AWS::EC2::Instance'], // never cause a db replacement to deployed cluster
    },
  });
}

async function getParameters() {
  const IS_NEW_DEPLOYMENT = await rc.cloudformation.stackExists(CF_DB_STACKNAME);
  const freshDeployParams = [{
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
    value: IOPS,
  }, {
    key: 'Stage',
    value: STAGE,
  }, {
    key: 'LogRetention',
    value: DB_LOG_RETENTION,
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
  }];

  if (IS_NEW_DEPLOYMENT) {
    return freshDeployParams;
  }
  return [];
}

function handleApiCredentials() {
  if (IS_NEW_DEPLOYMENT) {
    return addApiUser();
  }
  console.log('Not a new deployment, skipping create API user...');
  return Promise.resolve(false);
}

// ---------------------- entry point ------------------- //
(async function deploy() {
  // createOrUpdateMongoDB()
  // .then(handleApiCredentials)
  // .then(() => console.log('Completed deployment'))
  // .catch((e) => {
  //   console.log(e);
  //   process.exit(1);
  // });
  console.log(CF_DB_STACKNAME);
})();
