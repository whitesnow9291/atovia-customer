import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators as Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { HTTP } from "meteor/http";
import { Title } from '@angular/platform-browser';
import { InjectUser } from "angular2-meteor-accounts-ui";
import { MeteorComponent } from 'angular2-meteor';
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { validateEmail, validatePhoneNum, validateFirstName, validatePassportNum } from "../../validators/common";
import { Booking } from "../../../../both/models/booking.model";
import { Tour } from "../../../../both/models/tour.model";
import { showAlert } from "../shared/show-alert";
import template from './booking-step2.html';
import * as _ from 'underscore';

@Component({
  selector: '',
  template
})
@InjectUser('user')
export class BookingStep2Component extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy  {
  cardForm: FormGroup;
  booking: Booking;
  isProcessing: boolean = false;
  cardError: string = null;
  tour: Tour = null;

  constructor(private router: Router,
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private titleService: Title,
    private sessionStorage: SessionStorageService,
    private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Booking Step2 | Atorvia");
    let bookingId = this.sessionStorage.retrieve("bookingId");
    this.call("bookings.findOne", {_id: bookingId}, {with: {tour: true}}, (err, result) => {
      if (err) {
        showAlert(err.reason, "danger");
        return;
      }
      this.booking = <Booking>result.booking;
      this.tour = <Tour>result.tour;
    })

    this.cardForm = this.formBuilder.group({
      nameOnCard: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])],
      cardNumber: ['', Validators.compose([Validators.required, CValidators.creditCard, Validators.minLength(12), Validators.maxLength(19)])],
      expiryMonth: ['', Validators.compose([Validators.required])],
      expiryYear: ['', Validators.compose([Validators.required])],
      cvvNumber:  ['', Validators.compose([Validators.required, Validators.minLength(3), Validators.maxLength(4)])],
      cardType: ['']
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
    let booking = this.booking;
    return booking;
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
    if (! this.cardForm.valid) {
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
    this.processCardPayment();
  }

  doPaypalPayment() {
    if (this.isProcessing === true) {
      showAlert("Your previous request is under processing. Please wait for a while.", "info");
      return;
    }

    this.isProcessing = true;
    this.processPaypalPayment();
  }

  processCardPayment() {
    let booking = this.bookingDetails;
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

  processPaypalPayment() {
    let booking = this.bookingDetails;

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
        alert("Payment initialization has been done. You will be redirected now to complete the payment.")
        let approvalUrl = <any>_.find(response.links, {rel: "approval_url"});
        window.location.href = approvalUrl.href;
      }
    })
  }
}
