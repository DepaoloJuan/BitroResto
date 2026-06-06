# BitroResto

Aplicación mobile para la gestión integral de un restaurante. Permite a los clientes registrarse, anotarse en lista de espera, escanear el QR de su mesa, realizar pedidos, jugar mientras esperan, completar una encuesta de satisfacción y pedir la cuenta. El personal del restaurante (metre, mozo, cocinero, cantinero, dueño y supervisor) cuenta con vistas propias para administrar cada etapa del servicio.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Motivo |
|---|---|
| **Ionic + Angular** | Framework para desarrollo mobile multiplataforma (iOS y Android) desde una única base de código |
| **Capacitor** | Acceso a funcionalidades nativas del dispositivo: cámara, scanner QR/código de barras, notificaciones y hápticos |
| **Supabase** | Backend con base de datos PostgreSQL, autenticación y suscripciones en tiempo real para actualizar la UI sin recargar |
| **Chart.js** | Visualización de resultados de encuestas en gráficos de torta, barras y línea |

---

## 📁 Repositorio

**Nombre:** `bitro-2026`
**Visibilidad:** Privado

### Colaboradores con acceso:
- maxineinerutn
- aleconsta
- naferrero-utnfra
- amorelli-utnfra
- octaviovillegas
- aleloredo

---

## 📆 Fechas de entrega

| Instancia | Fecha |
|---|---|
| Primer parcial | 30-05-2026 |
| Recuperatorio 1er parcial | 06-06-2026 |
| Segundo parcial | 27-06-2026 |
| Recuperatorio 2do parcial | 04-07-2026 |

---

## 👥 Integrantes y módulos

---

### Depaolo, Juan Manuel *(Líder)*

| Campo | Detalle |
|---|---|
| **Apellidos y nombres** | Depaolo, Juan Manuel |
| **Fecha de inicio** | 18-04-2026 |
| **Fecha de finalización** | 06-06-2026 |
| **Branch** | main |

**Módulos desarrollados:**

**1. Splash screen e ícono personalizados**
La aplicación cuenta con pantalla de inicio y ícono propios acordes a la identidad visual del restaurante.

**2. Registro y login de clientes (registrado y anónimo)**
El cliente puede registrarse con foto, DNI escaneado y datos personales, o ingresar de forma anónima con nombre y foto. Incluye validaciones y manejo de estado de aprobación.

**3. QR de entrada al local**
El dueño genera y muestra un QR estático. El cliente lo escanea para poder anotarse en la lista de espera o registrar su ingreso como anónimo.

**4. Lista de espera y asignación de mesa**
El cliente registrado se anota en la lista de espera. El metre visualiza la lista y asigna mesas. El cliente recibe una notificación cuando su mesa está lista.

**11. QR de mesa y acceso al hub (post-pedido)**
Después de realizar el pedido, el cliente debe volver a escanear el QR de su mesa para reingresar al hub. Tras confirmar la recepción del pedido, se requiere un nuevo escaneo para acceder a juegos, encuesta y cuenta.

**12. Notificaciones push**
El mozo, dueño y supervisor reciben notificaciones automáticas ante nuevos pedidos, pedidos listos, solicitudes de cuenta y confirmaciones de pago, independientemente de la pantalla en la que se encuentren.

**15. Cuenta y propina**
El cliente visualiza el detalle de su pedido, selecciona el porcentaje de propina y envía la solicitud de pago al mozo.

**16. Confirmación de pago y liberación de mesa**
El mozo confirma el pago, la mesa queda disponible nuevamente y se notifica al dueño y supervisor.

---

### Cespedes, Carmen

| Campo | Detalle |
|---|---|
| **Apellidos y nombres** | Cespedes, Carmen |
| **Fecha de inicio** | 18-04-2026 |
| **Fecha de finalización** | 06-06-2026 |
| **Branch** | main |

**Módulos desarrollados:**

**5. Alta y gestión de empleados**
El dueño y supervisor pueden registrar nuevos empleados con foto, datos personales escaneados desde el DNI y perfil asignado (metre, mozo, cocinero, cantinero, supervisor).

**6. Alta y gestión de mesas**
El dueño puede dar de alta mesas con número, capacidad, tipo y foto. Se genera un QR único por mesa.

**7. Gestión de clientes pendientes**
El dueño y supervisor aprueban o rechazan solicitudes de registro de clientes, con envío automático de correo de notificación.

**8. Alta de platos por categoría**
El cocinero puede cargar nuevos platos con nombre, descripción, tiempo de elaboración, precio, 3 fotos obligatorias y categoría (entrada, plato principal o postre).

**9. Alta de bebidas**
El cantinero puede cargar nuevas bebidas con nombre, descripción, precio, graduación alcohólica y 3 fotos obligatorias.

