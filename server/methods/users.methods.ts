import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base';
import { Users } from '../../both/collections/users.collection';
import { isLoggedIn, userIsInRole } from "../imports/services/auth";

Meteor.methods({
    "users.insert": (userData: {email: string, passwd: string, profile?: any}): string => {
        let userDetails = {
            email: userData.email,
            password: userData.passwd,
            profile: userData.profile
        };
        let userId = Accounts.createUser(userDetails);
        if (userId)
        {
          Meteor.setTimeout(function () {
            Accounts.sendVerificationEmail(userId);
          }, 500);
        }
        return userId;
    },
    "users.resendVerificationEmail": (email: string) => {
      let user = Meteor.users.findOne({"emails.address": email});
      if (! user || !user._id) {
        throw new Meteor.Error(403, "No matching records found with your email.");
      }

      if (user.emails[0].verified === true) {
        throw new Meteor.Error(403, "Your account is already verified. Please login to continue.");
      }

      Meteor.setTimeout(function () {
        Accounts.sendVerificationEmail(user._id);
      }, 500);
    },
    "users.update": (userData: {"profile" : any }, email: {oldAddress?: string, newAddress?: string}={}): any => {
      userIsInRole(["customer"]);

      let userId = Meteor.userId();

      if (email.oldAddress != email.newAddress) {
        try {
          let success = Meteor.users.update({ _id: userId, 'emails.address': email.oldAddress },
           { $set: { 'emails.$.address': email.newAddress }});
           if (! success) {
             throw new Meteor.Error(500, "Error while updating email address.");
           }
         } catch (e) {
           switch(e.code) {
             case 11000:
              throw new Meteor.Error(500, "Duplicate email submitted. Please supply unique email address.");
             default:
              throw new Meteor.Error(500, "Error while updating email address.");
           }
         }
      }

      let retVal = Meteor.users.update({
        _id: userId
      }, {
        $set: userData
      });

      Meteor.setTimeout(() => {
        Meteor.call("bookings.updateUser", userId);
      }, 0);

      return retVal;
    },
    "users.findByPasswdToken": (token: string): any => {
      let userDetail = Meteor.users.findOne({"services.password.reset.token": token});
      if (userDetail && userDetail._id) {
        return userDetail._id;
      } else {
        return null;
      }
    },
    "users.verifyEmailToken": (token: string): any => {
      let userDetail = Meteor.users.findOne({"services.email.verificationTokens.token": token});
      if (!userDetail || !userDetail._id) {
        return null;
      }
      let userId = userDetail._id;

      // find email address
      let verificationTokens = userDetail.services.email.verificationTokens;
      let emailAddress = null;
      for (let i=0; i<verificationTokens.length; i++) {
        if (verificationTokens[i] ["token"] == token) {
          emailAddress = verificationTokens[i] ["address"];
        }
      }
      // set email verified
      let emails = userDetail.emails;
      for (let i=0; i<emails.length; i++) {
        if (emails[i] ["address"] == emailAddress) {
          emails[i] ["verified"] = true;
        }
      }
      // update emails array in user collection
      Meteor.users.update({_id: userId}, {$set: {emails: emails} });
      return userId;
    },
    "users.resetPasswd": (token: string, newPasswd: string):any => {
        let userId = Meteor.call("users.findByPasswdToken", token);
        if (! userId.length) {
          return false;
        } else {
          return Accounts.setPassword(userId, newPasswd);
        }
    },
    /* find logged-in user */
    "users.findOne": () => {
      userIsInRole(["customer"]);

      let userId = Meteor.userId();
      return Meteor.users.findOne({ _id: userId });
    },
})
