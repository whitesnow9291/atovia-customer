import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { ChangeDetectorRef } from "@angular/core";
import { Tour } from "../../../../both/models/tour.model";
import { showAlert } from "../shared/show-alert";
import template from './destination.html';

interface Pagination {
  limit: number;
  skip: number;
}

interface Options extends Pagination {
  [key: string]: any
}

@Component({
  selector: '',
  template
})
export class DestinationComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  error: string;
  paramsSub: Subscription;
  searchString: string;
  itemsSize: number = -1;
  tours: Tour[];

  constructor(private zone: NgZone, private router: Router, private route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.paramsSub = this.route.params
      .subscribe(params => {

        if (params['slug']) {
          this.searchString = params['slug'];
        }

        if (! this.searchString) {
          //console.log("no page-id supplied");
        }

        this.fetchItems();
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

  fetchItems() {
    const options: Options = {
        limit: 12,
        skip: 0,
        sort: { "numOfViews": -1 }
    };

    jQuery(".loading").show();
    this.call("tours.find", options, {}, this.searchString, (err, res) => {
        jQuery(".loading").hide();
        if (err) {
            showAlert("Error while fetching tours list.", "danger");
            return;
        }
        this.tours = res.data;
        this.itemsSize = res.count;
        this.changeDetectorRef.detectChanges();
    })
  }

}
