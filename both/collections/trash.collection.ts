import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';

export const Trash = new MongoObservable.Collection<any>("trash");
