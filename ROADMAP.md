# MiTaller — ROADMAP

Funcionalidades fuera del scope del MVP actual, planificadas para versiones futuras.

## Fase 2

- [ ] **Notificaciones automáticas** — WhatsApp via Twilio/Meta API cuando la orden avanza de fase
- [ ] **Cron job** — Cambio automático a `delayed` si la orden lleva >5 días en `progress`
- [ ] **Imágenes adjuntas** — Fotos del vehículo/daños adjuntas a la orden (S3/Cloudflare R2)
- [ ] **Refresh tokens** — Sesiones persistentes con token de refresh
- [ ] **Roles granulares** — owner, admin, técnico (con permisos diferentes por rol)

## Fase 3

- [ ] **Panel super-admin** — Gestión de tenants, métricas globales
- [ ] **Registro público de tenants** — Alta de nuevos talleres desde la web
- [ ] **Facturación / ARCA** — Integración con facturación electrónica argentina
- [ ] **Reportes PDF** — Exportar órdenes e historial como PDF
- [ ] **Multi-idioma** — i18n (español/inglés)

## Fase 4

- [ ] **App mobile nativa** — React Native (iOS/Android)
- [ ] **Notificaciones push** — Via Firebase Cloud Messaging
- [ ] **Integración con proveedores** — Cotización de repuestos online
- [ ] **IA** — Sugerencias de diagnóstico basadas en historial del vehículo
