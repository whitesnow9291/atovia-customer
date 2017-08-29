import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { MeteorComponent } from 'angular2-meteor';
import { Title } from '@angular/platform-browser';
import { showAlert } from "../shared/show-alert";
import { validateEmail, validatePassword, validatePhoneNum, validateFirstName } from "../../validators/common";
import template from './signup.component.html';

@Component({
  selector: 'signup',
  template
})
export class SignupComponent extends MeteorComponent implements OnInit {
  signupForm: FormGroup;
  error: string;
  fbId: string;
  fbProfile: any;

  constructor(private router: Router, private titleService: Title, private zone: NgZone, private formBuilder: FormBuilder) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Signup | Atorvia");
    this.signupForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(50), validateEmail])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(30)])],
      firstName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])],
      lastName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])]
    })

  }

  signup() {
    if (! this.signupForm.valid) {
      showAlert("Invalid FormData supplied.", "danger");
      return;
    }

    let userData = {
      email: this.signupForm.value.email,
      passwd: this.signupForm.value.password,
      profile: {
        firstName: this.signupForm.value.firstName,
        lastName: this.signupForm.value.lastName,
      }
    };
    this.call("users.insert", userData, (err, res) => {
      this.zone.run(() => {
        if (err) {
            showAlert(err.reason, "danger");
            this.error = err;
        } else {
          showAlert("Your account has been created successfully. Please check your email for further instructions.", "success");
          this.router.navigate(['/login']);
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
          showAlert("Your account has been created successfully.", "success");
          this.router.navigate(['/bookings']);
        }
      });
    });
  }
}
