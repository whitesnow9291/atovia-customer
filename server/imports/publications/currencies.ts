import { Meteor } from 'meteor/meteor';
import { Currencies } from "../../../both/collections/currencies.collection";

Meteor.publish("currencies", function() {
    return Currencies.find(
      {  },
      { fields: {from: 1, to: 1, value: 1} }
    );
});
