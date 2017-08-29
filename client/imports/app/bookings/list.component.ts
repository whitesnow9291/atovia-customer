import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { Meteor } from "meteor/meteor";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { InjectUser } from "angular2-meteor-accounts-ui";
import { Router, ActivatedRoute } from '@angular/router';
import { MeteorComponent } from 'angular2-meteor';
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { ChangeDetectorRef } from "@angular/core";
import { PaginationService } from "ng2-pagination";
import { Title } from '@angular/platform-browser';
import { User } from "../../../../both/models/user.model";
import { Booking } from "../../../../both/models/booking.model";
import { showAlert } from "../shared/show-alert";
import template from "./list.html";

declare var jQuery:any;
interface Pagination {
  limit: number;
  skip: number;
}

interface Options extends Pagination {
  [key: string]: any
}

@Component({
  selector: "",
  template
})
@InjectUser('user')
export class BookingsListComponent extends MeteorComponent implements OnInit, AfterViewInit {
  items: Booking[] = [];
  error: string = null;
  pageSize: Subject<number> = new Subject<number>();
  curPage: Subject<number> = new Subject<number>();
  orderBy: Subject<string> = new Subject<string>();
  nameOrder: Subject<number> = new Subject<number>();
  optionsSub: Subscription;
  itemsSize: number = -1;
  searchSubject: Subject<string> = new Subject<string>();
  searchString: string = "";
  whereCond: any = {};
  whereSub: Subject<any> = new Subject<any>();
  searchTimeout: any;

  constructor(private zone: NgZone, private titleService: Title, private route: ActivatedRoute, private paginationService: PaginationService, private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Dashboard | Atorvia");
    this.setOptions();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.pageSize.unsubscribe();
    this.curPage.unsubscribe();
    this.orderBy.unsubscribe();
    this.nameOrder.unsubscribe();
    this.searchSubject.unsubscribe();
    this.whereSub.unsubscribe();
  }

  private setOptions() {
      let options = {
          limit: 10,
          curPage: 1,
          orderBy: "bookingDate",
          nameOrder: -1,
          searchString: this.searchString,
          where: this.whereCond
      }

      this.setOptionsSub();

      this.paginationService.register({
      id: "bookings",
      itemsPerPage: 10,
      currentPage: options.curPage,
      totalItems: this.itemsSize
      });

      this.pageSize.next(options.limit);
      this.curPage.next(options.curPage);
      this.orderBy.next(options.orderBy);
      this.nameOrder.next(options.nameOrder);
      this.searchSubject.next(options.searchString);
      this.whereSub.next(options.where);
  }

  private setOptionsSub() {
      this.optionsSub = Observable.combineLatest(
          this.pageSize,
          this.curPage,
          this.orderBy,
          this.nameOrder,
          this.whereSub,
          this.searchSubject
      ).subscribe(([pageSize, curPage, orderBy, nameOrder, where, searchString]) => {
          //console.log("inside subscribe");
          const options: Options = {
              limit: pageSize as number,
              skip: ((curPage as number) - 1) * (pageSize as number),
              sort: { [orderBy]: nameOrder as number }
          };

          this.paginationService.setCurrentPage("bookings", curPage as number);
          this.searchString = searchString;
          jQuery(".loading").show();
          this.call("bookings.find", options, where, searchString, (err, res) => {
              jQuery(".loading").hide();
              if (err) {
                  showAlert("Error while fetching bookings list.", "danger");
                  return;
              }
              this.items = res.data;
              this.itemsSize = res.count;
              this.paginationService.setTotalItems("bookings", this.itemsSize);
              this.changeDetectorRef.detectChanges();
          })
      });
  }

  search(value: string): void {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchSubject.next(value);
      }, 500);
    }

    clearsearch(value: string): void {
        clearTimeout(this.searchTimeout);
    }

  onPageChanged(page: number): void {
      this.curPage.next(page);
  }

  changeOrderBy(sortBy: string): void {
    switch(sortBy) {
      case 'tour_asc':
      this.orderBy.next("tour.name");
      this.nameOrder.next(1);
      break;
      case 'tour_desc':
      this.orderBy.next("tour.name");
      this.nameOrder.next(-1);
      break;
      case 'length_asc':
      this.orderBy.next("tour.noOfDays");
      this.nameOrder.next(1);
      break;
      case 'length_desc':
      this.orderBy.next("tour.noOfDays");
      this.nameOrder.next(-1);
      break;
      case 'date_asc':
      this.orderBy.next("bookingDate");
      this.nameOrder.next(1);
      break;
      case 'date_desc':
      this.orderBy.next("bookingDate");
      this.nameOrder.next(-1);
      break;
      case 'price_asc':
      this.orderBy.next("totalPrice");
      this.nameOrder.next(1);
      break;
      case 'price_desc':
      this.orderBy.next("totalPrice");
      this.nameOrder.next(-1);
      break;
      case 'start_asc':
      this.orderBy.next("startDate");
      this.nameOrder.next(1);
      break;
      case 'start_desc':
      this.orderBy.next("startDate");
      this.nameOrder.next(-1);
      break;
      default:
      this.orderBy.next("bookingDate");
      this.nameOrder.next(-1);
      break;
    }
  }

  getBookingStatus(item) {
    let retVal = null;

    // check completed flag
    if (item.cancelled == false && new Date(item.startDate.toString()) < new Date()) {
      item.completed = true;
    }

    if (! item.paymentInfo || item.paymentInfo.status != 'approved') {
      retVal = "Unpaid";
    } else if (item.cancelled == true && item.refunded !== true) {
      retVal = "Refund Requested";
    } else if (item.cancelled == true && item.refunded == true) {
      retVal = "Cancelled";
    } else if (item.confirmed !== true) {
        retVal = "Pending";
    } else if (item.confirmed === true && item.completed !== true) {
        retVal = "Confirmed";
    } else if (item.completed === true) {
        retVal = "Completed";
    }

    return retVal;
  }
}
