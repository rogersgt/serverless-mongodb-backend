import mongoose from 'mongoose';

export default function(collection, pathParams) {
  if (!pathParams || !pathParams.id) {
    throw new Error('No "id" provided. Cannot delete a doc without the unique identifier.')
  }

  return mongoose.connection.db.collection(collection).findOneAndDelete({ _id: pathParams.id });
}
