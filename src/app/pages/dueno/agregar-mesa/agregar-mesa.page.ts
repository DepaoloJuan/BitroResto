import { Component, OnInit } from '@angular/core';
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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonModal,
  IonListHeader,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, downloadOutline, cameraOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SupabaseService } from '../../../core/services/supabase';
import * as QRCode from 'qrcode';
import { HapticsService } from '../../../core/services/haptics.service';

@Component({
  selector: 'app-agregar-mesa',
  templateUrl: './agregar-mesa.page.html',
  styleUrls: ['./agregar-mesa.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonIcon,
    IonModal,
    IonListHeader,
  ],
})
export class AgregarMesaPage implements OnInit {
  form = {
    numero: '',
    capacidad: '',
    tipo: '',
    foto: '',
  };

  errores: any = {};
  errorGeneral = '';
  exitoso = false;
  cargando = false;
  mesas: any[] = [];
  modalQRabierto = false;
  mesaSeleccionada: any = null;

  constructor(private supabase: SupabaseService, private haptics: HapticsService) {
    addIcons({ qrCodeOutline, downloadOutline, cameraOutline });
  }

  async ngOnInit() {
    await this.cargarMesas();
  }

  async cargarMesas() {
    const { data } = await this.supabase.client
      .from('mesas')
      .select('*')
      .order('numero', { ascending: true });
    this.mesas = data || [];
  }

  async validar(): Promise<boolean> {
    this.errores = {};

    if (!this.form.numero)
      this.errores.numero = 'El número de mesa es obligatorio.';
    else if (isNaN(Number(this.form.numero)) || Number(this.form.numero) <= 0)
      this.errores.numero = 'El número de mesa debe ser un valor positivo.';

    if (!this.form.capacidad)
      this.errores.capacidad = 'La capacidad es obligatoria.';
    else if (
      isNaN(Number(this.form.capacidad)) ||
      Number(this.form.capacidad) <= 0
    )
      this.errores.capacidad = 'La capacidad debe ser un valor positivo.';

    if (!this.form.tipo)
      this.errores.tipo = 'Debe seleccionar el tipo de mesa.';

    if (!this.form.foto)
      this.errores.foto = 'La foto es obligatoria.';

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

      const { data: mesaExistente } = await this.supabase.client
        .from('mesas')
        .select('id')
        .eq('numero', this.form.numero)
        .single();

      if (mesaExistente) {
        this.errorGeneral = `Ya existe una mesa con el número ${this.form.numero}.`;
        return;
      }

      const { data: mesaNueva, error } = await this.supabase.client
        .from('mesas')
        .insert({
          numero: Number(this.form.numero),
          capacidad: Number(this.form.capacidad),
          tipo: this.form.tipo,
          foto: this.form.foto || null,
          estado: 'disponible',
        })
        .select()
        .single();

      if (error) throw error;

      const qrData = `com.bitroresto.app://cliente/mesa?id=${mesaNueva.id}`;
      const qrUrl = await QRCode.toDataURL(qrData);

      await this.supabase.client
        .from('mesas')
        .update({ qr_codigo: qrUrl })
        .eq('id', mesaNueva.id);

      this.exitoso = true;
      this.form = { numero: '', capacidad: '', tipo: '', foto: '' };
      await this.cargarMesas();
    } catch (error: any) {
      await this.haptics.error();
      this.errorGeneral =
        error.message || 'Ocurrió un error al guardar la mesa.';
    } finally {
      this.cargando = false;
    }
  }

  async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      this.form.foto = foto.dataUrl ?? '';
      this.errores.foto = '';
    } catch (error) {
      // el usuario canceló
    }
  }

  verQR(mesa: any) {
    this.mesaSeleccionada = mesa;
    this.modalQRabierto = true;
  }

  cerrarModal() {
    this.modalQRabierto = false;
    this.mesaSeleccionada = null;
  }

  descargarQR() {
    if (!this.mesaSeleccionada?.qr_codigo) return;
    const link = document.createElement('a');
    link.href = this.mesaSeleccionada.qr_codigo;
    link.download = `qr-mesa-${this.mesaSeleccionada.numero}.png`;
    link.click();
  }
}
