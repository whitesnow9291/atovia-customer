import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { ChangeDetectorRef } from "@angular/core";
import { InjectUser } from "angular2-meteor-accounts-ui";
import { Title } from '@angular/platform-browser';
import { SessionStorageService } from 'ng2-webstorage';
import { Tour } from "../../../../both/models/tour.model";
import { Review } from "../../../../both/models/review.model";
import { User } from "../../../../both/models/user.model";
import { showAlert } from "../shared/show-alert";
import * as moment from 'moment';
import template from './view.html';

interface Pagination {
  limit: number;
  skip: number;
}

interface Options extends Pagination {
  [key: string]: any
}

interface DateRange {
  _id: string;
  startDate: Date;
  endDate: Date;
  price?: [{
    numOfPersons: number;
    adult: number;
    child: number;
  }],
  numOfSeats: number;
  soldSeats: number;
  availableSeats: number;
}

@Component({
  selector: '',
  template
})
@InjectUser('user')
export class TourViewComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  paramsSub: Subscription;
  query: string;
  error: string;
  item: Tour;
  review: Review;
  reviewSize: number = -1;
  owner: User;
  relatedItems: Tour[] = null;
  slickInitialized: boolean = false;
  prettyPhotoInitialized: boolean = false;
  activeTab: string = "overview";
  selDateRange: DateRange = null;
  userId: string;

  constructor(private zone: NgZone, private titleService: Title, private router: Router, private route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef, private sessionStorage: SessionStorageService) {
    super();
  }

  ngOnInit() {
    this.userId = Meteor.userId();
    this.paramsSub = this.route.params
      .map(params => params['name'])
      .subscribe(name => {
          this.item = null;
          this.relatedItems = null;
          this.slickInitialized = false;
          this.prettyPhotoInitialized = false;
          this.query = name;

          let tour = name.toUpperCase();
          this.titleService.setTitle(tour + " | Atorvia");

          this.call("tours.findOne", {slug: this.query}, {with: {owner: true}}, (err, res) => {
            if (err) {
              console.log(err.reason, "danger");
              return;
            }

            this.item = <Tour>res.tour;
            this.owner = <User>res.owner;
            this.owner.profile.avgRating = Math.round( this.owner.profile.avgRating * 10) / 10;
            this.fetchRelatedItems();
            this.changeDetectorRef.detectChanges();
            let item = this.item;
            let tourId = item._id;
            this.call("tours.incrementView", tourId, (err, res) => {
              if (err) {
                console.log(err.reason, "danger");
              }
            })
          })
        });
  }

  ngAfterViewChecked() {
  }

  ngAfterViewInit() {
    Meteor.setTimeout(() => {

      function sticky_relocate() {
        if (! $('#sticky-anchor').length) {
          return;
        }

        var window_top = $(window).scrollTop();
        var div_top = $('#sticky-anchor').offset().top;
        if (window_top > div_top) {
          $('#sticky').addClass('stick');
          $('#sticky-anchor').height($('#sticky').outerHeight());
        }
        else {
          $('#sticky').removeClass('stick');
          $('#sticky-anchor').height(0);
        }
      }

      $(function() {
        $(window).scroll(sticky_relocate);
        sticky_relocate();
      });

    }, 1000);
  }

  ngOnDestroy() {
  }

  private fetchRelatedItems() {
    if (this.relatedItems !== null) {
      return;
    }

    const options: Options = {
        limit: 10,
        skip: 0,
        sort: { "totalAvailableSeats": -1 }
    };
    let item = this.item;
    let where = {active: true, approved: true, tourType: item.tourType, _id: {$ne: item._id}};

    this.call("tours.find", options, where, "", (err, res) => {
        if (err) {
            showAlert("Error while fetching related items.", "danger");
            return;
        }

        this.relatedItems = res.data;
    })
  }

  get tour() {
    return this.item;
  }

  get relatedTours() {
    return this.relatedItems;
  }

  initializePrettyPhoto(i) {
    let index = i + 1;
    let tour = this.item;
    if (index < tour.images.length || this.prettyPhotoInitialized !== false) {
      return;
    }
    this.prettyPhotoInitialized = true;

    Meteor.setTimeout(() => {
      jQuery(function($){
        $("a[rel^='prettyPhoto']").prettyPhoto({
          social_tools: false
        });
      });
    }, 1000);
  }

  initializeSlick(i) {
    if (this.relatedItems == null) {
      return;
    }

    let index = i + 1;
    if (index < this.relatedItems.length || this.slickInitialized !== false) {
      return;
    }
    this.slickInitialized = true;

    Meteor.setTimeout(() => {
      jQuery('.slider-wrap').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 3,
        centerPadding: '30px',
        speed: 300,
         responsive: [
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 2
            }
          },
          {
            breakpoint: 600,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1
            }
          }
        ]
      })
    }, 1000);
  }

  scrollToDiv(elemId) {
    jQuery('html, body').animate({
        scrollTop: jQuery("#" + elemId).offset().top - 100
    }, 500);
  }

  detectChanges() {
    this.changeDetectorRef.detectChanges();
  }

  redirectToLogin() {
    let tour = this.item;
    let redirectUrl = ['/tours', tour.slug];
    this.sessionStorage.store("redirectUrl", redirectUrl);

    this.zone.run(() => {
      this.router.navigate(['/login']);
    });
  }

  askAQuestion() {
    let tour = this.item;
    let redirectUrl = ['/tours', tour.slug];
    this.sessionStorage.store("redirectUrl", redirectUrl);

    this.zone.run(() => {
      this.router.navigate(['/login']);
    });
  }

  isAvailSchedule(row: DateRange) {
    let startDate = new Date(row.startDate.toString());
    let a = moment.utc(startDate);
    a.set({hour:0,minute:0,second:0,millisecond:0})
    let b = moment.utc(new Date());
    b.set({hour:0,minute:0,second:0,millisecond:0})
    let diff = a.diff(b, 'days');
    if (diff <= 0) {
      return false;
    }
    return true;
  }

  getStartPrice(dateRange: DateRange[]) {
    let priceList = [];
    for (let i = 0; i<dateRange.length;i++) {
      if (! dateRange[i] || ! dateRange[i].startDate) {
        continue;
      }
      let startDate = new Date(dateRange[i].startDate.toString());
      let a = moment.utc(startDate);
      a.set({hour:0,minute:0,second:0,millisecond:0})
      let b = moment.utc(new Date());
      b.set({hour:0,minute:0,second:0,millisecond:0})
      let diff = a.diff(b,'days');
      if (diff <= 0) {
        continue;
      } else {
        priceList.push(dateRange[i].price[0].adult);
      }
    }
    if (priceList.length) {
      return Math.min.apply(Math, priceList);
    } else {
      return "N.A.";
    }
  }



}
