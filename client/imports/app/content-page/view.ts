import { Meteor } from "meteor/meteor";
import {Component, OnInit, OnDestroy, NgZone} from "@angular/core";
import {Observable, Subscription, Subject, BehaviorSubject} from "rxjs";
import {MeteorObservable} from "meteor-rxjs";
import {InjectUser} from "angular2-meteor-accounts-ui";
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MeteorComponent } from 'angular2-meteor';
import { Page } from "../../../../both/models/page.model";
import {showAlert} from "../shared/show-alert";
import { Title } from '@angular/platform-browser';
import template from "./view.html";
import about from "./static/about-us.html";
import terms from "./static/terms-and-conditions.html";
import privacy from "./static/privacy-policy.html";
import refund from "./static/refund-policy.html";
import howToBook from "./static/how-to-book.html";
import partner from "./static/partner-with-us.html";

@Component({
  selector: '',
  template
})

@InjectUser('user')
export class ViewPageComponent extends MeteorComponent implements OnInit, OnDestroy {
    paramsSub: Subscription;
    item: Page;
    slug: string;

    constructor(private router: Router,
        private route: ActivatedRoute,
        private titleService: Title,
        private ngZone: NgZone
    ) {
        super();
    }

    ngOnInit() {
      this.slug = this.route.routeConfig.path;

      if (! this.slug) {
        showAlert("Invalid slug supplied.");
        return;
      }

      switch (this.slug) {
        case "about-us":
        this.titleService.setTitle("About Us | Atorvia");
          this.item = <Page> {
            heading: "About Us",
            class: "about",
            contents: about
          };
        break;
        case "terms":
        this.titleService.setTitle("Terms and Conditions | Atorvia");
          this.item = <Page> {
            heading: "Terms & Conditions",
            class: "policy",
            contents: terms
          };
        break;
        case "privacy":
        this.titleService.setTitle("Privacy Policy | Atorvia");
          this.item = <Page> {
            heading: "Privacy Policy",
            class: "policy",
            contents: privacy
          };
        break;
        case "refund":
        this.titleService.setTitle("Refund Policy | Atorvia");
          this.item = <Page> {
            heading: "Refund Policy",
            class: "policy",
            contents: refund
          };
        break;
        case "how-to-book":
        this.titleService.setTitle("How to Book? | Atorvia");
          this.item = <Page> {
            heading: "How to book",
            contents: howToBook
          }
        break;
        case "partner":
        this.titleService.setTitle("Partner with us | Atorvia");
          this.item = <Page> {
            heading: "Partner with us",
            contents: partner
          }
        break;
        default:
          this.call("pages.findOne", this.slug, (err, res)=> {
              if (err) {
                  showAlert("Error while fetching page data.", "danger");
                  return;
              }

              this.item = res;
          });
        break;
      }
    }

    get page() {
        return this.item;
    }
}
