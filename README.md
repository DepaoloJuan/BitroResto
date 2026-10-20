# BitroResto

Aplicación mobile para la gestión integral de un restaurante. El cliente se registra, se anota en la lista de espera, escanea el QR de su mesa, hace el pedido, juega mientras espera, completa una encuesta y pide la cuenta. El personal (metre, mozo, cocinero, cantinero, dueño y supervisor) tiene vistas propias para cada etapa del servicio.

Proyecto en equipo desarrollado para la cursada de la Tecnicatura en Programación (UTN).

## Stack

| Tecnología | Para qué se usa |
| --- | --- |
| Ionic y Angular | App multiplataforma (iOS y Android) desde una sola base de código |
| Capacitor | Cámara, escáner de QR y códigos de barras, notificaciones y hápticos |
| Supabase | Base de datos PostgreSQL, autenticación y suscripciones en tiempo real |
| Chart.js | Gráficos de resultados de encuestas |

## Funcionalidades principales

| Flujo | Detalle |
| --- | --- |
| Registro y login | Cliente registrado (foto y DNI escaneado) o anónimo, con aprobación del dueño o supervisor |
| Ingreso al local | QR de entrada, lista de espera y asignación de mesa por el metre con notificación al cliente |
| Servicio | QR de mesa, pedido y reingreso al hub con nuevo escaneo |
| Notificaciones push | Aviso al personal por pedidos nuevos, pedidos listos, pedidos de cuenta y pagos |
| Cuenta | Detalle, propina, confirmación de pago por el mozo y liberación de la mesa |
| Gestión | Alta de empleados y mesas, con QR único por mesa |

## Mi aporte

Splash e ícono, registro y login de clientes, QR de entrada, lista de espera y asignación de mesa, QR de mesa y hub post-pedido, notificaciones push, cuenta y propina, y confirmación de pago con liberación de mesa.

## Ejecutar en local

| Paso | Comando |
| --- | --- |
| Instalar dependencias | `npm install` |
| Servidor de desarrollo | `ionic serve` |

Las credenciales de Supabase se configuran en el archivo de entorno de Angular y no deben subirse al repositorio.

## Autores

Juan Manuel Depaolo y Carmen Cespedes.
