import Factory from '../models/factory';

/* reference a default mongoose model for intellisense */
const factory = new Factory({ _id: String }, 'default');
const defaultModel = factory.create();

export default function get(doc=defaultModel) {
  const { _id } = doc;
  return doc.findOne({ _id });
}
