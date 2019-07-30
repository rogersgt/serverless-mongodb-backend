/* eslint-disable require-atomic-updates */
'use strict';
import 'babel-polyfill';
import ssmParams from 'aws-param-env';
import mongoose from 'mongoose';
import del from './methods/delete';
import post from './methods/post';
import put from './methods/put';
import get from './methods/get';
import logger from './logger';
import badRequest from './responses/badRequest';
import success from './responses/success';
import { handleEventBody } from './tools/shapers';

// keep CONN in global namespace for a warm connection
let CONN = null;

export async function crud (event, context, callback) {
  const { PARAM_PATH = '/' } = process.env;
  ssmParams.load(PARAM_PATH);

  const {
    API_USERNAME,
    API_PASSWORD,
    DB_NAME = 'db',
    DB_HOST = '127.0.0.1',
  } = process.env;

  try {
    const credsStr = (!!API_USERNAME && !! API_PASSWORD) ?  `${API_USERNAME}:${API_PASSWORD}@` : '';
    const MONGO_URI = `mongodb://${credsStr}${DB_HOST}:27017/${DB_NAME}?authSource=admin`;

    if (!CONN) {
      CONN = await mongoose.connect(MONGO_URI, {
        bufferMaxEntries: 0,
        bufferCommands: false
      });
    }

    const collectionName = event.pathParameters.doc;
    if (!collectionName) {
      callback(null, badRequest());
      await mongoose.disconnect();
      return 1; // end function
    }

    const body = handleEventBody(event);
    const requestMethod = event.requestContext.httpMethod.toLowerCase();
    let methodResp;

    switch(requestMethod) {
      case 'delete': methodResp = await del(collectionName, event.pathParameters);
        break;
      case 'get': methodResp = await get(collectionName, event.pathParameters);
        break;
      case 'post': methodResp = await post(collectionName, body);
        break;
      case 'put': methodResp = await put(collectionName, body);
        break;
      default:
        mongoose.disconnect();
        callback(null, badRequest());
        return 1; // end function
    }

    await mongoose.disconnect();
    callback(null, success(methodResp));
  } catch (error) {
    logger.error(error);
    mongoose.disconnect();
    callback(error);
  }
}
