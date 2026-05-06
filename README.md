<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=B73BFE&height=200&section=header&text=KORE%20MANAGER&fontSize=50&fontColor=CCFF00&animation=fadeIn&fontAlignY=38&desc=Gestor%20de%20Instalaciones%20Deportivas&descAlignY=58&descAlign=50" alt="Kore Manager Header" />
</div>

<div align="center">
  <p align="center">
    <img src="https://img.shields.io/badge/STATUS-EN_DESARROLLO-CCFF00?style=for-the-badge&labelColor=151525&logoColor=black" alt="Status" />
    <img src="https://img.shields.io/badge/VERSION-1.4.0-B73BFE?style=for-the-badge&labelColor=151525&logoColor=white" alt="Version" />
    <img src="https://img.shields.io/badge/LICENSE-MIT-white?style=for-the-badge&labelColor=151525" alt="License" />
  </p>
  
  <h3>Plataforma SaaS para la digitalización de complejos deportivos</h3>
  <p>Gestión inteligente • Centralizada • Altamente Escalable</p>

  <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; max-width: 800px; margin: 1.5rem auto;">
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
    <img src="https://img.shields.io/badge/Vertex_AI-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Vertex AI" />
    <img src="https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white" alt="GSAP" />
  </div>
</div>

---

## <img src="https://api.iconify.design/lucide/zap.svg?color=%23CCFF00" width="24" style="vertical-align: middle; margin-right: 4px;" /> Sobre el Proyecto

**KORE MANAGER** nace como respuesta a la necesidad de modernizar y digitalizar el sistema deportivo municipal. El objetivo es eliminar la burocracia, optimizar la ocupación de pistas y mejorar drásticamente la comunicación entre la administración y los ciudadanos.

