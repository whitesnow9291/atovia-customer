import { Meteor } from "meteor/meteor";
import { HTTP } from 'meteor/http'
//import * as bodyParser from "body-parser";
var bodyParser = require('body-parser');
//import * as paypal from "paypal-rest-sdk";
var paypal = require('paypal-rest-sdk');

import { Transactions } from "../../../both/collections/transactions.collection";
import { Bookings } from "../../../both/collections/bookings.collection";

// configue paypal sdk
let paypalMode = Meteor.settings.public["paypal"] ["mode"];
let clientId = Meteor.settings.public["paypal"] ["clientId"];
let clientSecret = Meteor.settings.public["paypal"] ["clientSecret"];
paypal.configure({
  'mode': paypalMode, //sandbox or live
  'client_id': clientId,
  'client_secret': clientSecret
});

declare var Picker: any;
let rootUrl = process.env.ROOT_URL;

// Define our middleware using the Picker.middleware() method.
Picker.middleware( bodyParser.json() );
Picker.middleware( bodyParser.urlencoded( { extended: false } ) );

Picker.route( '/api/1.0/paypal/token/create', function( params, request, response, next ) {
  let result = HTTP.call("POST", "https://api.sandbox.paypal.com/v1/oauth2/token", {
    "auth": "AeNIxZgtK5ybDTEbj8kOwsC-apBuG6fs_eRgtyIq4qS5SzDOtTsBla2FIl3StvVhJHltFFf-RBSAyp7c:EJkxMwNb1sfofwhXEgDf-epl-3qDmrwDIdRGoL0SD6iMJsFk4jn5r3ZDpAnvg7LRE5Xjcre-zlRvTHiA",
    "headers": ["Accept: application/json", "Accept-Language: en_US"],
    "content": "grant_type=client_credentials"
  });

  response.end( JSON.stringify(result.data) );
});

Picker.route( '/api/1.0/paypal/payment/create', function( params, request, response, next ) {
  let body = request.body;
  let booking = body.booking;
  if (typeof booking == "undefined" || typeof booking.tour == "undefined") {
    console.log("Invalid booking data supplied.");
    response.end( JSON.stringify({status: false}) );
    return;
  }

  let create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": `${rootUrl}/api/1.0/paypal/payment/execute`,
        "cancel_url": `${rootUrl}/tours/search`
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": booking.tour.name,
                "sku": booking.tour.id,
                "price": booking.totalPriceDefault,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
          "total": booking.totalPriceDefault,
          "currency": "USD",
          "details": {
            "subtotal": booking.totalPriceDefault
          }
        },
        "description": "The payment transaction description.",
        "custom": "",
        "invoice_number": booking.uniqueId,
        "payment_options": {
        "allowed_payment_method": "INSTANT_FUNDING_SOURCE"
        },
        "soft_descriptor": "",
    }]
  };

  paypal.payment.create(create_payment_json, Meteor.wrapAsync( (error, payment) => {
      if (error) {
          //console.log(error.response);
          response.end( JSON.stringify(error) );
      } else {
          console.log("Get Payment Create");

          // insert transaction in mongodb
          payment.relatedInfo = {
            gateway: "paypal",
            method: "express_checkout",
            purpose: "booking",
            bookingId: booking._id,
            userId: booking.user.id
          };
          payment.createdAt = new Date();
          var transactionId = Transactions.collection.insert(payment);
          console.log("new transactionId:", transactionId);
          // update booking collection
          Bookings.collection.update({_id: booking._id}, {$set: {
            paymentInfo: {
              gateway: "paypal",
              method: "express_checkout",
              transactionId,
              gatewayTransId: payment.id,
              "status": payment.state
            }
          } });

          response.end( JSON.stringify(payment) );
      }
  }) );
});

