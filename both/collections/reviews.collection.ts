import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { Review } from "../models/review.model";

export const Reviews = new MongoObservable.Collection<Review>("reviews");
