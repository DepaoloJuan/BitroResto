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
    /* canActivate: [AuthGuard], */
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dueno/dueno.page').then((m) => m.DuenoPage),
      },
      {
        path: 'agregar-empleado',
        loadComponent: () =>
          import('./pages/dueno/agregar-empleado/agregar-empleado.page').then(
            (m) => m.AgregarEmpleadoPage,
          ),
      },
      {
        path: 'agregar-mesa',
        loadComponent: () =>
          import('./pages/dueno/agregar-mesa/agregar-mesa.page').then(
            (m) => m.AgregarMesaPage,
          ),
      },
      {
        path: 'clientes-pendientes',
        loadComponent: () =>
          import('./pages/dueno/clientes-pendientes/clientes-pendientes.page').then(
            (m) => m.ClientesPendientesPage,
          ),
      },
      {
        path: 'qr-entrada',
        loadComponent: () =>
          import('./pages/dueno/qr-entrada/qr-entrada.page').then(
            (m) => m.QrEntradaPage,
          ),
      },
      {
        path: 'qr-propinas',
        loadComponent: () =>
          import('./pages/dueno/qr-propinas/qr-propinas.page').then(
            (m) => m.QrPropinasPage,
          ),
      },
      {
        path: 'tablero',
        loadComponent: () =>
          import('./pages/dueno/tablero/tablero.page').then(
            (m) => m.TableroPague,
          ),
      },
    ],
  },
  {
    path: 'supervisor',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/supervisor/supervisor.page').then(
            (m) => m.SupervisorPage,
          ),
      },
      {
        path: 'agregar-empleado',
        loadComponent: () =>
          import('./pages/dueno/agregar-empleado/agregar-empleado.page').then(
            (m) => m.AgregarEmpleadoPage,
          ),
      },
      {
        path: 'agregar-mesa',
        loadComponent: () =>
          import('./pages/dueno/agregar-mesa/agregar-mesa.page').then(
            (m) => m.AgregarMesaPage,
          ),
      },
      {
        path: 'clientes-pendientes',
        loadComponent: () =>
          import('./pages/dueno/clientes-pendientes/clientes-pendientes.page').then(
            (m) => m.ClientesPendientesPage,
          ),
      },
      {
        path: 'qr-entrada',
        loadComponent: () =>
          import('./pages/dueno/qr-entrada/qr-entrada.page').then(
            (m) => m.QrEntradaPage,
          ),
      },
      {
        path: 'qr-propinas',
        loadComponent: () =>
          import('./pages/dueno/qr-propinas/qr-propinas.page').then(
            (m) => m.QrPropinasPage,
          ),
      },
      {
        path: 'gestionar-mesas',
        loadComponent: () =>
          import('./pages/supervisor/gestionar-mesas/gestionar-mesas.page').then(
            (m) => m.GestionarMesasPage,
          ),
      },
    ],
  },
  {
    path: 'metre',
    /* canActivate: [AuthGuard], */
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/metre/metre.page').then((m) => m.MetrePage),
      },
      {
        path: 'lista-espera',
        loadComponent: () =>
          import('./pages/metre/lista-espera/lista-espera.page').then(
            (m) => m.ListaEsperaPage,
          ),
      },
      {
        path: 'agregar-cliente',
        loadComponent: () =>
          import('./pages/metre/agregar-cliente/agregar-cliente.page').then(
            (m) => m.AgregarClientePage,
          ),
      },
    ],
  },
  {
    path: 'mozo',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/mozo/mozo.page').then((m) => m.MozoPage),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/mozo/pedidos/pedidos.page').then((m) => m.PedidosPage),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./pages/mozo/chat/chat.page').then((m) => m.ChatPage),
      },
    ],
  },
  {
    path: 'cocinero',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/cocinero/cocinero.page').then((m) => m.CocineroPage),
      },
      {
        path: 'agregar-plato',
        loadComponent: () =>
          import('./pages/cocinero/agregar-plato/agregar-plato.page').then(
            (m) => m.AgregarPlatoPage,
          ),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/cocinero/pedidos/pedidos.page').then(
            (m) => m.PedidosPage,
          ),
      },
    ],
  },
  {
    path: 'cantinero',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/cantinero/cantinero.page').then((m) => m.CantineroPage),
      },
      {
        path: 'agregar-bebida',
        loadComponent: () =>
          import('./pages/cantinero/agregar-bebida/agregar-bebida.page').then(
            (m) => m.AgregarBebidaPage,
          ),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/cantinero/pedidos/pedidos.page').then(
            (m) => m.PedidosPage,
          ),
      },
    ],
  },
  {
    path: 'cliente',
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./pages/cliente/registro/registro.page').then(
            (m) => m.RegistroPage,
          ),
      },
      {
        path: 'home',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./pages/cliente/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'lista-espera',
        /* canActivate: [AuthGuard], */
        loadComponent: () =>
          import('./pages/cliente/lista-espera/lista-espera.page').then(
            (m) => m.ListaEsperaPage,
          ),
      },
      {
        path: 'mesa',
        /* canActivate: [AuthGuard], */
        loadComponent: () =>
          import('./pages/cliente/mesa/mesa.page').then((m) => m.MesaPage),
      },
      {
        path: 'menu',
        /* canActivate: [AuthGuard], */
        loadComponent: () =>
          import('./pages/cliente/menu/menu.page').then((m) => m.MenuPage),
      },
      {
        path: 'pedido',
        /* canActivate: [AuthGuard], */
        loadComponent: () =>
          import('./pages/cliente/pedido/pedido.page').then((m) => m.PedidoPage),
      },
      {
        path: 'juegos',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./pages/cliente/juegos/juegos.page').then((m) => m.JuegosPage),
      },
      {
        path: 'encuesta',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./pages/cliente/encuesta/encuesta.page').then(
            (m) => m.EncuestaPage,
          ),
      },
      {
        path: 'cuenta',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./pages/cliente/cuenta/cuenta.page').then((m) => m.CuentaPage),
      },
      {
        path: 'chat',
        canActivate: [AuthGuard],
        loadComponent: () =>
          import('./pages/cliente/chat/chat.page').then((m) => m.ChatPage),
      },
      {
        path: 'anonimo',
        loadComponent: () =>
          import('./pages/cliente/anonimo/anonimo.page').then((m) => m.AnonimoPage),
      },
      {
        path: 'anonimo-espera',
        loadComponent: () =>
          import('./pages/cliente/anonimo-espera/anonimo-espera.page').then(
            (m) => m.AnonimoEsperaPage,
          ),
      },
      {
        path: 'anonimo-mesa',
        loadComponent: () =>
          import('./pages/cliente/anonimo-mesa/anonimo-mesa.page').then(
            (m) => m.AnonimoMesaPage,
          ),
      },
      {
        path: 'encuesta-resultados',
        loadComponent: () =>
          import('./pages/cliente/encuesta-resultados/encuesta-resultados.page').then(
            (m) => m.EncuestaResultadosPage,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'splash',
  },
];