**17. Vista del menú por categorías**
El cliente accede al menú del restaurante organizado por categorías (entradas, platos principales, postres y bebidas), con visualización de una pantalla completa por ítem y carrusel de fotos.

**18. Panel del dueño y supervisor**
Vistas de administración con acceso a todas las funciones del negocio: empleados, mesas, clientes, QR de entrada y reportes.

---

### Caballero, Jorge Ezequiel

| Campo | Detalle |
|---|---|
| **Apellidos y nombres** | Caballero, Jorge Ezequiel |
| **Fecha de inicio** | 18-04-2026 |
| **Fecha de finalización** | 06-06-2026 |
| **Branch** | main |

**Módulos desarrollados:**

**10. Mozo: gestión de pedidos**
El mozo visualiza los pedidos pendientes en tiempo real, puede confirmarlos o rechazarlos, marcarlos como entregados y confirmar el pago.

**13. Chat cliente-mozo**
El cliente puede enviar consultas al mozo directamente desde el hub de su mesa. El mozo responde desde su panel.

**14. Hacer pedido**
El cliente selecciona ítems del menú, los agrega al carrito y envía el pedido al mozo para su confirmación.

**19. Metre: gestión de lista de espera**
El metre visualiza la lista de espera en tiempo real, puede asignar mesas disponibles a los clientes y gestionar el flujo de ingreso al local.

**20. Encuesta de satisfacción**
El cliente completa una encuesta sobre atención, comida, ambiente y si volvería al restaurante. Solo puede completarla una vez por estadía.

**21. Resultados de encuestas en gráficos**
Cualquier cliente puede visualizar los resultados históricos de las encuestas en gráficos de torta, barras y línea, un gráfico por pantalla.

**22. Juegos con descuento**
Mientras espera su pedido, el cliente registrado puede jugar a memoria, ahorcado o pregunta de trivia. Si gana en el primer intento, obtiene un descuento aplicable en la cuenta.

---

## ✅ Requerimientos excluyentes — Estado

| Requerimiento | Responsable | Estado |
|---|---|---|
| Splash screens estática y animada | Cespedes | ✅ Completado |
| Todo en español (con tildes) | Todo el equipo | ✅ Completado |
| Errores/info sin alerts (controles visuales) | Todo el equipo | ✅ Completado |
| Sonidos al iniciar y cerrar la app | Cespedes | ✅ Completado |
| Validación completa de formularios | Todo el equipo | ✅ Completado |
| Spinners con logo en todas las esperas | Cespedes | ✅ Completado |
| Vibración en todos los errores | Todo el equipo | ✅ Completado |
| Botones de ingreso rápido por perfil | Depaolo | ✅ Completado |
| Botón de cierre de sesión | Depaolo | ✅ Completado |
| Pantalla completa sin espacios neutros | Cespedes | ✅ Completado |
| Contraste nítido, sin blanco ni negro de fondo | Cespedes | ✅ Completado |
| Imágenes y textos sin cortes ni abreviaciones | Cespedes | ✅ Completado |
| Encuestas con variedad de controles | Caballero | ✅ Completado |
| Push notifications | Depaolo | ✅ Completado |
| Correo electrónico automático (cuenta empresarial) | Cespedes | ✅ Completado |
| Lectura y generación de QR (ingreso, mesa, propina) | Depaolo / Caballero | ✅ Completado |
| Tres juegos funcionales con descuentos | Caballero | ✅ Completado |
| Gráficos estadísticos (torta, barra, lineal) — 1 por pantalla | Caballero | ✅ Completado |
| Funcionalidades 1 al 22 completas | Todo el equipo | ✅ Completado |

---

## 🗂️ Códigos QR requeridos

| QR | Función | Ubicación |
|---|---|---|
| QR de ingreso al local | Lista de espera + ver encuestas previas | Impreso en entrada / en app |
| QR de mesa (x5 mesas mínimo) | Acceso a menú, pedido, juegos, encuesta, pago | Impreso en cada mesa |
| QR de propinas | Selección de nivel de satisfacción (0%–20%) | En app al momento del pago |

---

## 👤 Perfiles de usuario

| Perfil | Descripción |
|---|---|
| Dueño | Acceso total, aprueba/rechaza clientes y empleados |
| Supervisor | Similar al dueño |
| Metre | Gestiona lista de espera y asignación de mesas |
| Mozo | Confirma pedidos, atiende consultas, entrega y cobra |
| Cocinero | Ve y gestiona pedidos de cocina |
| Cantinero | Ve y gestiona pedidos de bar |
| Cliente registrado | Reserva, pide, juega, paga |
| Cliente anónimo | Acceso limitado: lista de espera y encuestas |

---

## 🖼️ Pantallas de la aplicación

### General

| | | | |
|---|---|---|---|
| ![Logo](assets/screenshots/logo.png) | ![Ícono](assets/screenshots/icono.png) | ![Splash](assets/screenshots/splash.png) | ![Splash Screen](assets/screenshots/splash_screen.png) |
| Logo | Ícono | Splash | Splash Screen |

