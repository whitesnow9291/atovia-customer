import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { Title } from '@angular/platform-browser';
import { ChangeDetectorRef } from "@angular/core";
import { Tour } from "../../../../both/models/tour.model";
import { showAlert } from "../shared/show-alert";
import template from './top-destinations.html';

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
export class TopDestinationsComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  error: string;
  tours: Tour[];

  constructor(private zone: NgZone, private router: Router, private titleService: Title, private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Top Destinations | Atorvia");
    let where = {active: true, approved: true};
    let limit = 8;
    this.call("tours.findTopDestinations", where, limit, (err, res) => {
        if (err) {
            showAlert("Error while fetching pages list.", "danger");
            return;
        }
        this.tours = res;
        this.changeDetectorRef.detectChanges();
    })
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

}
