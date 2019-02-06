import uuid from 'uuid/v1';
import Factory from '../models/factory';

const factory = new Factory({ _id: String }, 'default');
const defaultModel = factory.create();

export default function post(doc=new defaultModel()) {
  if (!doc._id) {
    doc._id = uuid();
  }
  return doc.save();
}
