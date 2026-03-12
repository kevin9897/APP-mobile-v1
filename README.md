# APP-mobile-v1

# LifeCare 🌱

**LifeCare** es una aplicación web progresiva (PWA) minimalista para el seguimiento diario de hábitos saludables, productividad y bienestar mental.  
Registra tus hábitos, acumula experiencia (XP), sube de nivel, desbloquea temas visuales y mantiene rachas para motivarte a ser constante.

![LifeCare preview](https://via.placeholder.com/800x500/4caf50/ffffff?text=LifeCare+Preview)  
*(captura de pantalla recomendada aquí – puedes reemplazar el enlace)*

## Características principales

- Tres categorías de hábitos predefinidas:  
  - **Salud**  
  - **Productividad**  
  - **Mental / Bienestar**
- Posibilidad de **añadir hábitos personalizados**
- Sistema de **experiencia (XP)** y niveles (cada 100 XP → +1 nivel)
- Temas visuales que se desbloquean al subir de nivel:  
  Verde (nivel 1) → Azul (5) → Morado (10) → Dorado (20)
- Cálculo de **rachas actuales y máximas**
- Vista de **calendario mensual** con colores según rendimiento
- Mini-gráfico de los últimos 7 días
- **Asistente** con sugerencias de hábitos por categoría
- Notificaciones toast y animación de **día perfecto** (+50 XP bonus)
- Persistencia total con **localStorage**
- Diseño mobile-first (ideal para usar como PWA)

## Tecnologías utilizadas

- HTML5 / CSS3 (variables CSS, animaciones, gradientes)
- JavaScript puro (sin frameworks)
- Almacenamiento: **localStorage**
- Responsive design (máximo 420px centrado)

## Instalación y uso

1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/lifecare.git
cd lifecare

lifecare/
├── index.html        # Estructura principal
├── styles.css        # Todos los estilos y temas
├── script.js         # Lógica completa de la aplicación
└── README.md
