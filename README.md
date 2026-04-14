# KORE MANAGER - Gestor de Instalaciones Deportivas

<div align="center">
  <a href="https://github.com/Luis-GR05/kore-manager">
    <img src="https://readme-typing-svg.herokuapp.com?font=Montserrat&weight=900&size=50&duration=3000&pause=1000&color=CCFF00&center=true&vCenter=true&width=600&height=100&lines=KORE+MANAGER;GESTI%C3%93N+DEPORTIVA;SAAS+PREMIUM" alt="Typing SVG" />
  </a>

  <p align="center">
    <img src="https://img.shields.io/badge/STATUS-EN_DESARROLLO-CCFF00?style=for-the-badge&labelColor=151525&logoColor=black" />
    <img src="https://img.shields.io/badge/VERSION-1.0.0-white?style=for-the-badge&labelColor=151525" />
  </p>

  <p align="center">
    <strong>Gestión inteligente. Centralizada. Escalable.</strong>
    <br />
    Plataforma SaaS de marca blanca para la digitalización de complejos deportivos.
  </p>

  <div style="display: flex; justify-content: center; gap: 10px;">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
    <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  </div>
</div>

<br />

<br />

---

## Sobre el Proyecto

**KORE MANAGER** nace como respuesta a la necesidad de digitalizar el sistema deportivo municipal. El objetivo es eliminar la burocracia, optimizar la ocupación de pistas y mejorar la comunicación entre el ayuntamiento y los ciudadanos.

El proyecto destaca no solo por su **Interfaz "Dark Mode"** moderna (acentos en *Acid Lime* y *Cyber Purple*), sino por su **arquitectura limpia** orientada a la escalabilidad y la seguridad de los datos.

## Documentación Oficial del Proyecto

Toda la documentación técnica y operativa requerida para la evaluación se encuentra centralizada en la carpeta `/docs`:

* 📖 **[A) Manual de Usuario](./docs/A_Manual_Usuario.md):** Guía visual y operativa. Pantallas, flujos de navegación y uso del aplicativo por perfiles.
* ⚙️ **[B) Manual Técnico](./docs/B_Manual_Tecnico.md):** Arquitectura del sistema, diseño de la base de datos (PostgreSQL), Custom Hooks y decisiones de UI/UX.
* 🚀 **[C) Manual de Despliegue](./docs/C_Manual_Despliegue.md):** Requisitos y pasos exactos para la instalación y ejecución del entorno.
* 📅 **[D) Manual del Proyecto](./docs/D_Manual_Proyecto.md):** Memoria evolutiva, registro de bloqueos técnicos superados y trabajo realizado durante los trimestres.

## Características Técnicas Principales

* 🔐 **Seguridad y Accesos (RBAC):** Sistema de roles estricto (Admin, Conserje, Ciudadano) respaldado por **Row Level Security (RLS)** en la base de datos para evitar accesos no autorizados.
* 🧩 **Arquitectura DRY:** Desarrollo basado en componentes de UI globales y *Custom Hooks* para separar la lógica de negocio de las vistas.
* 📦 **Inventario y Panel Admin:** Control de stock en tiempo real y directorio de gestión global de usuarios.
* 📢 **Sistema de Incidencias:** Reporte y seguimiento de problemas en las instalaciones con restricciones asimétricas de lectura/escritura.

## Roadmap y Estado Actual

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/Luis-GR05/kore-manager.git](https://github.com/Luis-GR05/kore-manager.git)
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=tu_url_aqui
    VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
    ```

4.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```

## 📅 Roadmap (Planificación)

- [x] **Semana 1 (13/01/26):** Configuración de entorno, Tailwind, Diseño UI y Login funcional.
- [x] **Semana 2 (20/01/26):** Base de Datos (Tablas Reales) y Dashboard Dinámico.
- [x] **Semana 3 (27/01/26):** Sistema de Reservas y lógica de disponibilidad.
- [x] **Semana 4 (03/02/26):** Gestión de Inventario y Panel de Admin.
- [ ] **Semana 5 (10/02/26):** Gestión de pagos y Panel de Compra.
- [ ] **Semana 6 (17/02/26):** Perfil de usuario, incidencias y pulido final.

---

<div align="center">
  <br />
  <a href="https://github.com/Luis-GR05">
    <img src="https://img.shields.io/badge/Desarrollado_por-Luis_Gordillo-white?style=flat-square&logo=github&logoColor=black" alt="Desarrollado por Luis Gordillo" />
  </a>
</div>
