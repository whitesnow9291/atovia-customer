import { Meteor } from 'meteor/meteor';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router'
import { MeteorComponent } from 'angular2-meteor';
import { InjectUser } from "angular2-meteor-accounts-ui";
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import template from './app.component.web.html';

declare var jQuery:any;

@Component({
  selector: 'app',
  template
})

@InjectUser('user')
export class AppComponent extends MeteorComponent implements OnInit, AfterViewInit {
  constructor(private router: Router, private localStorage: LocalStorageService, private sessionStorage: SessionStorageService) {
    super();
    this.observeWindowHeight();
  }

  ngOnInit() {
    if (Meteor.userId())
    {
        this.subscribe("users");
        // this.checkRememberMe();
    }

    /*let currencyCode = this.localStorage.retrieve("currencyCode");
    if (! currencyCode) {
      this.setDefaultCurrency();
    }*/
    this.setDefaultCurrency();

    /*let currenciesRates = this.localStorage.retrieve("currencies.rates");
    if (! currenciesRates) {
      this.fetchCurrencyRates();
    }*/
    this.fetchCurrencyRates();
  }

  private observeWindowHeight() {
    this.router.events.subscribe((val) => {
      //console.log("route changed:", val);
      window.scrollTo(0, 0);
      (function setWindowHeight(){
        var windowHeight = $(window).height();
        $('.table-wrapper').height(windowHeight);
        var tableHeight = $('.table-wrapper').height();
      })();
    });
  }

  /*private checkRememberMe() {
    let rememberMeNot = this.localStorage.retrieve("rememberMeNot");
    if (rememberMeNot == true) {
      let userId = this.sessionStorage.retrieve("Meteor.userId");
      if (! userId) {
        // remove tokens
        this.localStorage.clear("rememberMeNot");
        Meteor.logout();
        let router = this.router;
        Meteor.setTimeout(function(){
          router.navigate( ['/login'] );
        }, 500);
      }
    }
  }*/

  private setDefaultCurrency() {
    this.call("currencies.getCode", (err, res) => {
      if (err) {
        console.log("Error while fetching currency code.")
        console.log(err.reason);
        return;
      }

      if (res) {
        this.localStorage.store("currencyCode", res);
      }
    });
  }

  private fetchCurrencyRates() {
    this.call("currencies.find", (err, res) => {
      if (err) {
        console.log("Error while loading currency exchange rates");
        console.log(err.reason);
        return;
      }

      if (res) {
        this.localStorage.store("currencies.rates", res);
      }
    });
  }

  ngAfterViewInit() {
      jQuery(function($){
        var link = `<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css">
        <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.min.css"><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">`;
        $('head').prepend(link);
      })
  }
}
