import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserService } from "./user";
import { AuthService } from "./auth";
import { CurrencyService } from "./currency";

export const Services_Providers = [
    UserService,
    AuthService,
    CurrencyService
];
