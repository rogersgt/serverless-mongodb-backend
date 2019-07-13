import ssmParams from 'aws-param-env';

const { PARAM_PATH } = process.env;

ssmParams.load(PARAM_PATH);
