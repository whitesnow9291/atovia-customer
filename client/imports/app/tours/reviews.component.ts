import { Component, Input, OnInit } from '@angular/core';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { PaginationService } from "ng2-pagination";
import { ChangeDetectorRef } from "@angular/core";
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { Tour } from "../../../../both/models/tour.model";
import { Review } from "../../../both/models/review.model";
import { showAlert } from "../shared/show-alert";

import * as _ from 'underscore';
import template from './reviews.html';

interface Pagination {
  limit: number;
  skip: number;
}

interface Options extends Pagination {
  [key: string]: any
}

@Component({
  selector: 'tour-review',
  template
})
export class TourReviewsComponent extends MeteorComponent implements OnInit {
  @Input()
  tour: Tour;
  items: Review;
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

  constructor(private localStorage: LocalStorageService,private paginationService: PaginationService,private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.setOptions();
  }

  private setOptions() {
      let options = {
          limit: 20,
          curPage: 1,
          orderBy: "createdAt",
          nameOrder: -1,
          where: {"tourId": this.tour._id}
      }

      this.setOptionsSub();

      this.paginationService.register({
      id: "reviews",
      itemsPerPage: 20,
      currentPage: options.curPage,
      totalItems: this.itemsSize
      });

      this.pageSize.next(options.limit);
      this.curPage.next(options.curPage);
      this.orderBy.next(options.orderBy);
      this.nameOrder.next(options.nameOrder);
      this.whereSub.next(options.where);
  }

  private setOptionsSub() {
      this.optionsSub = Observable.combineLatest(
          this.pageSize,
          this.curPage,
          this.orderBy,
          this.nameOrder,
          this.whereSub
      ).subscribe(([pageSize, curPage, orderBy, nameOrder, where]) => {
          //console.log("inside subscribe");
          const options: Options = {
              limit: pageSize as number,
              skip: ((curPage as number) - 1) * (pageSize as number),
              sort: { [orderBy]: nameOrder as number }
          };

          this.paginationService.setCurrentPage("reviews", curPage as number);
          jQuery(".loading").show();
          this.call("tourReviews.find", options, where, (err, res) => {
              jQuery(".loading").hide();
              if (err) {
                  showAlert("Error while fetching reviews list.", "danger");
                  return;
              }
              this.items = res.data;
              this.itemsSize = res.count;
              this.paginationService.setTotalItems("reviews", this.itemsSize);
              this.changeDetectorRef.detectChanges();
          })
      });
  }

  onPageChanged(page: number): void {
      this.curPage.next(page);
  }

}
