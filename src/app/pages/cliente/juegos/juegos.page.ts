import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonBadge,
  IonModal,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { giftOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-juegos',
  templateUrl: './juegos.page.html',
  styleUrls: ['./juegos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonBadge,
    IonModal,
    IonItem,
    IonLabel,
  ],
})
export class JuegosPage implements OnInit {
  usuario: any;
  pedidoId: string | null = null;
  descuentoObtenido = 0;
  juegosJugados: string[] = [];

  // Memoria
  modalMemoria = false;
  cartasMemoria: any[] = [];
  cartasVolteadas: any[] = [];
  intentosMemoria = 0;
  mensajeMemoria = '';
  primerIntento = true;

  // Ahorcado
  modalAhorcado = false;
  palabraSecreta = '';
  palabraMostrada: string[] = [];
  letrasUsadas: string[] = [];
  erroresAhorcado = 0;
  mensajeAhorcado = '';
  abecedario = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

  // Pregunta
  modalPregunta = false;
  preguntaActual: any = null;
  respondida = false;
  mensajePregunta = '';

  private emojis = ['🍕', '🍔', '🍣', '🍜', '🍰', '🥗', '🍷', '🥩'];
  private palabras = [
    'PIZZA',
    'MILANESA',
    'EMPANADA',
    'HAMBURGUESA',
    'ENSALADA',
  ];
  private preguntas = [
    {
      pregunta: '¿En qué año se fundó la ciudad de Buenos Aires?',
      opciones: ['1536', '1580', '1620', '1776'],
      respuesta: '1580',
    },
    {
      pregunta: '¿Cuál es el río más largo de Argentina?',
      opciones: ['Paraná', 'Uruguay', 'Colorado', 'Negro'],
      respuesta: 'Paraná',
    },
    {
      pregunta: '¿Cuántos jugadores tiene un equipo de fútbol?',
      opciones: ['9', '10', '11', '12'],
      respuesta: '11',
    },
  ];

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
  ) {
    addIcons({ giftOutline });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.cargarPedidoActual();
    await this.cargarDescuento();
  }

  async cargarPedidoActual() {
    const mesaData = await this.supabase.client
      .from('lista_espera')
      .select('mesa_id')
      .eq('usuario_id', this.usuario.id)
      .eq('estado', 'asignado')
      .single();

    if (!mesaData.data?.mesa_id) return;

    const pedidoData = await this.supabase.client
      .from('pedidos')
      .select('id')
      .eq('mesa_id', mesaData.data.mesa_id)
      .not('estado', 'in', '("pagado","cancelado")')
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single();

    this.pedidoId = pedidoData.data?.id || null;
  }

  async cargarDescuento() {
    if (!this.pedidoId) return;

    const { data } = await this.supabase.client
      .from('descuentos')
      .select('*')
      .eq('usuario_id', this.usuario.id)
      .eq('pedido_id', this.pedidoId)
      .order('fecha', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      this.descuentoObtenido = data.porcentaje;
      this.juegosJugados = [data.juego];
    }
  }

  juegoJugado(juego: string): boolean {
    return this.descuentoObtenido > 0 && !this.juegosJugados.includes(juego)
      ? false
      : this.juegosJugados.includes(juego);
  }

  // ---- MEMORIA ----
  jugarMemoria() {
    this.primerIntento = true;
    this.intentosMemoria = 0;
    this.mensajeMemoria = '';
    this.cartasVolteadas = [];
    const pares = [...this.emojis, ...this.emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({
        id: i,
        emoji,
        volteada: false,
        encontrada: false,
      }));
    this.cartasMemoria = pares;
    this.modalMemoria = true;
  }

  voltearCarta(carta: any) {
    if (carta.volteada || carta.encontrada || this.cartasVolteadas.length === 2)
      return;
    carta.volteada = true;
    this.cartasVolteadas.push(carta);

    if (this.cartasVolteadas.length === 2) {
      this.intentosMemoria++;
      setTimeout(() => this.verificarPar(), 800);
    }
  }

  verificarPar() {
    const [a, b] = this.cartasVolteadas;
    if (a.emoji === b.emoji) {
      a.encontrada = b.encontrada = true;
    } else {
      a.volteada = b.volteada = false;
      if (this.primerIntento) this.primerIntento = false;
    }
    this.cartasVolteadas = [];

    const ganó = this.cartasMemoria.every((c) => c.encontrada);
    if (ganó) {
      if (this.intentosMemoria === this.emojis.length) {
        this.mensajeMemoria =
          '¡Ganaste en el primer intento! +10% de descuento';
        this.guardarDescuento(10, 'memoria');
      } else {
        this.mensajeMemoria =
          '¡Completaste el juego! Sin descuento (no fue en el primer intento)';
      }
    }
  }

  // ---- AHORCADO ----
  jugarAhorcado() {
    this.palabraSecreta =
      this.palabras[Math.floor(Math.random() * this.palabras.length)];
    this.palabraMostrada = Array(this.palabraSecreta.length).fill('_');
    this.letrasUsadas = [];
    this.erroresAhorcado = 0;
    this.mensajeAhorcado = '';
    this.primerIntento = true;
    this.modalAhorcado = true;
  }

  adivinarLetra(letra: string) {
    if (this.letrasUsadas.includes(letra)) return;
    this.letrasUsadas.push(letra);

    if (this.palabraSecreta.includes(letra)) {
      this.palabraSecreta.split('').forEach((l, i) => {
        if (l === letra) this.palabraMostrada[i] = letra;
      });
      const ganó = !this.palabraMostrada.includes('_');
      if (ganó) {
        if (this.primerIntento) {
          this.mensajeAhorcado =
            '¡Ganaste en el primer intento! +15% de descuento';
          this.guardarDescuento(15, 'ahorcado');
        } else {
          this.mensajeAhorcado = '¡Adivinaste la palabra! Sin descuento';
        }
      }
    } else {
      this.erroresAhorcado++;
      this.primerIntento = false;
      if (this.erroresAhorcado >= 6) {
        this.mensajeAhorcado = `Perdiste. La palabra era: ${this.palabraSecreta}`;
      }
    }
  }

  getColorLetra(letra: string): string {
    if (!this.letrasUsadas.includes(letra)) return 'primary';
    return this.palabraSecreta.includes(letra) ? 'success' : 'danger';
  }

  // ---- PREGUNTA ----
  jugarPregunta() {
    this.preguntaActual =
      this.preguntas[Math.floor(Math.random() * this.preguntas.length)];
    this.respondida = false;
    this.mensajePregunta = '';
    this.modalPregunta = true;
  }

  responderPregunta(opcion: string) {
    this.respondida = true;
    if (opcion === this.preguntaActual.respuesta) {
      this.mensajePregunta = '¡Correcto! +20% de descuento';
      this.guardarDescuento(20, 'pregunta');
    } else {
      this.mensajePregunta = `Incorrecto. La respuesta era: ${this.preguntaActual.respuesta}`;
    }
  }

  async guardarDescuento(porcentaje: number, juego: string) {
    if (this.descuentoObtenido > 0) return;

    const { error } = await this.supabase.client.from('descuentos').insert({
      usuario_id: this.usuario.id,
      pedido_id: this.pedidoId,
      porcentaje,
      juego,
    });

    if (!error) {
      this.descuentoObtenido = porcentaje;
      this.juegosJugados.push(juego);
    }
  }

  cerrarModal() {
    this.modalMemoria = false;
    this.modalAhorcado = false;
    this.modalPregunta = false;
  }
}
