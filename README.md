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

| | | | | |
|---|---|---|---|---|
| ![Logo](assets/screenshots/logo.png) | ![Ícono](assets/screenshots/icono.png) | ![Ícono Teléfono](assets/screenshots/icono_telefono.png) | ![Splash](assets/screenshots/splash.png) | ![Splash Screen](assets/screenshots/splash_screen.png) |
| Logo | Ícono | Ícono en teléfono | Splash | Splash Screen |

### Acceso

| | | |
|---|---|---|
| ![Login](assets/screenshots/login_screen.png) | ![Registro](assets/screenshots/registro_cliente_screen.png) | ![Registro Anónimo](assets/screenshots/ingreso_anonimo.png) |
| Login | Registro cliente | Registro anónimo |

### Flujo del cliente registrado

| | | | |
|---|---|---|---|
| ![Cliente](assets/screenshots/cliente_screen.png) | ![Lista de Espera](assets/screenshots/lista_espera.png) | ![Mesa Asignada](assets/screenshots/mesa_asignada_screen.PNG) | ![Lista Espera Cliente](assets/screenshots/lista_espera_cliente_screen.PNG) |
| Panel cliente | Lista de espera | Mesa asignada | Espera — cliente registrado |

| | | |
|---|---|---|
| ![Menú Entradas](assets/screenshots/menu_entradas.jpeg) | ![Menú Principales](assets/screenshots/menu_principal.jpeg) | ![Menú Postres](assets/screenshots/menu_postre.jpeg) |
| Menú — Entradas | Menú — Principales | Menú — Postres |

| | | |
|---|---|---|
| ![Menú Bebidas](assets/screenshots/menu_bebidas.jpeg) | ![Estado Pedido](assets/screenshots/estado_pedido.jpeg) | ![Vista Mesa](assets/screenshots/vista_mesa.png) |
| Menú — Bebidas | Estado del pedido | Vista de mesa |

| | | |
|---|---|---|
| ![Juegos](assets/screenshots/pantalla_juegos.jpeg) | ![Juego Memoria](assets/screenshots/juego_memoria.jpeg) | ![Juego Ahorcado](assets/screenshots/juego_ahorcado.jpeg) |
| Selección de juegos | Memoria | Ahorcado |

| |
|---|
| ![Juego Pregunta](assets/screenshots/juego_preguntas.jpeg) |
| Pregunta trivia |

| | | |
|---|---|---|
| ![Resultados Encuesta 1](assets/screenshots/resultado_encuesta.png) | ![Resultados Encuesta 2](assets/screenshots/resultado_encuestas_2.jpeg) | ![Resultados Encuesta 3](assets/screenshots/resultado_encuenta_3.png) |
| Resultados encuesta (1) | Resultados encuesta (2) | Resultados encuesta (3) |


### Flujo del cliente anónimo

| |
|---|
| ![Anónimo Mesa](assets/screenshots/hub_anonimo.jpeg) |
| Hub de mesa anónimo |

### Personal del restaurante

| | |
|---|---|
| ![Dueño](assets/screenshots/dueno_screen.png) | ![Supervisor](assets/screenshots/supervisor_screen.png) |
| Panel dueño | Panel supervisor |

| | |
|---|---|
| ![Alta Mesa](assets/screenshots/agregar_mesa_screen.png) | ![Gestionar Mesas](assets/screenshots/gestionar_mesas.PNG) |
| Alta de mesa | Gestionar mesas |

| | |
|---|---|
| ![Mozo](assets/screenshots/mozo_screen.png) | ![Chat Mozo](assets/screenshots/chat_mozo.png) |
| Panel mozo | Chat — mozo |

| | | |
|---|---|---|
| ![Metre](assets/screenshots/metre_screen.png) | ![Lista Espera Metre](assets/screenshots/lista_espera_screen.PNG) | ![Cocinero](assets/screenshots/cocinero_screen.png) |
| Panel metre | Lista de espera — metre | Panel cocinero |

| | |
|---|---|
| ![Alta Plato](assets/screenshots/agregar_plato_screen.PNG) | ![Cantinero](assets/screenshots/bartender_screen.png) |
| Alta de plato | Panel cantinero |

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