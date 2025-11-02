# 🗼 Infinite Tower - PWA Edition

¡Bienvenido a la versión **Progressive Web App** de Infinite Tower! Juego roguelike auto-battler 100% offline.

---

## 🚀 Inicio Rápido (3 Pasos)

### Paso 1: Agregar tus Sprites

Coloca las imágenes en la carpeta `assets/`:

```
pwa/
├── assets/
│   ├── hero.png      ← Tu sprite del héroe
│   ├── enemy.png     ← Tu sprite del enemigo (orco)
│   └── background.png ← Tu fondo de piedra/dungeon
```

**Importante**: Los nombres de archivo deben ser **exactamente** estos.

---

### Paso 2: Iniciar Servidor Local

#### **Opción A: Python (Recomendado)**

```bash
# Abrir terminal en la carpeta pwa/
cd pwa

# Python 3
python -m http.server 8000

# Python 2 (si no tienes Python 3)
python -m SimpleHTTPServer 8000
```

#### **Opción B: Node.js**

```bash
npm install -g http-server
cd pwa
http-server -p 8000
```

#### **Opción C: PHP**

```bash
cd pwa
php -S localhost:8000
```

---

### Paso 3: Abrir en el Navegador

#### **En PC:**
```
http://localhost:8000
```

#### **En Móvil (misma WiFi):**
```
1. Descubre tu IP local:
   - Windows: ipconfig
   - Linux/Mac: ifconfig

2. En el móvil:
   http://192.168.X.X:8000
```

---

## 📱 Instalar como App en Móvil

### Android (Chrome):
1. Abre el juego en Chrome
2. Menú (⋮) → **"Agregar a pantalla de inicio"**
3. ¡Listo! Ahora tienes un icono en tu launcher

### iOS (Safari):
1. Abre el juego en Safari
2. Botón compartir → **"Añadir a inicio"**
3. ¡Funciona como app nativa!

---

## 🎮 Cómo Jugar

### Controles
- **Botones táctiles** - Todo funciona con toques
- **No requiere teclado** - Diseñado 100% para móvil
- **Speed toggle** - Botón 1x/2x en batalla

### Flujo del Juego
1. **Menú Principal**
   - Selecciona dificultad (Fácil/Normal/Difícil)
   - Ve tus top 3 runs
   - Pulsa JUGAR

2. **Asignación de Stats**
   - 5 puntos iniciales
   - Cada 5 pisos: +3 puntos
   - Elige tu build (ofensivo/defensivo/equilibrado)

3. **Batalla**
   - Auto-batalla en tiempo real
   - Ve las barras de HP
   - Toggle de velocidad 1x/2x

4. **Resultado**
   - Piso alcanzado
   - Duración
   - Top 3 automático

---

## 🎯 Mecánicas del Juego

### Stats del Jugador
| Stat | Base | Por Punto | Máximo |
|------|------|-----------|--------|
| Vel. Ataque | 1.0/s | +0.1/s | 5.0/s |
| Ataque | 10 | +2 | - |
| Crítico | 5% | +1% | 75% |
| Evasión | 0% | +1% | 25% |
| Defensa | 5 | +2 | - |
| Vida | 100 | +10 | - |

### IA Adaptativa
El juego evalúa tu build cada 3 pisos:

- **Build Ofensivo** → Enemigos Tanque
- **Build Defensivo** → Enemigos Cañón de Cristal
- **Build Equilibrado** → Enemigos Equilibrados

### Dificultades
- **Fácil**: 0.90x scaling (enemigos más débiles)
- **Normal**: 1.00x scaling (balanceado)
- **Difícil**: 1.12x scaling (enemigos más fuertes)

---

## 📦 Estructura del Proyecto

```
pwa/
├── index.html              # Estructura principal
├── manifest.json           # Configuración PWA
├── service-worker.js       # Soporte offline
├── css/
│   └── styles.css          # Estilos responsive
├── js/
│   ├── combat.js           # Motor de combate
│   ├── enemy.js            # Generador + IA adaptativa
│   ├── game.js             # Lógica del juego
│   └── app.js              # UI y controladores
├── assets/
│   ├── hero.png            # ⚠️ Agrega tu sprite
│   ├── enemy.png           # ⚠️ Agrega tu sprite
│   ├── background.png      # ⚠️ Agrega tu fondo
│   ├── icon-192.png        # (Opcional) Icono PWA
│   └── icon-512.png        # (Opcional) Icono PWA
└── README.md               # Este archivo
```

---

## 🛠️ Requisitos

### Para Desarrollo:
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Python 3, Node.js, o PHP (para servidor local)
- WiFi (para testing en móvil)

