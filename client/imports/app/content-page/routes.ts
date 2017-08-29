import { Route } from '@angular/router';
import { Meteor } from 'meteor/meteor';


import { ViewPageComponent } from "./view";

export const routes = [
    {path: "about-us", component: ViewPageComponent},
    {path: "terms", component: ViewPageComponent},
    {path: "privacy", component: ViewPageComponent},
    {path: "refund", component: ViewPageComponent},
    {path: "how-to-book", component: ViewPageComponent},
    {path: "partner", component: ViewPageComponent},
];
