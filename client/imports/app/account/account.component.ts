import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {Observable, Subscription, Subject} from "rxjs";
import {MeteorObservable} from "meteor-rxjs";
import { InjectUser } from "angular2-meteor-accounts-ui";
import {MeteorComponent} from 'angular2-meteor';
import { User } from "../../../../both/models/user.model";
import template from './account.component.html';


@Component({
  selector: '',
  template
})
@InjectUser("user")
export class UserDetailsComponent extends MeteorComponent implements OnInit {
  userSub: Observable<any[]>;
  userId: string;
  user: User;
  paramsSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {
      super();
  }

  ngOnInit() {
    this.paramsSub = this.route.params
        .map(params => params['userId'])
        .subscribe(userId => {
            this.userId = userId;
            //console.log("userId:", userId);

            this.call("users.findOne", userId, (err, res)=> {
                if (err) {
                    //console.log("error while fetching patient data:", err);
                    return;
                }
                this.user= res;
            });

        });
  }

}
