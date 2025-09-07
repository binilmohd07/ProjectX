import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  user: any;
  signInWithGoogle() {
    this.authService.loginWithGoogle().then(res => {
      this.user = res.user;
      // this.router.navigate(['/dashboard']);
      this.router.navigate(['/finance']);

    });
  }
}
