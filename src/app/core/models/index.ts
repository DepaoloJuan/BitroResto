export type Perfil =
  | 'dueño'
  | 'supervisor'
  | 'metre'
  | 'mozo'
  | 'cocinero'
  | 'cantinero'
  | 'bartender'
  | 'cliente'
  | 'anonimo';

export type EstadoUsuario = 'pendiente' | 'aprobado' | 'rechazado';

export interface Usuario {
  id: string;
  auth_id: string;
  nombre: string;
  apellido: string;
  dni: string;
  cuil?: string;
  email: string;
  perfil: Perfil;
  foto?: string | null;
  estado: EstadoUsuario;
  fecha_registro?: string;
  // Para usuarios anónimos
  mesa_id?: string;
  lista_espera_id?: string;
}

export type EstadoMesa = 'disponible' | 'ocupada' | 'reservada';
export type TipoMesa = 'normal' | 'vip' | 'entrada' | 'propinas';

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  tipo: TipoMesa;
  estado: EstadoMesa;
  foto?: string | null;
  qr_codigo?: string | null;
}

export type EstadoListaEspera = 'esperando' | 'asignado' | 'finalizado';
export type TipoCliente = 'registrado' | 'anonimo';

export interface ListaEspera {
  id: string;
  usuario_id?: string;
  nombre: string;
  foto?: string | null;
  tipo_cliente: TipoCliente;
  estado: EstadoListaEspera;
  mesa_id?: string;
  fecha_ingreso?: string;
  mesas?: Mesa;
}

export type EstadoPedido =
  | 'esperando_mozo'
  | 'rechazado_mozo'
  | 'en_cocina'
  | 'listo'
  | 'entregado'
  | 'recibido'
  | 'pago_solicitado'
  | 'pagado'
  | 'cancelado';

export type EstadoItem = 'pendiente' | 'listo';
export type TipoItem = 'platos' | 'bebidas';

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  tipo: TipoItem;
  nombre: string;
  precio: number;
  cantidad: number;
  tiempo_elaboracion: number;
  estado: EstadoItem;
}

export interface Pedido {
  id: string;
  mesa_id: string;
  usuario_id?: string;
  estado: EstadoPedido;
  total: number;
  propina?: number;
  descuento?: number;
  fecha_creacion: string;
  pedido_items?: PedidoItem[];
  mesas?: Pick<Mesa, 'numero'>;
}

export interface Plato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_elaboracion: number;
  foto1?: string | null;
  foto2?: string | null;
  foto3?: string | null;
}

export interface Bebida {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_elaboracion: number;
  foto1?: string | null;
  foto2?: string | null;
  foto3?: string | null;
}

export type Producto = (Plato | Bebida) & { _tipo: TipoItem; _cantidad: number };

export interface Consulta {
  id: string;
  mesa_id: string;
  usuario_id?: string;
  nombre_remitente: string;
  mensaje: string;
  tipo: 'cliente' | 'mozo';
  fecha: string;
}

export interface Encuesta {
  encuesta_id: number;
  usuario_id: string;
  mesa_id: string;
  atencion_puntaje: number;
  comida_puntaje: number;
  ambiente_puntaje: number;
  volveria: 'si' | 'tal_vez' | 'no';
  fecha: string;
}

export interface Descuento {
  id: string;
  usuario_id: string;
  pedido_id: string;
  porcentaje: number;
  juego: string;
  fecha: string;
}

export interface FormRegistro {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  email: string;
  password: string;
  confirmarPassword: string;
  foto: string;
}

export interface FormEmpleado extends FormRegistro {
  perfil: string;
}

export interface FormProducto {
  nombre: string;
  descripcion: string;
  tiempo_elaboracion: string;
  precio: string;
  fotos: [string, string, string];
  categoria: string;
}
