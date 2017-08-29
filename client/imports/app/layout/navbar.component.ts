import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { InjectUser } from "angular2-meteor-accounts-ui";
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { showAlert } from "../shared/show-alert";

import template from './navbar.html';

@Component({
  selector: 'navbar',
  template
})
@InjectUser('user')
export class NavbarComponent extends MeteorComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {

  isHome: boolean = false;
  whiteLogo: string = "img/logo-white.png";
  darkLogo: string = "img/logo.png";

  constructor(private zone: NgZone, private router: Router, private route: ActivatedRoute, private localStorage: LocalStorageService, private sessionStorage: SessionStorageService) {
    super();
  }

  ngOnInit() { 
    // Current path is home
    if ( this.router.url === "/" ) {
      this.isHome = true;
    }
  }

  ngAfterViewChecked() { }

  ngAfterViewInit() { }

  ngOnDestroy() { }

  logout() {
    this.localStorage.clear("rememberMeNot");
    this.sessionStorage.clear("Meteor.userId");
    Meteor.logout(() => {
      this.zone.run(() => {
        showAlert("You have been logged out successfully.", "success");
        this.router.navigate( ['/'] );
      });
    });
  }

}
