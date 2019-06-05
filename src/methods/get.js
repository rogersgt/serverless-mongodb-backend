import mongoose from 'mongoose';

export default function(collection, pathParams) {
  if (!pathParams) {
    return mongoose.connection.db.collection(collection).find();
  }
  const { id } = pathParams;
  return mongoose.connection.collection(collection).findOne({ _id: id });
}
