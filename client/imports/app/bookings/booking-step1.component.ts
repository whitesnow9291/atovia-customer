import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators as Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { HTTP } from "meteor/http";
import { InjectUser } from "angular2-meteor-accounts-ui";
import { MeteorComponent } from 'angular2-meteor';
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { Title } from '@angular/platform-browser';
import { validateEmail, validatePhoneNum, validateFirstName, validatePassportNum } from "../../validators/common";
import { Booking } from "../../../../both/models/booking.model";
import { Place } from "../../../../both/models/place.model";
import { Tour } from "../../../../both/models/tour.model";
import { User } from "../../../../both/models/user.model";
import { showAlert } from "../shared/show-alert";
import template from './booking-step1.html';
import * as _ from 'underscore';

@Component({
  selector: '',
  template
})
@InjectUser('user')
export class BookingStep1Component extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy  {
  bookingForm: FormGroup;
  cardForm: FormGroup;
  booking: Booking;
  isProcessing: boolean = false;
  cardError: string = null;
  hideCardForm: boolean = true;
  countries: Place[] = [];
  tour: Tour = null;
  user: User;

  constructor(private router: Router,
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private sessionStorage: SessionStorageService,
    private titleService: Title,
    private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Booking Step1 | Atorvia");
    this.booking = <Booking>this.sessionStorage.retrieve("bookingDetails");
    if (! this.booking) {
      this.zone.run(() => {
        this.router.navigate(['/tours/search']);
      });
      return;
    }

    this.bookingForm = this.formBuilder.group({
      travellers: this.formBuilder.array([
      ])
    });

    this.cardForm = this.formBuilder.group({
      nameOnCard: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])],
      cardNumber: ['', Validators.compose([Validators.required, CValidators.creditCard, Validators.minLength(12), Validators.maxLength(19)])],
      expiryMonth: ['', Validators.compose([Validators.required])],
      expiryYear: ['', Validators.compose([Validators.required])],
      cvvNumber:  ['', Validators.compose([Validators.required, Validators.minLength(3), Validators.maxLength(4)])],
      cardType: ['']
    });

    this.call("places.findCountries", (err, res) => {
      if (err) {
        console.log(err.reason);
        return;
      }
      this.countries = res;
    });

    this.call("tours.findOne", {_id: this.booking.tour.id}, {with: {owner: true}}, (err, res) => {
      this.tour = <Tour>res.tour;
    });

    this.call("users.findOne", (err, res) => {
      if (err) {
        return;
      }
      //console.log("users.findOne():", res);
      this.user = res;
      this.loadTravellers();
    });
  }

  ngAfterViewChecked() {
  }

  ngAfterViewInit() {
    Meteor.setTimeout(() => {
      jQuery(function($){
        var leftImage = $(".tour-details").parent().height();
        var rightImage = $(".fee-summary").parent().height();

        $(".tour-details").css("height", rightImage +"px");
      });
    }, 500);
  }

  ngOnDestroy() {
  }

  detectChanges() {
    this.changeDetectorRef.detectChanges();
  }

  get bookingDetails() {
    if (! this.booking) {
      return null;
    }

    let travellers = this.bookingForm.value.travellers;
    travellers.map((item) => {
      if (typeof item["passport.number"] !== "undefined") {
        let passportNum = item["passport.number"];
        let passportCountry = item["passport.country"];
        delete item["passport.number"];
        delete item["passport.country"];

        item.passport = {
          number: passportNum,
          country: passportCountry
        };
      }
    })

    let booking = this.booking;
    booking.travellers = travellers;
    return booking;
  }

  private loadTravellers() {
    let booking = this.booking;
    let numOfTravellers = <number>booking.numOfTravellers;
    for(let i=0; i<numOfTravellers; i++) {
      this.addTraveller(i);
    }
  }

  private initTraveller(i) {
    let travellers = this.booking.travellers;
    if (typeof travellers[i] == "undefined") {
      let firstName = null;
      let middleName = null;
      let lastName = null;
      let email = null;
      let contact = null;

      if (i == 0 && !! Meteor.user()) {
        let user = this.user;
        firstName = user.profile.firstName;
        middleName = user.profile.middleName;
        lastName = user.profile.lastName;
        email = user.emails[0].address;
        contact = user.profile.contact;
      }

      travellers[i] = <any>{
        firstName,
        middleName,
        lastName,
        email,
        contact
      };
    }

    if (typeof travellers[i] ["passport"] == "undefined") {
      travellers[i] ["passport"] = {
        number: null,
        country: null
      };
    }
    let formFields = {
      firstName: [travellers[i].firstName, Validators.compose([Validators.required, validateFirstName, Validators.minLength(2), Validators.maxLength(30)])],
      middleName: [travellers[i].middleName, Validators.compose([validateFirstName, Validators.minLength(2), Validators.maxLength(30)])],
      lastName: [travellers[i].lastName, Validators.compose([Validators.required, validateFirstName, Validators.minLength(2), Validators.maxLength(30)])],
    }

    if (this.bookingDetails.tour.hasFlight) {
      formFields["passport.country"] = [travellers[i].passport.country, Validators.compose([Validators.required])];
      formFields["passport.number"] = [travellers[i].passport.number, Validators.compose([Validators.required, Validators.minLength(7), Validators.maxLength(15)])];
    }

    if (i==0) {
      formFields['email'] = [travellers[i].email, Validators.compose([Validators.required, validateEmail, Validators.minLength(5), Validators.maxLength(50)])];
      formFields['contact'] = [travellers[i].contact, Validators.compose([Validators.required, Validators.minLength(7), Validators.maxLength(15)])];
      formFields['addressLine1'] = [travellers[i].addressLine1, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(50)])];
      formFields['addressLine2'] = [travellers[i].addressLine2, Validators.compose([Validators.minLength(2), Validators.maxLength(50)])];
      formFields['suburb'] = [travellers[i].state, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30)])];
      formFields['postCode'] = [travellers[i].postCode, Validators.compose([Validators.required, Validators.minLength(4), Validators.maxLength(12)])];
      formFields['state'] = [travellers[i].state, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30)])];
      formFields['country'] = [travellers[i].country, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30)])];
      formFields['specialRequest'] = [travellers[i].specialRequest, Validators.compose([])];
    } else {
      formFields['email'] = [travellers[i].email, Validators.compose([validateEmail, Validators.minLength(5), Validators.maxLength(50)])];
      formFields['contact'] = [travellers[i].contact, Validators.compose([Validators.minLength(7), Validators.maxLength(15)])];
    }
    return this.formBuilder.group(formFields);
  }

  private addTraveller(i) {
    const control = <FormArray>this.bookingForm.controls['travellers'];
    control.push(this.initTraveller(i));
  }

  resetStateValue(country) {
    if (country == "AU") {
      this.bookingForm.controls['travellers'] ["controls"] [0].controls["state"].setValue(null);
    }
  }

  setCardType(number) {
      let cardType = null;

      var re = new RegExp("^4");
      if (number.match(re) != null) {
       cardType = "visa";
      }

      // Mastercard
      re = new RegExp("^5[1-5]");
      if (number.match(re) != null) {
       cardType = "mastercard";
      }

      // AMEX
      re = new RegExp("^3[47]");
      if (number.match(re) != null) {
       cardType = "amex";
      }

      // Discover
      re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
      if (number.match(re) != null) {
       cardType = "discover";
      }

      this.cardForm.controls['cardType'].setValue(cardType);
  }

  validateCard() {
    let cardNumber = this.cardForm.value.cardNumber;
    let expiryMonth = this.cardForm.value.expiryMonth;
    let expiryYear = this.cardForm.value.expiryYear;
    let cvv = this.cardForm.value.cvvNumber;
    let today = new Date();
    let expiryDate = new Date(`${expiryMonth}-01-${expiryYear}`)

    this.cardError = null;

    var cardno = /^([0-9]{12,19})$/;
    if(! cardNumber.match(cardno))
    {
      this.cardError = "Invalid card number.";
      return false;
    }

    if (today > expiryDate) {
      this.cardError = "Invalid expiry date.";
      return false;
    }

    let month = /^([0-9]{2})$/;
    if (! expiryMonth.match(month)) {
      this.cardError = "Invalid expiry month.";
      return false;
    }

    let year = /^([0-9]{4})$/;
    if (! expiryYear.match(year)) {
      this.cardError = "Invalid expiry year.";
      return false;
    }

    let cvvNum = /^([0-9]{3,4})$/;
    if (! cvv.match(cvvNum)) {
      this.cardError = "Invalid CVV number.";
      return false;
    }

    return true;
  }

  doCardPayment() {
    if (! this.bookingForm.valid || ! this.cardForm.valid) {
      showAlert("Invalid FormData supplied.", "danger");
      return;
    }

    if (this.isProcessing === true) {
      showAlert("Your previous request is under processing. Please wait for a while.", "info");
      return;
    }

    if (! this.validateCard()) {
      showAlert("Invalid card details", "danger");
      return;
    }

    this.isProcessing = true;
    this.doBooking((booking) => {
      this.processCardPayment(booking);
    });
  }

  doPaypalPayment() {
    if (! this.bookingForm.valid ) {
      showAlert("Invalid FormData supplied.", "danger");
      return;
    }

    if (this.isProcessing === true) {
      showAlert("Your previous request is under processing. Please wait for a while.", "info");
      return;
    }

    this.isProcessing = true;
    this.doBooking((booking) => {
      this.processPaypalPayment(booking);
    });
  }

  doBooking(callback) {
    let booking = this.bookingDetails;

    this.call("bookings.insert", booking, (err, res) => {
      if (err) {
        this.isProcessing = false;
        showAlert(err.reason, "danger");
        return;
      }
      booking._id = res;
      booking.user = <any>{
        id: Meteor.userId()
      }
      this.sessionStorage.store("bookingId", res);
      this.sessionStorage.clear("bookingDetails");
      callback(booking);
    });

  }

  processCardPayment(booking) {
    let cardDetails: any = {
      nameOnCard: this.cardForm.value.nameOnCard,
      cardNumber: this.cardForm.value.cardNumber,
      expiryMonth: this.cardForm.value.expiryMonth,
      expiryYear: this.cardForm.value.expiryYear,
      cvvNumber: this.cardForm.value.cvvNumber,
      cardType: this.cardForm.value.cardType
    }
    let res = cardDetails.nameOnCard.split(" ");
    cardDetails.firstName = res[0];
    if ( res[1] ) {
      cardDetails.lastName = res[1];
    } else {
      cardDetails.lastName = res[0];
    }

    HTTP.call("POST", "/api/1.0/paypal/card-payment/create", {
      data: {
        cardDetails: cardDetails,
        booking: booking
      }
    }, (error, result) => {
      this.isProcessing = false;
      console.log(result);
      let response = JSON.parse(result.content);
      if (! response.success) {
        showAlert("Payment processing failed at server. Please recheck your details and try again.", "danger");
        return;
      } else {
        this.zone.run(() => {
          showAlert("Thank you for booking your trip with us. You will receive confirmation email very soon.", "success")
          this.router.navigate(['/booking/confirm']);
        });
      }
    });

  }

  processPaypalPayment(booking) {
    HTTP.call("POST", "/api/1.0/paypal/payment/create", {
      data: {
        booking: booking
      }
    }, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        let response = JSON.parse(result.content);

        // check whether redirect url exists in response.
        if (! response.links || ! response.links.length) {
          this.isProcessing = false;
          showAlert("Error while initialization of payment request. Please try again after rechecking the details.");
          return;
        }

        // redirect to paypal website to complete payment
        alert("You are now being redirected to PayPal to complete the payment.")
        let approvalUrl = <any>_.find(response.links, {rel: "approval_url"});
        window.location.href = approvalUrl.href;
      }
    })
  }

  goToStep2() {
    if (! this.bookingForm.valid) {
      showAlert("Invalid FormData supplied.", "danger");
      return;
    }

    this.isProcessing = true;
    this.doBooking((booking) => {
      this.isProcessing = false;
      this.zone.run(() => {
        this.router.navigate(['/booking/step2']);
      });
    });
  }
}
