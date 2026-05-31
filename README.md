# Restaurante App — TFI2

Aplicación móvil de gestión de restaurante desarrollada con **Ionic + Angular + Supabase**.

---

## Estado del proyecto

### Requerimientos excluyentes

| Estado | Requerimiento |
|--------|--------------|
| ✅ | Splash screen animada con logo, nombre e integrantes |
| ✅ | Todo en español con tildes |
| ⬜ | Sin alerts — usar toasts, modales, ion-toast |
| ⬜ | Sonido al iniciar y cerrar la app |
| ✅ | Validación en todos los formularios |
| ⬜ | Spinner con logo en todas las esperas |
| ⬜ | Vibración en todos los errores |
| ✅ | Botones de ingreso rápido |
| ✅ | Botón de cierre de sesión |
| ⬜ | Pantalla completa ocupada sin espacios neutros |
| ⬜ | Contraste nítido, sin fondos blancos ni negros |
| ⬜ | Imágenes y textos sin cortes |
| ⬜ | Encuestas con variedad de controles |
| ⬜ | Push notifications |
| ⬜ | Emails automáticos (Resend) — pendiente |
| ⬜ | Lectura y generación de QR |
| ⬜ | 3 juegos simples funcionales |
| ⬜ | Gráficos estadísticos uno por pantalla |

---

## Módulos

### Dueño / Supervisor

| Estado | Funcionalidad |
|--------|--------------|
| ✅ | Agregar empleado |
| ✅ | Agregar mesa + generar QR |
| ✅ | Ver QR de mesas existentes |
| ✅ | QR de entrada al local |
| ✅ | QR de propinas |
| ✅ | Ver clientes pendientes + aprobar/rechazar |
| ⬜ | Emails automáticos al aprobar/rechazar — pendiente |

### Cocinero

| Estado | Funcionalidad |
|--------|--------------|
| ✅ | Agregar plato |
| ✅ | Ver pedidos pendientes de cocina |
| ✅ | Marcar pedido listo |

### Cantinero

| Estado | Funcionalidad |
|--------|--------------|
| ✅ | Agregar bebida |
| ✅ | Ver pedidos pendientes de bar |
| ✅ | Marcar pedido listo |

### Metre

| Estado | Funcionalidad |
|--------|--------------|
| ✅ | Ver lista de espera |
| ✅ | Asignar mesa a cliente |
| ⬜ | Crear cliente registrado desde el metre |

### Mozo

| Estado | Funcionalidad |
|--------|--------------|
| ✅ | Ver pedidos pendientes |
| ✅ | Confirmar pedido → derivar a cocina y bar |
| ✅ | Rechazar pedido |
| ✅ | Marcar pedido entregado |
| ✅ | Confirmar pago y liberar mesa |
| ⬜ | Chat con clientes |

### Cliente

| Estado | Funcionalidad |
|--------|--------------|
| ✅ | Registro de cliente |
| ✅ | Login con estado pendiente/rechazado |
| ✅ | Anotarse en lista de espera |
| ✅ | Ver mesa asignada |
| ✅ | Ver menú (platos y bebidas) |
| ✅ | Realizar pedido con cantidades y total |
| ⬜ | Ver estado del pedido |
| ⬜ | Modificar pedido rechazado |
| ⬜ | Cliente anónimo |
| ⬜ | Chat con mozo |
| ⬜ | Juegos para descuentos |
| ⬜ | Encuesta de satisfacción |
| ⬜ | Pedir la cuenta + propina |
| ⬜ | Ver gráficos de encuestas |

---

## QR

| Estado | Funcionalidad |
|--------|--------------|
| ✅ | QR de entrada generado y estático |
| ✅ | QR de propinas generado y estático |
| ✅ | QR por mesa generado al crear |
| ⬜ | Lectura de QR desde la app (web + mobile) |

---

## Próximos pasos (orden lógico)

1. Ver estado del pedido — cliente
2. Modificar pedido rechazado — cliente
3. Chat mozo-cliente
4. Cliente anónimo
5. Juegos
6. Encuesta + gráficos
7. Cuenta + propina
8. Lectura de QR
9. Diseño y estilos
10. Mobile (Capacitor)
