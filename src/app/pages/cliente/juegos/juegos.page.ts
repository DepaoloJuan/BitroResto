import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonButtons, IonBackButton,
  IonBadge, IonModal, IonItem, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { giftOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';

interface CartaMemoria {
  id: number;
  emoji: string;
  volteada: boolean;
  encontrada: boolean;
}

interface PreguntaTrivia {
  pregunta: string;
  opciones: string[];
  respuesta: string;
}

@Component({
  selector: 'app-juegos',
  templateUrl: './juegos.page.html',
  styleUrls: ['./juegos.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonButtons, IonBackButton,
    IonBadge, IonModal, IonItem, IonLabel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JuegosPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  pedidoId = signal<string | null>(null);
  descuentoObtenido = signal(0);
  juegosJugados = signal<string[]>([]);

  modalMemoria = signal(false);
  cartasMemoria = signal<CartaMemoria[]>([]);
  intentosMemoria = signal(0);
  mensajeMemoria = signal('');
  private cartasVolteadas: CartaMemoria[] = [];
  private primerIntentoMemoria = true;

  modalAhorcado = signal(false);
  palabraSecreta = signal('');
  palabraMostrada = signal<string[]>([]);
  letrasUsadas = signal<string[]>([]);
  erroresAhorcado = signal(0);
  mensajeAhorcado = signal('');
  private primerIntentoAhorcado = true;
  readonly abecedario = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

  modalPregunta = signal(false);
  preguntaActual = signal<PreguntaTrivia | null>(null);
  respondida = signal(false);
  mensajePregunta = signal('');

  private readonly emojis = ['🍕', '🍔', '🍣', '🍜', '🍰', '🥗', '🍷', '🥩'];
  private readonly palabras = ['PIZZA', 'MILANESA', 'EMPANADA', 'HAMBURGUESA', 'ENSALADA'];
  private readonly preguntas: PreguntaTrivia[] = [
    { pregunta: '¿En qué año se fundó la ciudad de Buenos Aires?', opciones: ['1536', '1580', '1620', '1776'], respuesta: '1580' },
    { pregunta: '¿Cuál es el río más largo de Argentina?', opciones: ['Paraná', 'Uruguay', 'Colorado', 'Negro'], respuesta: 'Paraná' },
    { pregunta: '¿Cuántos jugadores tiene un equipo de fútbol?', opciones: ['9', '10', '11', '12'], respuesta: '11' },
  ];

  constructor() { addIcons({ giftOutline }); }

  async ngOnInit() {
    await this.cargarPedidoActual();
    await this.cargarDescuento();
  }

  async cargarPedidoActual() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data: espera } = await this.supabase.client
      .from('lista_espera').select('mesa_id').eq('usuario_id', usuario.id).eq('estado', 'asignado').single();
    if (!espera?.mesa_id) return;
    const { data: pedido } = await this.supabase.client
      .from('pedidos').select('id').eq('mesa_id', espera.mesa_id)
      .not('estado', 'in', '("pagado","cancelado")').order('fecha_creacion', { ascending: false }).limit(1).single();
    this.pedidoId.set(pedido?.id || null);
  }

  async cargarDescuento() {
    const pid = this.pedidoId();
    if (!pid) return;
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('descuentos').select('*').eq('usuario_id', usuario.id).eq('pedido_id', pid)
      .order('fecha', { ascending: false }).limit(1).single();
    if (data) {
      this.descuentoObtenido.set(data.porcentaje);
      this.juegosJugados.set([data.juego]);
    }
  }

  juegoJugado(juego: string): boolean {
    return this.juegosJugados().includes(juego);
  }

  // ---- MEMORIA ----
  jugarMemoria() {
    this.primerIntentoMemoria = true;
    this.cartasVolteadas = [];
    this.intentosMemoria.set(0);
    this.mensajeMemoria.set('');
    const pares = [...this.emojis, ...this.emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i): CartaMemoria => ({ id: i, emoji, volteada: false, encontrada: false }));
    this.cartasMemoria.set(pares);
    this.modalMemoria.set(true);
  }

  voltearCarta(carta: CartaMemoria) {
    if (carta.volteada || carta.encontrada || this.cartasVolteadas.length === 2) return;
    this.cartasMemoria.update(cs => cs.map(c => c.id === carta.id ? { ...c, volteada: true } : c));
    const cartaActualizada = this.cartasMemoria().find(c => c.id === carta.id)!;
    this.cartasVolteadas.push(cartaActualizada);
    if (this.cartasVolteadas.length === 2) {
      this.intentosMemoria.update(v => v + 1);
      setTimeout(() => this.verificarPar(), 800);
    }
  }

  private verificarPar() {
    const [a, b] = this.cartasVolteadas;
    if (a.emoji === b.emoji) {
      this.cartasMemoria.update(cs => cs.map(c => (c.id === a.id || c.id === b.id) ? { ...c, encontrada: true } : c));
    } else {
      this.cartasMemoria.update(cs => cs.map(c => (c.id === a.id || c.id === b.id) ? { ...c, volteada: false } : c));
      if (this.primerIntentoMemoria) this.primerIntentoMemoria = false;
    }
    this.cartasVolteadas = [];
    const gano = this.cartasMemoria().every(c => c.encontrada);
    if (gano) {
      if (this.intentosMemoria() === this.emojis.length) {
        this.mensajeMemoria.set('¡Ganaste en el primer intento! +10% de descuento');
        this.guardarDescuento(10, 'memoria');
      } else {
        this.mensajeMemoria.set('¡Completaste el juego! Sin descuento (no fue en el primer intento)');
      }
    }
  }

  // ---- AHORCADO ----
  jugarAhorcado() {
    const palabra = this.palabras[Math.floor(Math.random() * this.palabras.length)];
    this.palabraSecreta.set(palabra);
    this.palabraMostrada.set(Array(palabra.length).fill('_'));
    this.letrasUsadas.set([]);
    this.erroresAhorcado.set(0);
    this.mensajeAhorcado.set('');
    this.primerIntentoAhorcado = true;
    this.modalAhorcado.set(true);
  }

  adivinarLetra(letra: string) {
    if (this.letrasUsadas().includes(letra)) return;
    this.letrasUsadas.update(ls => [...ls, letra]);
    const secreto = this.palabraSecreta();
    if (secreto.includes(letra)) {
      this.palabraMostrada.update(mostrada =>
        mostrada.map((l, i) => secreto[i] === letra ? letra : l)
      );
      const gano = !this.palabraMostrada().includes('_');
      if (gano) {
        if (this.primerIntentoAhorcado) {
          this.mensajeAhorcado.set('¡Ganaste en el primer intento! +15% de descuento');
          this.guardarDescuento(15, 'ahorcado');
        } else {
          this.mensajeAhorcado.set('¡Adivinaste la palabra! Sin descuento');
        }
      }
    } else {
      this.erroresAhorcado.update(v => v + 1);
      this.primerIntentoAhorcado = false;
      if (this.erroresAhorcado() >= 6) {
        this.mensajeAhorcado.set(`Perdiste. La palabra era: ${secreto}`);
      }
    }
  }

  getColorLetra(letra: string): string {
    if (!this.letrasUsadas().includes(letra)) return 'primary';
    return this.palabraSecreta().includes(letra) ? 'success' : 'danger';
  }

  // ---- PREGUNTA ----
  jugarPregunta() {
    this.preguntaActual.set(this.preguntas[Math.floor(Math.random() * this.preguntas.length)]);
    this.respondida.set(false);
    this.mensajePregunta.set('');
    this.modalPregunta.set(true);
  }

  responderPregunta(opcion: string) {
    this.respondida.set(true);
    const pregunta = this.preguntaActual();
    if (!pregunta) return;
    if (opcion === pregunta.respuesta) {
      this.mensajePregunta.set('¡Correcto! +20% de descuento');
      this.guardarDescuento(20, 'pregunta');
    } else {
      this.mensajePregunta.set(`Incorrecto. La respuesta era: ${pregunta.respuesta}`);
    }
  }

  private async guardarDescuento(porcentaje: number, juego: string) {
    if (this.descuentoObtenido() > 0) return;
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { error } = await this.supabase.client.from('descuentos').insert({
      usuario_id: usuario.id, pedido_id: this.pedidoId(), porcentaje, juego,
    });
    if (!error) {
      this.descuentoObtenido.set(porcentaje);
      this.juegosJugados.update(js => [...js, juego]);
    }
  }

  cerrarModal() {
    this.modalMemoria.set(false);
    this.modalAhorcado.set(false);
    this.modalPregunta.set(false);
    this.router.navigate(['/cliente/mesa'], { replaceUrl: true });
  }
}
