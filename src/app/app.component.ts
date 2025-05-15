import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ProjectX';
  user: any;

  constructor(private authService: AuthService) {
    // this.user = this.authService.getUser();
    // // Optional: Update user on auth state change
    // authService.loginWithGoogle().then(res => {
    //   this.user = res.user;
    // });
  }

  login() {
    this.authService.loginWithGoogle().then(res => {
      this.user = res.user;
    });
  }


}
