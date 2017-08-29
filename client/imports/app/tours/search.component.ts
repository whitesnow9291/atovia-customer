import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { Title } from '@angular/platform-browser';
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { PaginationService } from "ng2-pagination";
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { Tour } from "../../../../both/models/tour.model";
import { isValidEmail } from "../../../../both/validators/index";
import { showAlert } from "../shared/show-alert";
import * as moment from 'moment';
import template from './search.html';

declare var jQuery:any;
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
export class SearchComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  items: Tour[];
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
  tourOptions: Subject<any> = new Subject<any>();
  paceOptions: Subject<any> = new Subject<any>();
  paramsSub: Subscription;
  isSearchScreen: boolean = true;

  constructor(private zone: NgZone,
    private titleService: Title,
    private route: ActivatedRoute,
    private paginationService: PaginationService,
    private localStorage: LocalStorageService) {
    super();
  }

  ngOnInit() {
    this.paramsSub = this.route.params
      .subscribe(params => {

        if (params['slug']) {
          this.searchString = params['slug'];
          this.isSearchScreen = false;
          this.titleService.setTitle("Destinations | Atorvia");
        } else {
          this.titleService.setTitle("Search Results for" + this.searchString + " | Atorvia");
          this.searchString = params['query'];
        }

        if (! this.searchString) {
          //console.log("no page-id supplied");
        }

        this.setOptions();
      });
  }

  ngAfterViewChecked() {
  }

  ngAfterViewInit() {
    let currencyCode = this.currencyCode;
    let callback = (currencyCode) => {
      jQuery(function($){
        $("#price-range").slider({
          range: true,
          min: 0,
          max: 10000,
          values: [0, 10000],
          slide: function(event, ui) {
            $("#startPriceRange").html(currencyCode + ui.values[0]);
            $("#endPriceRange").html(currencyCode  + ui.values[1]);
            $("#filterPrice").val(ui.values[0] + ',' + ui.values[1]);

            $("#filterPrice").trigger("click");
          }
        });
      });

      $(".filter-wrap").click(function () {
       $(".filter").show();
      });
    };

    setTimeout(`var callback = ${callback}; callback('${currencyCode}')`, 500);
  }

  ngOnDestroy() {
  }

  get currencyCode() {
    let currencyCode = this.localStorage.retrieve("currencyCode");
    switch(currencyCode) {
      case "INR":
      currencyCode = '<i class="fa fa-inr" aria-hidden="true"></i>';
      break;
      case "AUD":
      currencyCode = 'A<i class="fa fa-dollar" aria-hidden="true"></i>';
      break;
      case "USD":
      currencyCode = '<i class="fa fa-dollar" aria-hidden="true"></i>';
      break;
      case "CAD":
      currencyCode = 'C<i class="fa fa-dollar" aria-hidden="true"></i>';
      break;
      case "EUR":
      currencyCode = '<i class="fa fa-euro" aria-hidden="true"></i>';
      break;
      case "GBP":
      currencyCode = '<i class="fa fa-gbp" aria-hidden="true"></i>';
      break;
    }
    return currencyCode;
  }

  private setOptions() {
      let options = {
          limit: 10,
          curPage: 1,
          orderBy: "createdAt",
          nameOrder: -1,
          searchString: this.searchString,
          where: this.whereCond
      }

      this.setOptionsSub();

      this.paginationService.register({
      id: "tours",
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

          this.paginationService.setCurrentPage("tours", curPage as number);
          this.searchString = searchString;
          jQuery(".loading").show();
          this.call("tours.find", options, where, searchString, (err, res) => {
              jQuery(".loading").hide();
              if (err) {
                  showAlert("Error while fetching tours list.", "danger");
                  return;
              }
              this.items = res.data;
              // console.log(res.data);
              this.itemsSize = res.count;
              this.paginationService.setTotalItems("tours", this.itemsSize);
          })
      });
  }

  onPageChanged(page: number): void {
      this.curPage.next(page);
  }

  changeOrderBy(sortBy: string): void {
    switch(sortBy) {
      case 'tour_asc':
      this.orderBy.next("name");
      this.nameOrder.next(1);
      break;
      case 'tour_desc':
      this.orderBy.next("name");
      this.nameOrder.next(-1);
      break;
      case 'length_asc':
      this.orderBy.next("noOfDays");
      this.nameOrder.next(1);
      break;
      case 'length_desc':
      this.orderBy.next("noOfDays");
      this.nameOrder.next(-1);
      break;
      case 'availability_asc':
      this.orderBy.next("totalAvailableSeats");
      this.nameOrder.next(1);
      break;
      case 'availability_desc':
      this.orderBy.next("totalAvailableSeats");
      this.nameOrder.next(-1);
      break;
      case 'price_asc':
      this.orderBy.next("dateRange.price.adult");
      this.nameOrder.next(1);
      break;
      case 'price_desc':
      this.orderBy.next("dateRange.price.adult");
      this.nameOrder.next(-1);
      break;
      default:
      this.orderBy.next("createdAt");
      this.nameOrder.next(-1);
      break;
    }
  }

  changeSortOrder(nameOrder: string): void {
      this.nameOrder.next(parseInt(nameOrder));
  }

  changePrice(value) {
    // console.log("changePrice:", value);
    // don't apply filters if range is empty
    if (!value) {
      return;
    }

    let range = value.split(',');
    let where = this.whereCond;
    where["dateRange.price.adult"] = {
      $gte: Number(range[0]),
      $lte: Number(range[1])
    };
    this.whereCond = JSON.parse(JSON.stringify(where));

    // redefine where
    this.redefineWhere(where);
    this.whereSub.next(where);
  }

  updatePaceOptions(value, event) {
    let where = this.whereCond;
    if (typeof where["tourPace"] == "undefined") {
      where["tourPace"] = { };
    }
    where["tourPace"] [value] = event.target.checked;
    this.whereCond = JSON.parse(JSON.stringify(where));

    // redefine where
    this.redefineWhere(where);
    this.whereSub.next(where);
  }

  updateTourOptions(value, event) {
    let where = this.whereCond;
    if (typeof where["tourType"] == "undefined") {
      where["tourType"] = { };
    }
    where["tourType"] [value] = event.target.checked;
    this.whereCond = JSON.parse(JSON.stringify(where));

    // redefine where
    this.redefineWhere(where);
    this.whereSub.next(where);
  }

  private redefineWhere(where) {
    if (typeof where.tourPace != "undefined") {
      let tourPace = [];
      for (let i in where.tourPace) {
        if (where.tourPace[i] == true) {
          tourPace.push(i);
        }
      }

      if (tourPace.length > 0) {
        where.tourPace = {$in: tourPace};
      } else {
        delete where.tourPace;
      }
    }

    if (typeof where.tourType != "undefined") {
      let tourType = [];
      for (let i in where.tourType) {
        if (where.tourType[i] == true) {
          tourType.push(i);
        }
      }

      if (tourType.length > 0) {
        where.tourType = {$in: tourType};
      } else {
        delete where.tourType;
      }
    }
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
