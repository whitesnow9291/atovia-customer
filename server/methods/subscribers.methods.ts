import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { check } from "meteor/check";
import { Subscribers } from "../../both/collections/subscribers.collection";
import { Subscriber } from "../../both/models/subscriber.model";


Meteor.methods({
  "subscribers.insert": (email, group) : void => {
    // check old record
    let item = Subscribers.collection.findOne({email, group});
    if (item && item.email == email) {
      throw new Meteor.Error(403, "You have already subscribed.");
    }

    // insert new record
    let createdAt = new Date;
    let dataToInsert = {
      email,
      group,
      createdAt
    };

    Subscribers.collection.insert(dataToInsert);
  }
});