### Acceso

| | | |
|---|---|---|
| ![Login](assets/screenshots/login_screen.png) | ![Registro](assets/screenshots/registro_screen.png) | ![Registro Anónimo](assets/screenshots/registro_anonimo_screen.png) |
| Login | Registro cliente | Registro anónimo |

### Flujo del cliente registrado

| | | | |
|---|---|---|---|
| ![Cliente](assets/screenshots/cliente_screen.png) | ![QR Entrada Scan](assets/screenshots/qr-entrada-scan.png) | ![Lista de Espera](assets/screenshots/lista-espera.png) | ![Mesa Hub](assets/screenshots/mesa-hub.png) |
| Panel cliente | Escaneo QR entrada | Lista de espera | Hub de mesa |

| | | |
|---|---|---|
| ![Menú Entradas](assets/screenshots/menu-entradas.png) | ![Menú Principales](assets/screenshots/menu-principales.png) | ![Menú Postres](assets/screenshots/menu-postres.png) |
| Menú — Entradas | Menú — Principales | Menú — Postres |

| | | |
|---|---|---|
| ![Menú Bebidas](assets/screenshots/menu-bebidas.png) | ![Pedido](assets/screenshots/pedido.png) | ![Estado Pedido](assets/screenshots/estado-pedido.png) |
| Menú — Bebidas | Hacer pedido | Estado del pedido |

| | | |
|---|---|---|
| ![Juegos](assets/screenshots/juegos.png) | ![Juego Memoria](assets/screenshots/juego-memoria.png) | ![Juego Ahorcado](assets/screenshots/juego-ahorcado.png) |
| Selección de juegos | Memoria | Ahorcado |

| | | |
|---|---|---|
| ![Juego Pregunta](assets/screenshots/juego-pregunta.png) | ![Encuesta](assets/screenshots/encuesta.png) | ![Resultados Encuesta](assets/screenshots/encuesta-resultados.png) |
| Pregunta trivia | Encuesta | Resultados encuesta |

| | |
|---|---|
| ![Cuenta](assets/screenshots/cuenta.png) | ![Chat Cliente](assets/screenshots/chat-cliente.png) |
| Cuenta y propina | Chat con mozo |

### Flujo del cliente anónimo

| | |
|---|---|
| ![Anónimo Espera](assets/screenshots/anonimo-espera.png) | ![Anónimo Mesa](assets/screenshots/anonimo-mesa.png) |
| Espera de mesa | Hub de mesa anónimo |

### Personal del restaurante

| | | |
|---|---|---|
| ![Dueño](assets/screenshots/dueno_screen.png) | ![Supervisor](assets/screenshots/supervisor_screen.png) | ![Clientes Pendientes](assets/screenshots/clientes-pendientes.png) |
| Panel dueño | Panel supervisor | Clientes pendientes |

| | | |
|---|---|---|
| ![Alta Empleado](assets/screenshots/alta-empleado.png) | ![Alta Mesa](assets/screenshots/agregar_mesa_screen.png) |
| Alta de empleado | Alta de mesa |

| | | |
|---|---|---|
| ![Mozo](assets/screenshots/mozo_screen.png) | ![Pedidos Mozo](assets/screenshots/pedidos-mozo.png) | ![Chat Mozo](assets/screenshots/chat-mozo.png) |
| Panel mozo | Pedidos pendientes | Chat — mozo |

| | | |
|---|---|---|
| ![Metre](assets/screenshots/metre.png) | ![Lista Espera Metre](assets/screenshots/lista-espera-metre.png) | ![Cocinero](assets/screenshots/cocinero_screen.png) |
| Panel metre | Lista de espera | Panel cocinero |

| | | |
|---|---|---|
| ![Alta Plato](assets/screenshots/alta-plato.png) | ![Cantinero](assets/screenshots/bartender_screen.png) | ![Alta Bebida](assets/screenshots/alta-bebida.png) |
| Alta de plato | Panel cantinero | Alta de bebida |

### Códigos QR

| | | |
|---|---|---|
| ![QR Entrada](assets/screenshots/qr_entrada.png) | ![QR Propina](assets/screenshots/qr_propina.png) | ![QR Mesa 3](assets/screenshots/qr_mesa_3.jpeg) |
| QR Entrada al local | QR Propina | QR Mesa 3 |

| | | |
|---|---|---|
| ![QR Mesa 4](assets/screenshots/qr_mesa_4.jpeg) | ![QR Mesa 5](assets/screenshots/qr_mesa_5.jpeg) | ![QR Mesa 6](assets/screenshots/qr_mesa_6.jpeg) |
| QR Mesa 4 | QR Mesa 5 | QR Mesa 6 |

---

*Trabajo Final Integrador — UTN Facultad Regional Avellaneda*