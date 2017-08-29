import { Route } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { AuthService } from "../services/auth";

import { SignupComponent } from "./auth/singup.component";
import { RecoverComponent } from "./auth/recover.component";
import { LoginComponent } from "./auth/login.component";
import { ResendEmailComponent } from "./auth/resend-email.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { ResetPassword } from "./auth/resetpassword";
import { VerifyEmail } from "./auth/verifyemail.component";
import { accountRoutes } from "./account/account.routes";
import { routes as pageRoutes } from "./content-page/routes";
import { routes as faqRoutes } from "./faqs/routes";
import { routes as landingRoutes } from "./landing/routes";
import { routes as toursRoutes } from "./tours/routes";
import { routes as bookingRoutes } from "./bookings/routes";


let mainRoutes = [
    { path: 'profile', component: DashboardComponent, canActivate: [AuthService], data: {'state': 'login'} },
    { path: 'login', component: LoginComponent, canActivate: [AuthService], data: {'state': 'not-login'} },
    { path: 'signup', component: SignupComponent, canActivate: [AuthService], data: {'state': 'not-login'} },
    { path: 'recover', component: RecoverComponent },
    { path: 'reset-password/:token',component: ResetPassword, canActivate: [AuthService], data: {'state': 'not-login'} },
    { path: 'verify-email/:token',component: VerifyEmail, canActivate: [AuthService], data: {'state': 'not-login'} },
    { path: 'resend-email', component: ResendEmailComponent, canActivate: [AuthService], data: {'state': 'not-login'} },
];

export const routes: Route[] = [
    ...mainRoutes,
    ...accountRoutes,
    ...pageRoutes,
    ...faqRoutes,
    ...landingRoutes,
    ...toursRoutes,
    ...bookingRoutes
];

export const ROUTES_PROVIDERS = [
    {
        provide: 'canActivateForLoggedIn',
        useValue: () => !! Meteor.userId()
    },
    {
        provide: 'canActivateForLogoff',
        useValue: () => ! Meteor.userId()
    },
];
