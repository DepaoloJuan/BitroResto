import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonListHeader,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';

@Component({
  selector: 'app-agregar-bebida',
  templateUrl: './agregar-bebida.page.html',
  styleUrls: ['./agregar-bebida.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonTextarea,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonListHeader,
  ],
})
export class AgregarBebidaPage {
  form = {
    nombre: '',
    descripcion: '',
    tiempo_elaboracion: '',
    precio: '',
    fotos: ['', '', ''],
  };

  errores: any = {};
  errorGeneral = '';
  exitoso = false;
  cargando = false;

  constructor(private supabase: SupabaseService, private haptics: HapticsService) {
    addIcons({ cameraOutline });
  }

  async seleccionarFoto(index: number) {
    try {
      const foto = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      });
      this.form.fotos[index] = foto.dataUrl ?? '';
      this.errores.fotos = '';
    } catch (error) {
      // el usuario canceló, no mostrar nada
    }
  }

  async validar(): Promise<boolean> {
    this.errores = {};

    if (!this.form.nombre.trim())
      this.errores.nombre = 'El nombre es obligatorio.';

    if (!this.form.descripcion.trim())
      this.errores.descripcion = 'La descripción es obligatoria.';

    if (!this.form.tiempo_elaboracion)
      this.errores.tiempo_elaboracion =
        'El tiempo de elaboración es obligatorio.';
    else if (Number(this.form.tiempo_elaboracion) <= 0)
      this.errores.tiempo_elaboracion = 'El tiempo debe ser mayor a cero.';

    if (!this.form.precio) this.errores.precio = 'El precio es obligatorio.';
    else if (Number(this.form.precio) <= 0)
      this.errores.precio = 'El precio debe ser mayor a cero.';

    const fotosValidas = this.form.fotos.filter((f) => f.trim() !== '');
    if (fotosValidas.length === 0)
      this.errores.fotos = 'Debe ingresar al menos una foto.';

    if (Object.keys(this.errores).length > 0) {
      await this.haptics.error();
      return false;
    }
    return true;
  }

  async guardar() {
    this.errorGeneral = '';
    this.exitoso = false;

    if (!await this.validar()) return;

    try {
      this.cargando = true;

      const { data: bebidaExistente } = await this.supabase.client
        .from('bebidas')
        .select('id')
        .ilike('nombre', this.form.nombre.trim())
        .single();

      if (bebidaExistente) {
        this.errorGeneral = `Ya existe una bebida llamada "${this.form.nombre}".`;
        return;
      }

      const { error } = await this.supabase.client.from('bebidas').insert({
        nombre: this.form.nombre.trim(),
        descripcion: this.form.descripcion.trim(),
        tiempo_elaboracion: Number(this.form.tiempo_elaboracion),
        precio: Number(this.form.precio),
        foto1: this.form.fotos[0] || null,
        foto2: this.form.fotos[1] || null,
        foto3: this.form.fotos[2] || null,
      });

      if (error) throw error;

      this.exitoso = true;
      this.form = {
        nombre: '',
        descripcion: '',
        tiempo_elaboracion: '',
        precio: '',
        fotos: ['', '', ''],
      };
    } catch (error: any) {
      await this.haptics.error();
      this.errorGeneral =
        error.message || 'Ocurrió un error al guardar la bebida.';
    } finally {
      this.cargando = false;
    }
  }
}
