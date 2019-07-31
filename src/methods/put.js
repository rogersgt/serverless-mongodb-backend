import mongoose from 'mongoose';

export default function(collection, doc, pathParams) {
  const idToUpdate = pathParams.id || doc._id;

  if (!idToUpdate) {
    throw new Error('No "_id" field in request body. Cannot update a document without the unique identifier.')
  }

  const update = doc;
  delete update._id;

  return mongoose.connection.db
  .collection(collection)
  .findOneAndUpdate({ _id: idToUpdate }, {
    $set: update,
  }, {
    new: true,
  });
}