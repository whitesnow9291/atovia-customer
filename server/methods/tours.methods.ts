import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { check } from "meteor/check";
import { Tours } from "../../both/collections/tours.collection";
import { Bookings } from "../../both/collections/bookings.collection";
import { Tour } from "../../both/models/tour.model";
import { Review } from "../../both/models/review.model";
import { Reviews } from "../../both/collections/reviews.collection";
import { isLoggedIn, userIsInRole } from "../imports/services/auth";
import * as _ from 'underscore';

interface Options {
  [key: string]: any;
}

Meteor.methods({
    "tours.find": (options: Options, criteria: any, searchString: string) => {
        let where:any = [];
        let userId = Meteor.userId();
        where.push({
            "$or": [{deleted: false}, {deleted: {$exists: false} }]
        }, {
          "$or": [{active: true}, {active: {$exists: false} }]
        }, {
          "$or": [{approved: true}, {approved: {$exists: false} }]
        }, {
          "$or": [{"dateRange.startDate": {$gte: new Date()} }]
        });

        if (!_.isEmpty(criteria)) {
          where.push(criteria);
        }

        // match search string
        if (typeof searchString === 'string' && searchString.length) {
            // allow search on firstName, lastName
            where.push({
                "$or": [
                    // { "name": { $regex: `.*${searchString}.*`, $options: 'i' } },
                    // { "departure": { $regex: `.*${searchString}.*`, $options: 'i' } },
                    { "destination": { $regex: `.*${searchString}.*`, $options: 'i' } },
                    // { "tourType": { $regex: `.*${searchString}.*`, $options: 'i' } },
                    // { "tourPace": { $regex: `.*${searchString}.*`, $options: 'i' } },
                    // { "owner.companyName": { $regex: `.*${searchString}.*`, $options: 'i' } }
                ]
            });
        }

        let cursor = Tours.collection.find({$and: where}, options);
        return {count: cursor.count(), data: cursor.fetch()};
    },
    "tours.findOne": (criteria: any, options: {with?: {owner: boolean}} = {} ):any => {
      let where:any = [];
      where.push({
          "$or": [{deleted: false}, {deleted: {$exists: false} }]
      }, {
        "$or": [{active: true}, {active: {$exists: false} }]
      }, {
        "$or": [{approved: true}, {approved: {$exists: false} }]
      });
      if (_.isEmpty(criteria)) {
        criteria = { };
      }
      where.push(criteria);

      let tour = Tours.collection.findOne({$and: where});

      if (typeof options.with == "undefined") {
        return tour;
      }

      if (options.with.owner == true) {
        let owner = Meteor.users.findOne({_id: tour.owner.id}, {fields: {profile: 1} });
        let numOfTours = Tours.collection.find({"owner.id": tour.owner.id, "approved": true, "active": true, "deleted": false}).count();
        owner.profile.numOfTours = numOfTours;

        let avgRating = Tours.collection.aggregate([
          {"$match": {"owner.id": tour.owner.id}},
          {"$group": {
            "_id": "$owner.id",
            "avg_rating": { "$avg": "$rating" }
          }}
        ]);
        owner.profile.avgRating = avgRating[0] ['avg_rating'];
        return {tour, owner};
      }
    },
    "tours.findTopDestinations": (criteria: any = {}, limit: number = 8) => {
      let where:any = [];
      where.push({
          "$or": [{deleted: false}, {deleted: {$exists: false} }]
      }, {
        "$or": [{active: true}, {active: {$exists: false} }]
      }, {
        "$or": [{approved: true}, {approved: {$exists: false} }]
      }, {
        "$or": [{"dateRange.startDate": {$gt: new Date()} }]
      });
      if (_.isEmpty(criteria)) {
        criteria = { };
      }
      where.push(criteria);

      let result = Tours.collection.aggregate([
        {"$match": {$and: where}},
    		{"$group" : {_id: "$destination", count: {$sum: 1}, departure: {"$first": "$departure"}, featuredImage:{"$first": "$featuredImage"}, startPrice: {"$min": "$dateRange.price.adult"} } },
        {"$sort": {"count": -1, "_id": 1}},
        {"$limit": limit}
    	]);

      return result;
    },
    "tours.incrementView": (tourId: string) => {
      return Tours.collection.update({_id: tourId}, {$inc: {noOfViews: 1}});
    },
    "tours.askAQuestion": (mailData: any) => {
      userIsInRole(["customer"]);

      let mailgunKey = Meteor.settings.public["mailgun"] ["key"];
      let mailgunDomain = Meteor.settings.public["mailgun"] ["domain"];
      let mailgun = require('mailgun-js')({apiKey: mailgunKey, domain: mailgunDomain});
      let supplier = Meteor.users.findOne({"_id": mailData.supplierId});
      let user = Meteor.user();
      let sender = `user-${user._id}@${mailgunDomain}`;

      let data = {
        from: sender,
        to: supplier.emails[0].address,
        subject: mailData.subject,
        html: mailData.message
      }

      mailgun.messages().send(data, (err) => {
        if (! err) {
          console.log("done");
          return true;
        } else {
          console.log(err);
          return false;
        }
      })
      return true;
    },
    "tourReviews.find": (options: Options, criteria: any) => {
      userIsInRole(["customer"]);

      let userId = Meteor.userId();
      let where:any = [];
      where.push(
      {
          "$or": [{deleted: false}, {deleted: {$exists: false} }]
      }, {
        "$or": [{approved: true}, {approved: {$exists: false} }]
      });

      if (!_.isEmpty(criteria)) {
        where.push(criteria);
      }

      let cursor = Reviews.collection.find({$and: where}, options);
      return {count: cursor.count(), data: cursor.fetch()};
    }

});
