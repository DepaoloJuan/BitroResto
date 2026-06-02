import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'dueno',
    loadComponent: () =>
      import('./pages/dueno/dueno.page').then((m) => m.DuenoPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'dueno/agregar-empleado',
    loadComponent: () =>
      import('./pages/dueno/agregar-empleado/agregar-empleado.page').then(
        (m) => m.AgregarEmpleadoPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'dueno/agregar-mesa',
    loadComponent: () =>
      import('./pages/dueno/agregar-mesa/agregar-mesa.page').then(
        (m) => m.AgregarMesaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'dueno/clientes-pendientes',
    loadComponent: () =>
      import('./pages/dueno/clientes-pendientes/clientes-pendientes.page').then(
        (m) => m.ClientesPendientesPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'dueno/qr-entrada',
    loadComponent: () =>
      import('./pages/dueno/qr-entrada/qr-entrada.page').then(
        (m) => m.QrEntradaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'dueno/qr-propinas',
    loadComponent: () =>
      import('./pages/dueno/qr-propinas/qr-propinas.page').then(
        (m) => m.QrPropinasPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'supervisor',
    loadComponent: () =>
      import('./pages/supervisor/supervisor.page').then(
        (m) => m.SupervisorPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'supervisor/agregar-empleado',
    loadComponent: () =>
      import('./pages/dueno/agregar-empleado/agregar-empleado.page').then(
        (m) => m.AgregarEmpleadoPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'supervisor/agregar-mesa',
    loadComponent: () =>
      import('./pages/dueno/agregar-mesa/agregar-mesa.page').then(
        (m) => m.AgregarMesaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'supervisor/clientes-pendientes',
    loadComponent: () =>
      import('./pages/dueno/clientes-pendientes/clientes-pendientes.page').then(
        (m) => m.ClientesPendientesPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'supervisor/qr-entrada',
    loadComponent: () =>
      import('./pages/dueno/qr-entrada/qr-entrada.page').then(
        (m) => m.QrEntradaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'supervisor/qr-propinas',
    loadComponent: () =>
      import('./pages/dueno/qr-propinas/qr-propinas.page').then(
        (m) => m.QrPropinasPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'metre',
    loadComponent: () =>
      import('./pages/metre/metre.page').then((m) => m.MetrePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'metre/lista-espera',
    loadComponent: () =>
      import('./pages/metre/lista-espera/lista-espera.page').then(
        (m) => m.ListaEsperaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'metre/agregar-cliente',
    loadComponent: () =>
      import('./pages/metre/agregar-cliente/agregar-cliente.page').then(
        (m) => m.AgregarClientePage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'mozo',
    loadComponent: () =>
      import('./pages/mozo/mozo.page').then((m) => m.MozoPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'mozo/pedidos',
    loadComponent: () =>
      import('./pages/mozo/pedidos/pedidos.page').then((m) => m.PedidosPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'mozo/chat',
    loadComponent: () =>
      import('./pages/mozo/chat/chat.page').then((m) => m.ChatPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cocinero',
    loadComponent: () =>
      import('./pages/cocinero/cocinero.page').then((m) => m.CocineroPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cocinero/agregar-plato',
    loadComponent: () =>
      import('./pages/cocinero/agregar-plato/agregar-plato.page').then(
        (m) => m.AgregarPlatoPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'cocinero/pedidos',
    loadComponent: () =>
      import('./pages/cocinero/pedidos/pedidos.page').then(
        (m) => m.PedidosPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'cantinero',
    loadComponent: () =>
      import('./pages/cantinero/cantinero.page').then((m) => m.CantineroPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cantinero/agregar-bebida',
    loadComponent: () =>
      import('./pages/cantinero/agregar-bebida/agregar-bebida.page').then(
        (m) => m.AgregarBebidaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'cantinero/pedidos',
    loadComponent: () =>
      import('./pages/cantinero/pedidos/pedidos.page').then(
        (m) => m.PedidosPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente',
    loadComponent: () =>
      import('./pages/cliente/cliente.page').then((m) => m.ClientePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/registro',
    loadComponent: () =>
      import('./pages/cliente/registro/registro.page').then(
        (m) => m.RegistroPage,
      ),
  },
  {
    path: 'cliente/home',
    loadComponent: () =>
      import('./pages/cliente/home/home.page').then((m) => m.HomePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/lista-espera',
    loadComponent: () =>
      import('./pages/cliente/lista-espera/lista-espera.page').then(
        (m) => m.ListaEsperaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/mesa',
    loadComponent: () =>
      import('./pages/cliente/mesa/mesa.page').then((m) => m.MesaPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/menu',
    loadComponent: () =>
      import('./pages/cliente/menu/menu.page').then((m) => m.MenuPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/pedido',
    loadComponent: () =>
      import('./pages/cliente/pedido/pedido.page').then((m) => m.PedidoPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/juegos',
    loadComponent: () =>
      import('./pages/cliente/juegos/juegos.page').then((m) => m.JuegosPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/encuesta',
    loadComponent: () =>
      import('./pages/cliente/encuesta/encuesta.page').then(
        (m) => m.EncuestaPage,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/cuenta',
    loadComponent: () =>
      import('./pages/cliente/cuenta/cuenta.page').then((m) => m.CuentaPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/chat',
    loadComponent: () =>
      import('./pages/cliente/chat/chat.page').then((m) => m.ChatPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'cliente/anonimo',
    loadComponent: () =>
      import('./pages/cliente/anonimo/anonimo.page').then((m) => m.AnonimoPage),
  },
  {
    path: 'cliente/anonimo-espera',
    loadComponent: () =>
      import('./pages/cliente/anonimo-espera/anonimo-espera.page').then(
        (m) => m.AnonimoEsperaPage,
      ),
  },
  {
    path: 'cliente/anonimo-mesa',
    loadComponent: () =>
      import('./pages/cliente/anonimo-mesa/anonimo-mesa.page').then(
        (m) => m.AnonimoMesaPage,
      ),
  },
  {
    path: 'cliente/encuesta-resultados',
    loadComponent: () =>
      import('./pages/cliente/encuesta-resultados/encuesta-resultados.page').then(
        (m) => m.EncuestaResultadosPage,
      ),
  },
  {
    path: '**',
    redirectTo: 'splash',
  },
];
