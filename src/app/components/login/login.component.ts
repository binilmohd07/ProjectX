import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { firebaseConfig } from '../../firebase.config';

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
    this.authService.loginWithGoogle().then(async res => {
      this.user = res.user;
      // After Firebase login, also request Google Calendar access
      await this.initGoogleCalendarAuth();
      this.router.navigate(['/dashboard']);
    });
  }

  async initGoogleCalendarAuth() {
    // Load GIS script if not already loaded
    await new Promise((resolve, reject) => {
      if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.oauth2) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject('Failed to load Google Identity Services script');
      document.head.appendChild(script);
    });
    // Load gapi client
    const gapi = (window as any).gapi;
    await new Promise<void>((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: firebaseConfig.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
    // Setup GIS client and request access token
    const gisClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: firebaseConfig.clientId,
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          gapi.client.setToken({ access_token: tokenResponse.access_token });
          // Optionally store token in localStorage/sessionStorage if needed
        }
      }
    });
    gisClient.requestAccessToken();
  }
}
