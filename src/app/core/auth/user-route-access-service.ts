import { Injectable, isDevMode } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";

import { Principal } from "../";
import { StateStorageService } from "./state-storage.service";
import { RouterExtensions } from "nativescript-angular";

@Injectable({ providedIn: "root" })
export class UserRouteAccessService implements CanActivate {
    constructor(
        private router: Router,
        private routerExtensions: RouterExtensions,
        private principal: Principal,
        private stateStorageService: StateStorageService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {

        // route.data["authorities"] --> si hay error dejar esta linea
        const authorities = route.data.authorities;
        // We need to call the checkLogin / and so the principal.identity() function, to ensure,
        // that the client has a principal too, if they already logged in by the server.
        // This could happen on a page refresh.

        return this.checkLogin(authorities, state.url);
    }

    checkLogin(authorities: Array<string>, url: string): Promise<boolean> {
        const principal = this.principal;

        return Promise.resolve(
            principal.identity().then((account) => {
                if (!authorities || authorities.length === 0) {
                    return true;
                }

                if (account) {
                    return principal.hasAnyAuthority(authorities).then((response) => {
                        if (response) {
                            return true;
                        }
                        if (isDevMode()) {
                            console.error("User has not any of required authorities: ", authorities);
                        }

                        return false;
                    });
                }

                this.stateStorageService.storeUrl(url);
                this.routerExtensions.navigate(["/muro"]).then(() => {
                    // only show the login dialog, if the user hasn"t logged in yet
                    if (!account) {
                        // this.routerExtensions.navigate(["home"]);
                    }
                });

                return false;
            })
        );
    }
}
