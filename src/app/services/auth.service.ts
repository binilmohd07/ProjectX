import { Injectable } from '@angular/core';

import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User | null = null;

  constructor() {
    auth.onAuthStateChanged((user) => {
      this.user = user;
    });
  }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  logout() {
    return signOut(auth);
  }

  getUser() {
    return this.user;
  }
}
