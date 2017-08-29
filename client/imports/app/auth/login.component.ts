import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators as Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MeteorComponent } from 'angular2-meteor';
import { LocalStorageService, SessionStorageService } from 'ng2-webstorage';
import { validateEmail, validatePassword } from "../../validators/common";
import { Title } from '@angular/platform-browser';
import { showAlert } from "../shared/show-alert";
import template from './login.component.html';

@Component({
  selector: 'login',
  template
})
export class LoginComponent extends MeteorComponent implements OnInit {
  loginForm: FormGroup;
  error: string;
  rememberMe = false;
  userId: string;

  constructor(private router: Router, private zone: NgZone, private titleService: Title, private formBuilder: FormBuilder, private localStorage: LocalStorageService, private sessionStorage: SessionStorageService) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Login | Atorvia");
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(50), validateEmail])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(30)])]
    });

    this.error = '';
  }

  login() {
    if (! this.loginForm.valid) {
      showAlert("Invalid FormData supplied.", "danger");
      return;
    }

    Meteor.loginWithPassword(this.loginForm.value.email, this.loginForm.value.password, (err) => {
      this.subscribe("users");
      this.zone.run(() => {
        if (err) {
          this.error = err;
          showAlert(err.reason, "danger");
        } else {
          showAlert("You have been logged in successfully.", "success");
          this.localStorage.store("rememberMeNot", !this.rememberMe);
          this.sessionStorage.store("Meteor.userId", Meteor.userId());
          let redirectUrl = this.sessionStorage.retrieve("redirectUrl");
          if (!redirectUrl) {
            redirectUrl = ['/bookings'];
          } else {
            this.sessionStorage.clear("redirectUrl");
          }
          this.router.navigate(redirectUrl);
        }
      });
    });
  }

  fblogin(): void {
    Meteor.loginWithFacebook({requestPermissions: ['public_profile,email']}, (err) => {
      this.zone.run(() => {
        if (err) {
          console.log("Error while calling loginWithFacebook:", err);
          showAlert(err.reason, "danger");
        } else {
          showAlert("You have been logged in successfully.", "success");
          this.router.navigate(['/bookings']);
        }
      });
    });
  }

}