El proyecto destaca por su interfaz **Dark Mode Premium**, utilizando acentos en **Acid Lime (#CCFF00)** y **Cyber Purple (#B73BFE)**, brindando una experiencia inmersiva y de vanguardia. Además, cuenta con una arquitectura limpia orientada a la escalabilidad, la seguridad de los datos y el alto rendimiento.

---

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%23B73BFE" width="24" style="vertical-align: middle; margin-right: 4px;" /> Características Técnicas Principales

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">

| Feature | Descripción |
| :--- | :--- |
| <img src="https://api.iconify.design/lucide/shield-check.svg?color=%23CCFF00" width="20" style="vertical-align: text-bottom; margin-right: 4px;" /> **RBAC & RLS Security** | Sistema de roles estricto (Admin, Conserje, Ciudadano) respaldado por **Row Level Security (RLS)** en PostgreSQL para una protección de datos impenetrable. |
| <img src="https://api.iconify.design/lucide/credit-card.svg?color=%23B73BFE" width="20" style="vertical-align: text-bottom; margin-right: 4px;" /> **Integración Stripe** | Pasarela de pagos totalmente automatizada, segura y escalable para el cobro de reservas de instalaciones. |
| <img src="https://api.iconify.design/lucide/bot.svg?color=%23CCFF00" width="20" style="vertical-align: text-bottom; margin-right: 4px;" /> **AI Avatars (Vertex AI)** | Generación de avatares estilizados mediante IA (*Imagen 3.0*) en Edge Functions, preservando la biometría facial del usuario de forma asíncrona. |
| <img src="https://api.iconify.design/lucide/gamepad-2.svg?color=%23B73BFE" width="20" style="vertical-align: text-bottom; margin-right: 4px;" /> **Motor de Gamificación** | Sistema de logros e hitos que premia y recompensa a los ciudadanos por el uso recurrente, incrementando la retención de usuarios. |
| <img src="https://api.iconify.design/lucide/sparkles.svg?color=%23CCFF00" width="20" style="vertical-align: text-bottom; margin-right: 4px;" /> **UX & Micro-animaciones** | Implementación de **GSAP** para animaciones fluidas, transiciones de estado e interacciones de altísima calidad. |
| <img src="https://api.iconify.design/lucide/package.svg?color=%23B73BFE" width="20" style="vertical-align: text-bottom; margin-right: 4px;" /> **Control de Inventario** | Gestión de stock en tiempo real integrado con las reservas, control de material deportivo y directorio de incidencias asimétrico. |

</div>

---

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%23CCFF00" width="24" style="vertical-align: middle; margin-right: 4px;" /> Arquitectura del Proyecto

```text
📦 KORE MANAGER
 ┣ 📂 Docs                  # Documentación oficial (Manuales de Usuario, Técnico, Despliegue)
 ┣ 📂 src
 ┃ ┣ 📂 assets              # Recursos estáticos (imágenes, logos)
 ┃ ┣ 📂 components          # Componentes UI reutilizables (Botones, Modales, Layout)
 ┃ ┣ 📂 context             # Estados globales (AuthContext)
 ┃ ┣ 📂 hooks               # Custom Hooks (Lógica de negocio encapsulada)
 ┃ ┣ 📂 pages               # Vistas principales (Dashboard, Reservas, Admin)
 ┃ ┗ 📜 main.jsx            # Punto de entrada de React
 ┣ 📂 supabase
 ┃ ┣ 📂 functions           # Edge Functions de Deno (Ej: generate-avatar)
 ┃ ┗ 📜 supabase_schema.sql # Esquema completo de BD (Tablas, RLS, Triggers, RPC)
 ┗ 📜 package.json          # Dependencias y scripts
```

---

## <img src="https://api.iconify.design/lucide/book-open.svg?color=%23B73BFE" width="24" style="vertical-align: middle; margin-right: 4px;" /> Documentación Oficial

Toda la documentación técnica y operativa requerida para la evaluación se encuentra centralizada y estructurada en la carpeta `/Docs`:

1. <img src="https://api.iconify.design/lucide/book.svg?color=white" width="18" style="vertical-align: text-bottom; margin-right: 4px;" /> **[Manual de Usuario](./Docs/A_Manual_Usuario.md):** Guía visual, pantallas, flujos de navegación y uso por perfiles.
2. <img src="https://api.iconify.design/lucide/settings.svg?color=white" width="18" style="vertical-align: text-bottom; margin-right: 4px;" /> **[Manual Técnico](./Docs/B_Manual_Tecnico.md):** Arquitectura del sistema, diseño relacional (PostgreSQL), Custom Hooks y decisiones UX.
3. <img src="https://api.iconify.design/lucide/rocket.svg?color=white" width="18" style="vertical-align: text-bottom; margin-right: 4px;" /> **[Manual de Despliegue](./Docs/C_Manual_Despliegue.md):** Requisitos y pasos exactos para la instalación y CI/CD.
4. <img src="https://api.iconify.design/lucide/calendar.svg?color=white" width="18" style="vertical-align: text-bottom; margin-right: 4px;" /> **[Manual del Proyecto](./Docs/D_Manual_Proyecto.md):** Memoria evolutiva, superación de bloqueos técnicos y trabajo trimestral.

---

## <img src="https://api.iconify.design/lucide/wrench.svg?color=%23CCFF00" width="24" style="vertical-align: middle; margin-right: 4px;" /> Instalación y Despliegue Local

Sigue estos pasos para arrancar el entorno de desarrollo en tu máquina:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Luis-GR05/kore-manager.git

# 2. Acceder al directorio
cd kore-manager

# 3. Instalar dependencias
npm install
```

**Configuración de Entorno:**
Crea un archivo `.env` en la raíz del proyecto con las credenciales de Supabase y las API Keys requeridas:
```env
VITE_SUPABASE_URL="tu_url_de_supabase"
VITE_SUPABASE_ANON_KEY="tu_clave_anon_de_supabase"
# Opcional (Dependiendo del entorno)
VITE_STRIPE_PUBLIC_KEY="tu_clave_publica_stripe"
```

**Ejecutar Servidor:**
```bash
npm run dev
```
> El proyecto estará disponible en `http://localhost:5173` <img src="https://api.iconify.design/lucide/rocket.svg?color=%23CCFF00" width="18" style="vertical-align: middle; margin-left: 4px;" />

---

## <img src="https://api.iconify.design/lucide/calendar-days.svg?color=%23B73BFE" width="24" style="vertical-align: middle; margin-right: 4px;" /> Roadmap (Planificación)

- [x] **Fase 1 (Enero 26):** Setup de entorno, Tailwind, Diseño UI Base (Dark Mode), Auth funcional.
- [x] **Fase 2 (Febrero 26):** Tablas relacionales (Supabase), Dashboard, Sistema de Reservas y disponibilidad (RPC).
- [x] **Fase 3 (Marzo 26):** Control de Inventario, Roles (RLS), Panel Admin, Gestión de Pagos (Stripe).
- [x] **Fase 4 (Abril 26):** IA Avatars (Vertex AI), Gamificación, Pulido de Animaciones (GSAP) y corrección de bugs. *(V 1.4.0 Lista)*

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=1A1A2E&height=100&section=footer&text=Desarrollado%20por%20Luis%20Gordillo&fontSize=20&fontColor=B73BFE" alt="Footer" />
  
  <br/>
  <br/>
  
  <a href="https://github.com/Luis-GR05">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
</div>
