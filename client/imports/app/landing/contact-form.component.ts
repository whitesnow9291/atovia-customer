import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Accounts } from 'meteor/accounts-base';
import { MeteorComponent } from 'angular2-meteor';
import { showAlert } from "../shared/show-alert";
import { validateEmail, validatePassword, validatePhoneNum, validateFirstName } from "../../validators/common";
import template from './contact-form.component.html';

@Component({
  selector: 'signup',
  template
})
export class ContactFormComponent extends MeteorComponent implements OnInit {
  contactForm: FormGroup;
  constructor(private router: Router, private titleService: Title, private zone: NgZone, private formBuilder: FormBuilder) {
    super();
  }

  ngOnInit() {
    this.titleService.setTitle("Contact Us | Atorvia");
    this.contactForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(50), validateEmail])],
      fullName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])],
      phoneNum: ['', Validators.compose([Validators.minLength(7), Validators.maxLength(15), validatePhoneNum])],
      message: ['', Validators.compose([Validators.required, Validators.minLength(10), Validators.maxLength(300)])]
    });
  }

  sendQuery() {
    let subject = "Thank you for contacting us.";
    let message = "We have received your email and we will get back to you asap. Thank you!";
    let email = this.contactForm.value.email;
    this.call("sendEmail", email, subject, message, (err, res) => {
      if (! err) {
        this.zone.run(() => {
          showAlert("Your message has been received. Someone from our team will contact you soon.", "success");
          this.router.navigate(['/']);
        });
      } else {
        console.log("Error while sending email.", err);
      }
    })
  }

}
