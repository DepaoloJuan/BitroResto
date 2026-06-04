import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading',
  imports: [IonSpinner],
  template: `
    <div class="loading-wrapper">
      <img src="assets/img/logo_2.png" class="loading-logo" alt="Logo" />
      <ion-spinner name="crescent" color="primary"></ion-spinner>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    .loading-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px;
    }
    .loading-logo { width: 64px; height: 64px; border-radius: 14px; opacity: 0.9; }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.92)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('600ms ease-in', style({ opacity: 0, transform: 'scale(0.92)' })),
      ]),
    ]),
  ],
  host: { '[@fadeInOut]': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {}
