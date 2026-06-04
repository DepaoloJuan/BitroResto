import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton,
  IonText, IonSpinner, IonButtons, IonBackButton, IonCard,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge, IonIcon, IonModal,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  qrCodeOutline, downloadOutline, cameraOutline, chevronUpOutline, chevronDownOutline,
  starOutline, restaurantOutline, accessibilityOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';
import { Mesa } from '../../../core/models';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-agregar-mesa',
  templateUrl: './agregar-mesa.page.html',
  styleUrls: ['./agregar-mesa.page.scss'],
  imports: [
    TitleCasePipe, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
    IonButton, IonText, IonSpinner, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonBadge,
    IonIcon, IonModal,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarMesaPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly haptics = inject(HapticsService);

  private readonly formVacio = { numero: '', capacidad: '', tipo: '', foto: '' };
  form = { ...this.formVacio };
  errores = signal<Record<string, string>>({});
  errorGeneral = signal('');
  exitoso = signal(false);
  cargando = signal(false);
  mesas = signal<Mesa[]>([]);
  modalQRabierto = signal(false);
  mesaSeleccionada = signal<Mesa | null>(null);

  mostrarMesas = signal(false);

  constructor() {
    addIcons({ qrCodeOutline, downloadOutline, cameraOutline, chevronUpOutline, chevronDownOutline, starOutline, restaurantOutline, accessibilityOutline });
  }

  async ngOnInit() { await this.cargarMesas(); }

  async cargarMesas() {
    const { data } = await this.supabase.client
      .from('mesas').select('*').order('numero', { ascending: true });
    this.mesas.set(data || []);
  }

  async validar(): Promise<boolean> {
    const f = this.form;
    const errs: Record<string, string> = {};
    if (!f.numero) errs['numero'] = 'El número de mesa es obligatorio.';
    else if (isNaN(Number(f.numero)) || Number(f.numero) <= 0) errs['numero'] = 'El número de mesa debe ser un valor positivo.';
    if (!f.capacidad) errs['capacidad'] = 'La capacidad es obligatoria.';
    else if (isNaN(Number(f.capacidad)) || Number(f.capacidad) <= 0) errs['capacidad'] = 'La capacidad debe ser un valor positivo.';
    if (!f.tipo) errs['tipo'] = 'Debe seleccionar el tipo de mesa.';
    if (!f.foto) errs['foto'] = 'La foto es obligatoria.';
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
        .from('mesas').select('id').eq('numero', f.numero).single();
      if (existente) { this.errorGeneral.set(`Ya existe una mesa con el número ${f.numero}.`); return; }
      const { data: mesaNueva, error } = await this.supabase.client
        .from('mesas').insert({
          numero: Number(f.numero), capacidad: Number(f.capacidad),
          tipo: f.tipo, foto: f.foto || null, estado: 'disponible',
        }).select().single();
      if (error) throw error;
      const qrData = `com.bitroresto.app://cliente/mesa?id=${mesaNueva.id}`;
      const qrUrl = await QRCode.toDataURL(qrData);
      await this.supabase.client.from('mesas').update({ qr_codigo: qrUrl }).eq('id', mesaNueva.id);
      this.exitoso.set(true);
      this.form = { ...this.formVacio };
      await this.cargarMesas();
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((e as Error).message || 'Ocurrió un error al guardar la mesa.');
    } finally {
      this.cargando.set(false);
    }
  }

  async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90, allowEditing: false,
        resultType: CameraResultType.DataUrl, source: CameraSource.Camera,
      });
      this.form.foto = foto.dataUrl ?? '';
      this.errores.update(e => ({ ...e, foto: '' }));
    } catch {}
  }

  verQR(mesa: Mesa) { this.mesaSeleccionada.set(mesa); this.modalQRabierto.set(true); }
  cerrarModal() { this.modalQRabierto.set(false); this.mesaSeleccionada.set(null); }

  descargarQR() {
    const mesa = this.mesaSeleccionada();
    if (!mesa?.qr_codigo) return;
    const link = document.createElement('a');
    link.href = mesa.qr_codigo;
    link.download = `qr-mesa-${mesa.numero}.png`;
    link.click();
  }
}
