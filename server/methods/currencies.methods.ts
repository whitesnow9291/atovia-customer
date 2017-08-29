import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { check } from "meteor/check";
import { Email } from 'meteor/email';
import { HTTP } from "meteor/http";
import { Currencies } from "../../both/collections/currencies.collection";

declare var cheerio: any;

Meteor.methods({
  "currencies.syncRates": function () {
    let from = "USD";
    let toArr = [
      'INR',
      'AUD',
      'CAD',
      'EUR',
      'GBP'
    ];

    for(let i=0; i<toArr.length; i++) {
      let to = toArr[i];

      HTTP.call("POST", `https://www.google.com/finance/converter?a=1&from=${from}&to=${to}`, {
        data: {
        }
      }, (error, result) => {
        let cheerio = require("cheerio");
        let $ = cheerio.load(result.content);
        // console.log(result.content);
        let value = Number($('.bld').text().trim().split(" ") [0]);

        let createdAt = new Date();
        Currencies.upsert({
          from,
          to
        }, {
          $set: { value, createdAt }
        });

      })
    }
  },
  "currencies.getCode": function() {
    // console.log(this.connection);
    let iplocation = require('iplocation');
    let ipaddress = this.connection.clientAddress;
    // let ipaddress = '185.86.151.11';
    let Future = require('fibers/future');
    var myFuture = new Future();

    iplocation(ipaddress)
    .then(res => {
      // console.log(res);
      let currencyCode = "USD";

      if (! res.timezone) {
        myFuture.return(currencyCode);
      }

      if (res.timezone.indexOf("Europe") >= 0) {
        currencyCode = "EUR";
      }

      switch ( res.country) {
        case "IN":
          currencyCode = "INR";
          break;
        case "AU":
          currencyCode = "AUD";
          break;
        case "CA":
          currencyCode = "CAD";
          break;
        case "GB" :
          currencyCode = "GBP";
          break;
        }

      myFuture.return(currencyCode);
    });
    return myFuture.wait();
  },
  "currencies.find": () => {
    return Currencies.find().fetch();
  }
})
