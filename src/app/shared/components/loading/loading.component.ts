import { ChangeDetectionStrategy, Component } from '@angular/core';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading',
  imports: [IonSpinner],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('5000ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('5000ms ease-in', keyframes([
          style({ opacity: 1, transform: 'rotate(0deg)',   offset: 0 }),
          style({ opacity: 0, transform: 'rotate(180deg)', offset: 1 }),
        ])),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {}