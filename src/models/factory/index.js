'use strict';
import 'babel-polyfill';
import { model, Schema } from 'mongoose';

export default class Factory {
  constructor(schema={}, name) {
    this.schema = new Schema(schema);
    this.name = name;
  }

  create() {
    return model(this.name, this.schema, this.name);
  }
}