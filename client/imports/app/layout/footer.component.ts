import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';

import template from './footer.html';

@Component({
  selector: 'app-footer',
  template
})
export class FooterComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {

  constructor(private zone: NgZone, private route: ActivatedRoute) {
    super();
  }

  ngOnInit() { }

  ngAfterViewChecked() { }

  ngAfterViewInit() { }

  ngOnDestroy() { }

}
