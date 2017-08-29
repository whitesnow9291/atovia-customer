import { Component, Input, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, OnChanges, NgZone, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators as Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { Booking } from "../../../../both/models/booking.model";
import { Tour } from "../../../../both/models/tour.model";
import { CurrencyService } from "../../services/currency";
import { showAlert } from "../shared/show-alert";
import template from './booking-form.html';
import * as _ from 'underscore';

interface DateRange {
  _id: string;
  startDate: Date;
  endDate: Date;
  price?: [{
    numOfPersons: number;
    adult: number;
    adultDefault?: number;
    child: number;
    childDefault?: number;
  }],
  numOfSeats: number;
  soldSeats: number;
  availableSeats: number;
};
declare var jQuery: any;
@Component({
  selector: 'booking-form',
  template
})
export class BookingFormComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy, OnChanges  {
  @Input() tour: Tour;
  booking: Booking;
  @Input() selDateRange: DateRange;
  bookingForm: FormGroup;
  error: string;

  constructor(private router: Router,
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private sessionStorage: SessionStorageService,
    private changeDetectorRef: ChangeDetectorRef,
    private currency: CurrencyService) {
    super();

    let booking = <Booking> {};
    booking.numOfAdults = 1;
    booking.numOfChild = 0;
    booking.travellers = <any>[];

    this.booking = booking;
  }

  ngOnInit() {
    let booking = this.booking;

    this.bookingForm = this.formBuilder.group({
      numOfAdults: [booking.numOfAdults, Validators.compose([Validators.required, CValidators.min(1), CValidators.max(30) ] ) ],
      numOfChild: [booking.numOfChild, Validators.compose([CValidators.max(30) ] ) ],
    });
  }

  ngAfterViewChecked() {
  }

  ngAfterViewInit() {
    Meteor.setTimeout(() => {
      jQuery(function($){

      });
    }, 500);
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges) {
    let booking = this.booking;

    // only run when property "data" changed
    if (changes['selDateRange']) {
      let selDateRange = <DateRange> JSON.parse(JSON.stringify(changes["selDateRange"].currentValue));
      if (selDateRange) {
        let array = new Uint32Array(2);
        window.crypto.getRandomValues(array);
        booking.uniqueId = Number(array[0]);
        booking.voucherId = Number(array[1]);
        booking.startDate = new Date(selDateRange.startDate.toString());
        booking.endDate = new Date(selDateRange.endDate.toString());
        booking.currencyCode = this.currency.currencyCode;
        for (let i=0; i<selDateRange.price.length; i++) {
          let adultPrice = this.currency.convert(selDateRange.price[i].adult);
          let childPrice = this.currency.convert(selDateRange.price[i].child);

          selDateRange.price[i].adultDefault = selDateRange.price[i].adult;
          selDateRange.price[i].childDefault = selDateRange.price[i].child;

          selDateRange.price[i].adult = adultPrice;
          selDateRange.price[i].child = childPrice;
        }

        this.selDateRange = selDateRange;
        this.setBookingPrice();
      }
    }

    if (changes['tour']) {
      let tour = changes["tour"].currentValue;
      if (typeof tour !== "undefined") {
        this.tour = <Tour>tour;
        booking.tour = {
          id: tour._id,
          supplierId: tour.owner.id,
          supplier: {
            companyName: tour.owner.companyName,
            agentCertificate: tour.owner.agentCertificate,
            agentIdentity: tour.owner.agentIdentity,
            image: tour.owner.image
          },
          name: tour.name,
          departure: tour.departure,
          destination: tour.destination,
          featuredImage: tour.featuredImage,
          noOfDays: tour.noOfDays,
          noOfNights: tour.noOfNights,
          totalMeals: tour.totalMeals,
          cancellationPolicy: tour.cancellationPolicy,
          refundPolicy: tour.refundPolicy,
          hasGuide: tour.hasGuide,
          hasFlight: tour.hasFlight,
          tourType: tour.tourType,
          tourPace: tour.tourPace,
          hasRated: false
        };
      }

    }
  }

  detectChanges() {
    this.changeDetectorRef.detectChanges();
  }

  setBookingPrice() {
    let booking = this.booking;
    let selDateRange = this.selDateRange;
    let numOfAdults = this.bookingForm.value.numOfAdults;
    let numOfChild = this.bookingForm.value.numOfChild;
    // console.log(selDateRange);

    let selPrice = _.find(selDateRange.price, {numOfPersons: numOfAdults});
    if (typeof selPrice == "undefined") {
      if (numOfAdults >= 5) {
        selPrice = selDateRange.price[4];
      } else {
        selPrice = selDateRange.price[0];
      }
    }
    let selPrice2 = _.find(selDateRange.price, {numOfPersons: numOfChild});
    if (typeof selPrice2 == "undefined") {
      if (numOfChild >= 5) {
        selPrice2 = selDateRange.price[4];
      } else {
        selPrice2 = selDateRange.price[0];
      }
    }

    booking.numOfAdults = numOfAdults;
    booking.numOfChild = numOfChild;
    booking.numOfTravellers = numOfAdults + numOfChild;
    selPrice.adult = selPrice.adult;
    selPrice2.child = selPrice2.child;
    booking.pricePerAdult = selPrice.adult;
    booking.pricePerChild = selPrice2.child;
    booking.totalPrice = (numOfAdults * selPrice.adult) + (numOfChild * selPrice2.child);
    // save price in selected currency
    booking.pricePerAdultDefault = selPrice.adultDefault;
    booking.pricePerChildDefault = selPrice2.childDefault;
    booking.totalPriceDefault = (numOfAdults * selPrice.adultDefault) + (numOfChild * selPrice2.childDefault);
    // console.log(booking);

    this.detectChanges();
  }

  doBooking() {
    let booking = this.booking;
    booking.numOfTravellers = booking.numOfAdults + booking.numOfChild;
    booking.tour.dateRangeId = this.selDateRange._id;

    let selDateRange = this.selDateRange;
    if (booking.numOfTravellers > selDateRange.availableSeats) {
      showAlert("Num of travellers cannot exceed than availability.", "danger");
      return;
    }

    this.sessionStorage.store("bookingDetails", this.booking);
    let bookingDetails = this.sessionStorage.retrieve("bookingDetails");
      if (bookingDetails) {
        let redirectUrl = ['/booking/step1'];
        if (! Meteor.userId()) {
          this.sessionStorage.store("redirectUrl", redirectUrl);
          redirectUrl = ['/login'];
        }

        this.zone.run(() => {
          jQuery(".modal").modal('hide');
          this.router.navigate(redirectUrl);
        });
      } else {
        showAlert("Error while saving data. Please try after restarting your browser.", "danger");
      }

  }

}

function convertToUTC(date: Date) {
  var d = new Date();
  let offset = d.getTimezoneOffset();
  let time = date.getTime() - (offset * 60 * 1000);
  return new Date(time);
}
