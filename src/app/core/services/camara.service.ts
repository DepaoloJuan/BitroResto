import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';

@Injectable({ providedIn: 'root' })
export class CamaraService {
  async tomarFoto(): Promise<string> {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: 'dataUrl',
      source: 'camera',
    } as any);
    return photo.dataUrl ?? '';
  }
}
