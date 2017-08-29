import { Route } from '@angular/router';
import { Meteor } from 'meteor/meteor';

import { SearchComponent } from "./search.component";
import { TourViewComponent } from "./view.component";
import { DestinationComponent } from "./destination.component";

export const routes = [
    {path: "tours/search", component: SearchComponent},
    {path: "tours/search/:query", component: SearchComponent},
    {path: "tours/destination/:slug", component: SearchComponent},
    {path: "tours/:name", component: TourViewComponent}
];
