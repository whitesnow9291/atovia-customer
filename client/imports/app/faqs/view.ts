import { Meteor } from "meteor/meteor";
import { Component, OnInit, OnDestroy, NgZone } from "@angular/core";
import { Observable, Subscription, Subject, BehaviorSubject } from "rxjs";
import { MeteorObservable } from "meteor-rxjs";
import { Title } from '@angular/platform-browser';
import { InjectUser } from "angular2-meteor-accounts-ui";
import { ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MeteorComponent } from 'angular2-meteor';
import { FAQCategory } from "../../../../both/models/faqs.model";

import template from "./view.html";


@Component({
  selector: '',
  template
})

export class FaqPageComponent extends MeteorComponent implements OnInit, OnDestroy {
  items: FAQCategory[]
  constructor(private changeDetectorRef: ChangeDetectorRef, private titleService: Title) {
    super();
  }
  ngOnInit() {
    this.titleService.setTitle("FAQs | Atorvia");
    this.call("faqs.find", (err, res) => {
      if (err) {
        console.log("Error calling faqs.find");
        return;
      }
      this.items = res;
      this.changeDetectorRef.detectChanges();
    });
  }

  get data() {
      return this.items;
  }
}