### Para Jugar:
- Cualquier navegador moderno
- JavaScript activado
- LocalStorage habilitado
- Pantalla táctil (móvil) o mouse (PC)

---

## 📱 Testing en Móvil

### Método 1: Servidor Local + WiFi

```bash
# En tu PC:
cd pwa
python -m http.server 8000

# Encuentra tu IP:
ipconfig  # Windows
ifconfig  # Linux/Mac

# En tu móvil (misma WiFi):
http://TU-IP:8000
```

✅ **Ventajas**: 
- Testing instantáneo
- Sin deploy
- Hot reload (recarga para ver cambios)

---

### Método 2: Deploy Online

#### **GitHub Pages** (Gratis)
```bash
1. Crear repo en GitHub
2. Subir carpeta pwa/
3. Settings → Pages → Activar
4. URL: https://tu-usuario.github.io/infinite-tower
```

#### **Netlify** (Gratis, más fácil)
```bash
1. Drag & drop carpeta pwa/ en netlify.com
2. URL instantánea
3. Actualizaciones automáticas
```

#### **Vercel** (Gratis)
```bash
npx vercel deploy pwa/
```

---

## 🎨 Personalización de Sprites

### Formato Recomendado:
- **Formato**: PNG con transparencia
- **Tamaño**: 64x64px o 128x128px
- **Estilo**: Pixel art (se renderiza correctamente)
- **Nombres**: 
  - `hero.png` para el jugador
  - `enemy.png` para el enemigo
  - `background.png` para el fondo

### Pixel Art:
El juego usa `image-rendering: pixelated` para mantener el estilo retro. Tus sprites se verán perfectos.

---

## 🐛 Troubleshooting

### "El juego no carga"
✅ Verifica que el servidor esté corriendo
✅ Revisa la consola del navegador (F12)
✅ Asegúrate que los sprites estén en `assets/`

### "No veo los sprites"
✅ Nombres de archivo correctos (hero.png, enemy.png, background.png)
✅ Sprites en la carpeta `assets/`
✅ Recargar página (Ctrl + Shift + R)

### "No se guarda el progreso"
✅ LocalStorage debe estar habilitado
✅ No uses modo incógnito
✅ Revisa permisos del navegador

### "La app no se instala"
✅ Usa HTTPS o localhost
✅ Manifest.json válido
✅ Service Worker registrado
✅ Chrome en Android o Safari en iOS

---

## 🌐 Compatibilidad

### Desktop:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Mobile:
- ✅ Android Chrome 90+
- ✅ iOS Safari 14+
- ✅ Samsung Internet 15+

---

## 💾 Datos y Almacenamiento

### ¿Dónde se guardan los top runs?
- **LocalStorage** del navegador
- Clave: `infinite_tower_top_runs`
- Formato: JSON array

### Ver datos guardados:
```javascript
// En consola del navegador (F12):
console.log(localStorage.getItem('infinite_tower_top_runs'));
```

### Borrar datos:
```javascript
// En consola:
localStorage.removeItem('infinite_tower_top_runs');
```

---

## 🚀 Deploy Rápido

### 1-Click Deploy:

#### Netlify:
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

#### Vercel:
```bash
npm i -g vercel
cd pwa
vercel
```

---

## 📊 Especificación Técnica

### 100% Compliant con MVP Spec:
- ✅ Todas las fórmulas exactas
- ✅ Stats base correctos
- ✅ Scaling preciso
- ✅ IA adaptativa implementada
- ✅ Sistema de combate fiel
- ✅ Progresión correcta
- ✅ Top runs funcionando

Ver [SPECIFICATION_COMPLIANCE.md](../SPECIFICATION_COMPLIANCE.md) para detalles.

---

## 🎉 ¡Listo para Jugar!

1. ✅ Agrega tus sprites a `assets/`
2. ✅ Inicia servidor: `python -m http.server 8000`
3. ✅ Abre: `http://localhost:8000`
4. ✅ ¡Juega y sube por la torre!

---

## 📞 Soporte

### Preguntas Frecuentes:

**P: ¿Necesito internet para jugar?**  
R: No, una vez instalada como PWA funciona 100% offline.

**P: ¿Funciona en iOS?**  
R: Sí, usa Safari y "Añadir a inicio".

**P: ¿Puedo compartir el juego?**  
R: Sí, despliega en GitHub Pages y comparte la URL.

**P: ¿Los datos se sincronizan entre dispositivos?**  
R: No, son locales a cada navegador/dispositivo.

---

## 🏆 Créditos

- **Diseño**: Especificación MVP Infinite Tower
- **Código**: PWA con Vanilla JavaScript
- **Sprites**: Pixel art (tus sprites)
- **Motor**: Canvas API + LocalStorage

---

**🗼 ¡Disfruta escalando la Torre Infinita!**

