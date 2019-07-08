const Rhinocloud = require('rhinocloud-sdk');

const rc = new Rhinocloud();

const {
  MONGO_MASTER_USERNAME,
  MONGO_MASTER_PASSWORD,
  API_USERNAME,
  API_PASSWORD,
  CF_DB_STACKNAME = 'mongodb-dev',
  CF_APP_STACKNAME = 'api-dev',
  DB_PORT = 27017,
  DB_LOG_RETENTION,
  DB_INSTANCE_TYPE,
  DB_STORAGE,
  ENVIRONMENT,
  IOPS,
  KEYPAIR_NAME,
  MONGO_VERSION,
  SSH_ALLOW_ORIGIN,
  WHITELIST_CIDR_IP,
} = process.env;

async function getParameters() {
  const isNewStack = await rc.cloudformation.stackExists(CF_DB_STACKNAME);
  const baseParams = [{
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
    key: 'Environment',
    value: ENVIRONMENT,
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

  if (isNewStack) {
    return baseParams;
  }
}

(async function deploy() {
  try {
    await rc.cloudformation.cloudForm({
      stackName: CF_DB_STACKNAME,
      templatePath: `${__dirname}/cf.mongodb.yml`,
      options: {
        parameters: getParameters(),
      },
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