Picker.route( '/api/1.0/paypal/payment/execute/', function( params, request, response, next ) {
  let body = request.body;
  let args = params.query;
  let transaction = <any>Transactions.collection.findOne({"id": args.paymentId});

  let execute_payment_json = {
      "payer_id": args.PayerID
  };

  if (typeof transaction !== "undefined") {
    execute_payment_json["transactions"] = transaction.transactions;
  }

  paypal.payment.execute(args.paymentId, execute_payment_json, Meteor.wrapAsync( (error, payment) => {
      let html = null;
      html = `<html>
          <head>
              <title>Payment Failed</title>
              <meta http-equiv="refresh" content="3;url=${rootUrl}/booking/step2" >
              <style type="text/css">
              .loader {
                  position: absolute;
                  top: 40%;
                  left: 43%;
                  border: 16px solid #f3f3f3; /* Light grey */
                  border-top: 16px solid #3498db; /* Blue */
                  border-radius: 50%;
                  width: 120px;
                  height: 120px;
                  animation: spin 2s linear infinite;
              }

              @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
              }
              </style>
          </head>
          <body>
            <div class="loader"></div>
            <div style="position: absolute;left: 32%;top: 70%; text-align: center;">
            <p><b>Payment Failed</b>. Please contact customer support for further details.</p>
            <p>Please wait, you are being redirected to main application.</p>
            <p><a href="${rootUrl}/booking/step2">Click here</a>, If you are not redirected automatically.</p>
            </div>
          </body>
      </html>`;

      if (error) {
          //console.log(error.response);
          let bookingId = transaction.relatedInfo.bookingId;
          Meteor.setTimeout(() => {
            Meteor.call("bookings.paymentFailedConfirmation", bookingId);
          }, 0);
      } else {
          console.log("Get Payment Response");

          // mongodb update transaction
          if (payment.state == "approved") {
            // update transaction object
            payment.modifiedAt = new Date();

            let res = Transactions.collection.update({_id: transaction._id}, {$set: payment});
            console.log("transaction update: ", res);
            // update booking object
            // update booking collection
            let saleId = undefined;
            try {
              if (payment.transactions.length > 0 && payment.transactions[0].related_resources.length > 0) {
                saleId = payment.transactions[0].related_resources[0].sale.id;
              }
            } catch(e) {
              saleId = null;
            }
            let bookingId = transaction.relatedInfo.bookingId;
            Bookings.collection.update({_id: bookingId}, {$set: {
              "paymentInfo.status": payment.state,
              "paymentInfo.saleId": saleId,
              paymentDate: new Date()
            } });

            Meteor.setTimeout(() => {
              Meteor.call("bookings.paymentConfirmation", bookingId);
            }, 0);

            html = `<html>
                <head>
                    <title>Payment Successful</title>
                    <meta http-equiv="refresh" content="3;url=${rootUrl}/booking/confirm" >
                    <style type="text/css">
                    .loader {
                        position: absolute;
                        top: 40%;
                        left: 43%;
                        border: 16px solid #f3f3f3; /* Light grey */
                        border-top: 16px solid #3498db; /* Blue */
                        border-radius: 50%;
                        width: 120px;
                        height: 120px;
                        animation: spin 2s linear infinite;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    </style>
                </head>
                <body>
                  <div class="loader"></div>
                  <div style="position: absolute;left: 32%;top: 70%; text-align: center;">
                  <p><b>Payment Successful</b>. Please wait, you are being redirected to main application.</p>
                  <p><a href="${rootUrl}/booking/confirm">Click here</a>, If you are not redirected automatically.</p>
                  </div>
                </body>
            </html>`;
          } else {
            let bookingId = transaction.relatedInfo.bookingId;
            Meteor.setTimeout(() => {
              Meteor.call("bookings.paymentFailedConfirmation", bookingId);
            }, 0);
          }
          //console.log(JSON.stringify(payment));
          //response.end( JSON.stringify(payment) );
      }

      response.end( html );
  }) );
});

Picker.route( '/api/1.0/paypal/payment/get/', function( params, request, response, next ) {
  let body = request.body;
  let args = params.query;

  paypal.payment.get(args.paymentId, function (error, payment) {
      if (error) {
          //console.log(error);
          response.end( JSON.stringify(error) );
      } else {
          console.log("Get Payment Response");
          response.end( JSON.stringify(payment) );
      }
  });
});

Picker.route('/api/1.0/paypal/card-payment/create', function( params, request, response, next ) {
  let body = request.body;
  let cardDetails = body.cardDetails;
  let booking = body.booking;
  let totalPrice = booking.totalPriceDefault;
  let address = booking.travellers[0];

  var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "credit_card",
            "funding_instruments": [{
                "credit_card": {
                    "type": cardDetails.cardType,
                    "number": cardDetails.cardNumber,
                    "expire_month": cardDetails.expiryMonth,
                    "expire_year": cardDetails.expiryYear,
                    "cvv2": cardDetails.cvvNumber,
                    "first_name": cardDetails.firstName,
                    "last_name": cardDetails.lastName,
                    "billing_address": {
                        "line1": address.addressLine1,
                        "city": address.suburb,
                        "state": address.state,
                        "postal_code": address.postCode,
                        "country_code": address.country
                    }
                }
            }]
        },
        "transactions": [{
            "amount": {
                "total": totalPrice,
                "currency": "USD"
            },
            "description": "This is the payment transaction description."
        }]
    };

  paypal.payment.create(create_payment_json, Meteor.wrapAsync( (error, payment) => {
      if (error) {
          Meteor.setTimeout(() => {
            Meteor.call("bookings.paymentFailedConfirmation", booking._id);
          }, 0);
          response.end( JSON.stringify({success: false}) );
      } else {
          // insert transaction in mongodb
          payment.relatedInfo = {
            gateway: "paypal",
            method: "credit_card",
            purpose: "booking",
            bookingId: booking._id,
            userId: booking.user.id
          }
          payment.createdAt = new Date();
          var transactionId = Transactions.collection.insert(payment);
          console.log("new transactionId:", transactionId);

          let saleId = undefined;
          try {
            if (payment.transactions.length > 0 && payment.transactions[0].related_resources.length > 0) {
              saleId = payment.transactions[0].related_resources[0].sale.id;
            }
          } catch(e) {
            saleId = null;
          }

          Bookings.collection.update({_id: booking._id}, {$set: {
            paymentInfo: {
              gateway: "paypal",
              method: "credit_card",
              transactionId,
              gatewayTransId: payment.id,
              "status": payment.state,
              "saleId": saleId
            },
            paymentDate: new Date()
          } });

          Meteor.setTimeout(() => {
            if (payment.state == "approved") {
              Meteor.call("bookings.paymentConfirmation", booking._id);
            } else {
              Meteor.call("bookings.paymentFailedConfirmation", booking._id);
            }
          }, 0);

          response.end( JSON.stringify({success: true}) );
      }
  }) );
})
