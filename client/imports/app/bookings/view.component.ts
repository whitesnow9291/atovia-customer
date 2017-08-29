import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Meteor } from "meteor/meteor";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { InjectUser } from "angular2-meteor-accounts-ui";
import { Router, ActivatedRoute } from '@angular/router';
import { MeteorComponent } from 'angular2-meteor';
import { SessionStorageService } from 'ng2-webstorage';
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { ChangeDetectorRef } from "@angular/core";
import { User } from "../../../../both/models/user.model";
import { Tour } from "../../../../both/models/tour.model";
import { Booking } from "../../../../both/models/booking.model";
import { showAlert } from "../shared/show-alert";
import * as moment from 'moment';
import template from "./view.html";

declare var jQuery:any;

@Component({
  selector: "",
  template
})
@InjectUser('user')
export class BookingViewComponent extends MeteorComponent implements OnInit, AfterViewInit, OnDestroy {
  booking: Booking = null;
  tour: Tour = null;
  bookingId: string;
  supplier: User = null;
  error: string = null;
  activeTab: string = "overview";
  paramsSub: Subscription;
  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private sessionStorage: SessionStorageService,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
    ) {
    super();
  }

  ngOnInit() {
    this.paramsSub = this.route.params
    .map(params => params['id'])
    .subscribe(id => {

      this.bookingId = id;
      this.call("bookings.findOne", {_id: id}, {with: {supplier: true, tour: true}}, (err, res) => {
        if (err) {
          console.log(err.reason, "danger");
          return;
        }
        // check completed flag
        if (new Date(res.booking.startDate.toString()) < new Date()) {
          res.booking.completed = true;
        }

        this.booking = <Booking>res.booking;
        this.tour = <Tour>res.tour;
        this.supplier = <User>res.supplier;

        this.changeDetectorRef.detectChanges();
      });

    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
  }

  detectChanges() {
    this.changeDetectorRef.detectChanges();
  }

  get departInDays() {
    let booking = this.booking;
    let a = moment.utc(booking.startDate);
    a.set({hour:0,minute:0,second:0,millisecond:0})
    let b = moment.utc(new Date());
    b.set({hour:0,minute:0,second:0,millisecond:0})
    let diff = a.diff(b, 'days');
    if (diff < 0) {
      diff = 0;
    }
    return diff;
  }

  get bookingStatus() {
    let retVal = null;
    let booking = this.booking;

    if (! booking.paymentInfo || booking.paymentInfo.status != 'approved') {
        retVal = "Unpaid";
      } else if (booking.cancelled == true && booking.refunded !== true) {
        retVal = "Refund Requested";
      } else if (booking.cancelled == true && booking.refunded == true) {
        retVal = "Cancelled";
      } else if (booking.confirmed !== true) {
          retVal = "Pending";
      } else if (booking.confirmed === true && booking.completed !== true) {
          retVal = "Confirmed";
      } else if (booking.completed === true) {
          retVal = "Completed";
      }

    return retVal;
  }

  makePayment() {
    this.sessionStorage.store("bookingId", this.bookingId);
    this.zone.run(() => {
      this.router.navigate(['/booking/step2']);
    })
  }

  downloadVoucher(bookingId: string) {
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
