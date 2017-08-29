import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Meteor } from "meteor/meteor";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { InjectUser } from "angular2-meteor-accounts-ui";
import { Router, ActivatedRoute } from '@angular/router';
import { MeteorComponent } from 'angular2-meteor';
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { ChangeDetectorRef } from "@angular/core";
import { Title } from '@angular/platform-browser';
import { User } from "../../../../both/models/user.model";
import { Tour } from "../../../../both/models/tour.model";
import { Booking } from "../../../../both/models/booking.model";
import { showAlert } from "../shared/show-alert";
import * as moment from 'moment';
import template from "./rating-form.html";

declare var jQuery:any;

@Component({
  selector: "",
  template
})
@InjectUser('user')
export class RateTourComponent extends MeteorComponent implements OnInit, AfterViewInit {
  ratingForm: FormGroup;
  booking: Booking = null;
  tour: Tour = null;
  supplier: User = null;
  bookingId: string;
  error: string;
  paramsSub: Subscription;
  rating:Number = 0;

  constructor(
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private changeDetectorRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Review Tour | Atorvia");
    this.paramsSub = this.route.params
    .map(params => params['id'])
    .subscribe(id => {

      this.bookingId = id;
      this.call("bookings.findOne", {"_id": id, "confirmed": true, "cancelled": false, "tour.hasRated": false, "paymentInfo.status": "approved"}, {with: {supplier: true, tour: true}}, (err, res) => {
        if (err) {
          console.log(err.reason, "danger");
          return;
        }

        // check completed flag
        if (new Date(res.booking.startDate) < new Date()) {
          res.booking.completed = true;
        }

        this.booking = <Booking>res.booking;
        this.tour = <Tour>res.tour;
        this.supplier = <User>res.supplier;

        this.changeDetectorRef.detectChanges();
      });
    });

    this.ratingForm = this.formBuilder.group({
      comments: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(255)]) ]
    });

    this.error = '';
  }

  ngAfterViewInit() {
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
      retVal = "Cancelled";
    } else if (booking.cancelled == true && booking.refunded == true) {
      retVal = "Refunded";
    } else if (booking.confirmed !== true) {
        retVal = "Pending";
    } else if (booking.confirmed === true && booking.completed !== true) {
        retVal = "Confirmed";
    } else if (booking.completed === true) {
        retVal = "Completed";
    }

    return retVal;
  }

  reviewTour() {
    let comments = this.ratingForm.value.comments;
    let rate = this.rating;
    let booking = this.booking;
    if (booking.tour.hasRated) {
      showAlert("Your input has been already saved.");
      return;
    }

    this.call("bookings.saveRating", booking._id, rate, comments, (err, res) => {
      if (err) {
        showAlert(err.reason, "danger");
        return;
      }

        booking.tour.rating = rate;
        booking.tour.hasRated = true;
        showAlert("Tour rating has been updated successfully. Thank you!", "success");
        this.zone.run(() => {
          this.router.navigate(['/bookings']);
        })
      })
  }
}
