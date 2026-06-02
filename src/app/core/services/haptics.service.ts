import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class HapticsService {

  async error() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  async exito() {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
}
