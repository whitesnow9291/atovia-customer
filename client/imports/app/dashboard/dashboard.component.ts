import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { Meteor } from "meteor/meteor";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators as CValidators } from "ng2-validation";
import { InjectUser } from "angular2-meteor-accounts-ui";
import { Router } from '@angular/router';
import { MeteorComponent } from 'angular2-meteor';
import { Title } from '@angular/platform-browser';
import { User } from "../../../../both/models/user.model";
import { Place } from "../../../../both/models/place.model";
import { upload } from '../../../../both/methods/images.methods';
import { showAlert } from "../shared/show-alert";
import * as _ from 'underscore';
import { validateEmail, validatePassword, validatePhoneNum, validateFirstName } from "../../validators/common";
import template from "./dashboard.html";

@Component({
  selector: "dashboard",
  template
})
@InjectUser('user')
export class DashboardComponent extends MeteorComponent implements OnInit, AfterViewInit {
  accountForm: FormGroup;
  userId: string;
  oldEmailAddress: string;
  error: string;
  user: User;
  isUploading: boolean = false;
  isUploaded: boolean = false;
  searchString: string;

  constructor(private router: Router, private zone: NgZone, private titleService: Title, private formBuilder: FormBuilder) {
    super();
    if (! Meteor.userId()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.titleService.setTitle("Profile | Atorvia");
    if (! Meteor.userId()) {
      return;
    }
    this.userId = Meteor.userId();
    this.accountForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(50), CValidators.email])],
      firstName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])],
      middleName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])],
      lastName: ['', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(30), validateFirstName])],
      phoneNum: ['', Validators.compose([Validators.required, Validators.minLength(7), Validators.maxLength(15), validatePhoneNum])],
    });
    let self = this;
    let callback = (user) => {
      //console.log("user:", user);
      self.accountForm.controls['firstName'].setValue(user.profile.firstName);
      self.accountForm.controls['middleName'].setValue(user.profile.middleName);
      self.accountForm.controls['lastName'].setValue(user.profile.lastName);
      self.accountForm.controls['email'].setValue(user.emails[0].address);
      self.accountForm.controls['phoneNum'].setValue(user.profile.contact);
      self.oldEmailAddress = user.emails[0].address;
    };
    this.fetchUser(callback);
  }

  // find logged-in user data as not available page-load on client
  private fetchUser(callback) {
    //console.log("call users.findOne()")
    this.call("users.findOne", (err, res) => {
      if (err) {
        return;
      }
      //console.log("users.findOne():", res);
      callback(res);
    });
  }

  ngAfterViewInit() {
    Meteor.setTimeout(() => {
      jQuery(function($){
      })
    }, 500);
  }

  //update user from dashboard
    update() {
    let fullName = this.accountForm.value.firstName;
    if(this.accountForm.value.middleName) {
      fullName  = fullName + " " + this.accountForm.value.middleName;
    }
    fullName = fullName + " " + this.accountForm.value.lastName;
    let userData = {
      "profile.firstName": this.accountForm.value.firstName,
      "profile.middleName": this.accountForm.value.middleName,
      "profile.lastName": this.accountForm.value.lastName,
      "profile.contact": this.accountForm.value.phoneNum,
      "profile.fullName": fullName
    };
    let emailAddress = {
      oldAddress: this.oldEmailAddress,
      newAddress: this.accountForm.value.email
    };

    this.error = null;
    this.call("users.update", userData, emailAddress, (err, res) => {
      this.zone.run(() => {
        if(err) {
          this.error = err;
        } else {
          this.oldEmailAddress = emailAddress.newAddress;
          showAlert("Your profile has been updated successfully.", "success");
          this.router.navigate(['/profile']);
        }
      });
    });
  }

  onFileSelect(event) {
    var files = event.srcElement.files;
    this.startUpload(files[0]);
  }


  private startUpload(file: File): void {
    // check for previous upload
    if (this.isUploading === true) {
      console.log("aleady uploading...");
      return;
    }

    // start uploading
    this.isUploaded = false;
    //console.log('file uploading...');
    this.isUploading = true;

    upload(file)
    .then((res) => {
      this.isUploading = false;
      this.isUploaded = true;
      let userImage = {
           id: res._id,
           url: res.path,
           name: res.name
      };
      let userData = {
        "profile.image": userImage
      };
      this.call("users.update", userData, (err, res) => {
        if (err) {
          console.log("Error while updating user picture");
          return;
        }
        $("#inputFile").val("");
        this.user.profile.image = userImage;
        showAlert("Profile picture updated successfully.", "success");
      });
    })
    .catch((error) => {
      this.isUploading = false;
      console.log('Error in file upload:', error);
      showAlert(error.reason, "danger");
    });
  }
}
