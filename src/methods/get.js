import mongoose from 'mongoose';

export default async function(collection, pathParams) {
  if (!pathParams) {
    return mongoose.connection.db.collection(collection).find();
  }
  const { id } = pathParams;
  const data = await mongoose.connection.collection(collection).findOne({})
  console.log(data);
  return data;
}
