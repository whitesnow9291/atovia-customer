import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { Title } from '@angular/platform-browser';
import { validateEmail, validatePassword } from "../../validators/common";
import { showAlert } from "../shared/show-alert";

import template from './recover.component.html';

@Component({
  selector: 'recover',
  template
})
export class RecoverComponent implements OnInit {
  recoverForm: FormGroup;
  error: string;

  constructor(private router: Router, private titleService: Title, private zone: NgZone, private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.titleService.setTitle("Recover Password | Atorvia");
    this.recoverForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(50), validateEmail])]
    });

    this.error = '';
  }

  recover() {
    if (! this.recoverForm.valid) {
      showAlert("Invalid FormData supplied.", "danger");
      return;
    }

    showAlert("Please wait...", "info");
    Accounts.forgotPassword({
      email: this.recoverForm.value.email
    }, (err) => {
      this.zone.run(() => {
        if (err) {
            showAlert(err.reason, "danger");
            this.error = err;
        } else {
          showAlert("Reset password request is initiated. Please check your email for further instructions.", "success");
          this.router.navigate(['/login']);
        }
      });
    });
  }
}
