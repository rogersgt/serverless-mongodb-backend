'use strict';
import 'babel-polyfill';
import mongoose from 'mongoose';
import { handleEventBody, objToSchema } from './tools/shapers';
import logger from './logger';
import post from './methods/post';
import Factory from './models/factory';
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
      mongoose.disconnect();
      return 1; // end function
    }

    const body = handleEventBody(event);

    const docSchema = objToSchema(body);
    const factory = new Factory(docSchema, collectionName);
    const Mod = factory.create();
    const doc = new Mod(body);

    switch(event.requestContext.httpMethod.toLowerCase()) {
      case 'post':
        await post(doc);
        break;
      default:
        logger.log('not post');
        break;
    }

    await mongoose.disconnect();
  } catch (error) {
    logger.error(error);
    mongoose.disconnect();
    callback(error);
  }
}
