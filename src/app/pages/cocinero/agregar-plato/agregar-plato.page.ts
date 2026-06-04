import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton,
  IonText, IonSpinner, IonButtons, IonBackButton, IonTextarea, IonGrid, IonRow, IonCol,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, nutritionOutline, restaurantOutline, iceCreamOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';
import { FormProducto } from '../../../core/models';

@Component({
  selector: 'app-agregar-plato',
  templateUrl: './agregar-plato.page.html',
  styleUrls: ['./agregar-plato.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
    IonButton, IonText, IonSpinner, IonButtons, IonBackButton, IonTextarea, IonGrid,
    IonRow, IonCol, IonIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarPlatoPage {
  private readonly supabase = inject(SupabaseService);
  private readonly haptics = inject(HapticsService);

  private readonly formVacio: FormProducto = { nombre: '', descripcion: '', tiempo_elaboracion: '', precio: '', fotos: ['', '', ''], categoria: '' };
  form: FormProducto = { ...this.formVacio, fotos: ['', '', ''] };
  errores = signal<Record<string, string>>({});
  errorGeneral = signal('');
  exitoso = signal(false);
  cargando = signal(false);

  constructor() { addIcons({ cameraOutline, nutritionOutline, restaurantOutline, iceCreamOutline }); }

  async seleccionarFoto(index: number) {
    try {
      const foto = await Camera.getPhoto({
        quality: 90, allowEditing: false,
        resultType: CameraResultType.DataUrl, source: CameraSource.Prompt,
      });
      this.form.fotos[index] = foto.dataUrl ?? '';
      this.errores.update(e => ({ ...e, fotos: '' }));
    } catch {}
  }

  async validar(): Promise<boolean> {
    const f = this.form;
    const errs: Record<string, string> = {};
    if (!f.nombre.trim()) errs['nombre'] = 'El nombre es obligatorio.';
    if (!f.descripcion.trim()) errs['descripcion'] = 'La descripción es obligatoria.';
    if (!f.tiempo_elaboracion) errs['tiempo_elaboracion'] = 'El tiempo de elaboración es obligatorio.';
    else if (Number(f.tiempo_elaboracion) <= 0) errs['tiempo_elaboracion'] = 'El tiempo debe ser mayor a cero.';
    if (!f.precio) errs['precio'] = 'El precio es obligatorio.';
    else if (Number(f.precio) <= 0) errs['precio'] = 'El precio debe ser mayor a cero.';
    if (!f.categoria) errs['categoria'] = 'La categoría es obligatoria.';
    if (!f.fotos.every(fo => fo.trim())) errs['fotos'] = 'Las 3 fotos del plato son obligatorias.';
    this.errores.set(errs);
    if (Object.keys(errs).length > 0) { await this.haptics.error(); return false; }
    return true;
  }

  async guardar() {
    this.errorGeneral.set('');
    this.exitoso.set(false);
    if (!await this.validar()) return;
    try {
      this.cargando.set(true);
      const f = this.form;
      const { data: existente } = await this.supabase.client
        .from('platos').select('id').ilike('nombre', f.nombre.trim()).single();
      if (existente) { this.errorGeneral.set(`Ya existe un plato llamado "${f.nombre}".`); return; }
      const { error } = await this.supabase.client.from('platos').insert({
        nombre: f.nombre.trim(), descripcion: f.descripcion.trim(),
        tiempo_elaboracion: Number(f.tiempo_elaboracion), precio: Number(f.precio),
        categoria: f.categoria,
        foto1: f.fotos[0] || null, foto2: f.fotos[1] || null, foto3: f.fotos[2] || null,
      });
      if (error) throw error;
      this.exitoso.set(true);
      this.form = { ...this.formVacio, fotos: ['', '', ''] };
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((e as Error).message || 'Ocurrió un error al guardar el plato.');
    } finally {
      this.cargando.set(false);
    }
  }
}
