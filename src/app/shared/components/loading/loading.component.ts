import { Component } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [IonSpinner],
  template: `
    <div class="loading-wrapper">
      <img src="assets/img/logo_2.png" class="loading-logo" alt="Logo" />
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  `,
  styles: [
    `
      .loading-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 32px;
      }
      .loading-logo {
        width: 64px;
        height: 64px;
        border-radius: 14px;
        opacity: 0.9;
      }
    `,
  ],
})
export class LoadingComponent {}
