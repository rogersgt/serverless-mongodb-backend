'use strict';
import 'babel-polyfill';
import mongoose from 'mongoose';
import uuid from 'uuid/v4';
import { handleEventBody } from './tools/shapers';
import logger from './logger';
import badRequest from './responses/badRequest';

let CONN = null;
let MONGO_URI = null;

export async function crud (event, context, callback) {
  MONGO_URI = process.env.MONGO_URI;

  context.callbackWaitsForEmptyEventLoop = false;
  if (!CONN) {
    CONN = await mongoose.connect(MONGO_URI, {
      bufferMaxEntries: 0,
      bufferCommands: false
    });
  }

  try {
    const collectionName = event.path.replace('/', '');
    if (!collectionName) {
      callback(null, badRequest());
      await mongoose.disconnect();
      return 1; // end function
    }

    const body = handleEventBody(event);
    if (!body._id) {
      body._id = uuid();
    }
    const requestMethod = event.requestContext.httpMethod.toLowerCase();

    switch(requestMethod) {
      case 'post': await mongoose.connection.db.collection(collectionName).save(body);
        break;
      default: callback(null, badRequest());
        break;
    }

    await mongoose.disconnect();
  } catch (error) {
    logger.error(error);
    mongoose.disconnect();
    callback(error);
  }
}
