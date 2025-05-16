import {
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { auth } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(): Promise<boolean | UrlTree> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          resolve(true);
        } else {
          resolve(this.router.createUrlTree(['/login']));
        }
      });
    });
  }
}
