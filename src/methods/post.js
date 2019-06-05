import mongoose from 'mongoose';
import uuid from 'uuid/v4';

export default function(collection, doc) {
  if (!doc._id) {
    doc._id = uuid();
  }
  return mongoose.connection.db.collection(collection).save(doc);
}
