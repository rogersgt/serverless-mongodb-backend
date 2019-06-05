import uuid from 'uuid/v1';
import Factory from '../models/factory';

export default function post(payload={}, docName='') {
  if (!payload._id) {
    payload._id = uuid();
  }
  const factory = new Factory({ _id: String }, docName);
  const doc = factory.create();
  return doc.save();
}
