import { Component, Input, OnInit } from '@angular/core';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { ChangeDetectorRef } from "@angular/core";
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import * as _ from 'underscore';
import template from './star-rating.html';

@Component({
  selector: 'star-rating',
  template
})
export class StarRatingComponent extends MeteorComponent {
  @Input()
  rating: number;
  @Input()
  disable: string;

  constructor(private localStorage: LocalStorageService) {
    super();
  }

  get ratingNum() {
    let rating = this.rating;
    return Math.round(rating * 10) / 10;
  }

}
