import { Routes } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { AuthService } from "../../services/auth";

import { BookingStep1Component } from "./booking-step1.component";
import { BookingStep2Component } from "./booking-step2.component";
import { BookingConfirmComponent } from "./booking-confirm.component";
import { BookingsListComponent } from "./list.component";
import { BookingViewComponent } from "./view.component";
import { CancelBookingComponent } from "./cancel-booking.component";
import { RateTourComponent } from "./rating-form.component";

// Route Configuration
export const routes = [
  { path: 'booking/step1', component: BookingStep1Component, canActivate: [AuthService], data: {'state': 'login'} },
  { path: 'booking/step2', component: BookingStep2Component, canActivate: [AuthService], data: {'state': 'login'} },
  { path: 'booking/confirm', component: BookingConfirmComponent, canActivate: [AuthService], data: {'state': 'login'} },
  { path: 'bookings', component: BookingsListComponent, canActivate: [AuthService], data: {'state': 'login'} },
  { path: 'bookings/view/:id', component: BookingViewComponent, canActivate: [AuthService], data: {'state': 'login'} },
  { path: 'booking/rate/:id', component: RateTourComponent, canActivate: [AuthService], data: {'state': 'login'} },
  { path: 'bookings/cancel/:id', component: CancelBookingComponent, canActivate: [AuthService], data: {'state': 'login'} }
];
