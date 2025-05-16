// src/app/guards/login.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { auth } from '../../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(): Promise<boolean> {
    return new Promise(resolve => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.router.navigate(['/dashboard']);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}
