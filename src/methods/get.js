import mongoose from 'mongoose';

export default async function(collection, query={}, pathParams) {
  console.log(pathParams)
  const { id } = pathParams;
  if (id) {
    return mongoose.connection.collection(collection).findOne({ _id: id });
  }

  const data = await mongoose.connection.collection(collection).find(query);
  return data;
}
