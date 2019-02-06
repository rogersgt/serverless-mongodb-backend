'use strict';
import 'babel-polyfill';
import { Schema, model  } from 'mongoose';

const collectionSchema = new Schema({
  _id: { type: String },
  createdAt: { type: String, default: new Date().getTime().toString() },
  documentSchema: [Schema.Types.Mixed],
  name: { type: String }
});

export default model('Collection', collectionSchema, 'Collection')
