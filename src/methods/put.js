import mongoose from 'mongoose';

export default function(collection, doc) {
  const { _id } = doc;
  if (!_id) {
    throw new Error('No "_id" field in request body. Cannot update a document without the unique identifier.')
  }
  const updateDoc = doc;
  delete updateDoc._id;

  return mongoose.connection.db
  .collection(collection)
  .findOneAndUpdate({ _id: _id }, {
    $set: updateDoc,
  });
}