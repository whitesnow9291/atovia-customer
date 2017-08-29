import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators as Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { InjectUser } from "angular2-meteor-accounts-ui";
import { Title } from '@angular/platform-browser';
import { MeteorComponent } from 'angular2-meteor';
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { validateEmail, validatePassword } from "../../validators/common";
import { Booking } from "../../../../both/models/booking.model";
import { Tour } from "../../../../both/models/tour.model";
import { showAlert } from "../shared/show-alert";
import template from './booking-confirm.html';

@Component({
  selector: '',
  template
})
@InjectUser('user')
export class BookingConfirmComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy  {
  booking: Booking = null;
  tour: Tour = null;

  constructor(private router: Router, private titleService: Title, private zone: NgZone, private formBuilder: FormBuilder, private localStorage: LocalStorageService, private sessionStorage: SessionStorageService) {
    super();
  }

  ngAfterViewChecked() {
  }

  ngOnInit() {
    this.titleService.setTitle("Booking Confirm | Atorvia");
    let bookingId = this.sessionStorage.retrieve("bookingId");
    this.call("bookings.findOne", {_id: bookingId}, {with: {tour: true}}, (err, result) => {
      if (err) {
        showAlert(err.reason, "danger");
        return;
      }
      this.booking = <Booking>result.booking;
      this.tour = <Tour>result.tour;
    })
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

  get bookingDetails() {
    return this.booking;
  }

  ngOnDestroy() {
  }

  downloadVoucher() {
    let bookingId = this.sessionStorage.retrieve("bookingId");
    this.call("bookings.generateVoucher", bookingId, (err, res) => {
      if (err) {
        showAlert(err.reason, "danger");
        return;
      }

      let fileUrl = `/bookings/voucher/${bookingId}`;
      console.log(fileUrl);
      window.location.href = fileUrl;
    })
  }
}
