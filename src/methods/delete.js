import uuid from 'uuid/v1';
import Factory from '../models/factory';

/* reference a default mongoose model for intellisense */
const factory = new Factory({ _id: String }, 'default');
const defaultModel = factory.create();

export default function remove({ _id }, docName) {
  
}
