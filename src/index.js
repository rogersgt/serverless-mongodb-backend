/* eslint-disable require-atomic-updates */
'use strict';
import 'babel-polyfill';
import './env';
import mongoose from 'mongoose';
import { handleEventBody } from './tools/shapers';
import del from './methods/delete';
import post from './methods/post';
import put from './methods/put';
import get from './methods/get';
import logger from './logger';
import badRequest from './responses/badRequest';
import success from './responses/success';

// keep CONN in global namespace for a warm connection
let CONN = null;

const {
  API_USERNAME,
  API_PASSWORD,
  DB_NAME = 'db',
  DB_HOST = '127.0.0.1',
} = process.env;

export async function crud (event, context, callback) {
  try {
    if (!API_USERNAME || !API_PASSWORD) {
      throw new Error('Missing MongoDB Credentials');
    }

    const MONGO_URI = `mongodb://${API_USERNAME}:${API_PASSWORD}@${DB_HOST}:27017/${DB_NAME}?authSource=admin`;

    context.callbackWaitsForEmptyEventLoop = false;
    if (!CONN) {
      CONN = await mongoose.connect(MONGO_URI, {
        bufferMaxEntries: 0,
        bufferCommands: false
      });
    }

    const collectionName = event.path.replace('/', '');
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
