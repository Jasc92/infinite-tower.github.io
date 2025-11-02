# 🎮 Infinite Tower - Instrucciones para el Usuario

## ✅ El juego está COMPLETO y listo para usar

Ya tienes una **Progressive Web App funcional** con:
- ✅ Todas las mecánicas del juego implementadas
- ✅ 4 pantallas (Menú, Stats, Batalla, Resultados)
- ✅ IA adaptativa que contrarresta tu estrategia
- ✅ Sistema de combate en tiempo real
- ✅ Top 3 runs con persistencia local
- ✅ Funciona offline una vez instalada
- ✅ Responsive y optimizada para móvil

---

## 🚀 PASO 1: Preparar tus Sprites

### Necesitas 3 imágenes:

1. **Sprite del Héroe** (el humano con armadura)
2. **Sprite del Enemigo** (el orco verde)
3. **Fondo del Dungeon** (la imagen de piedra oscura)

### Cómo preparar las imágenes:

#### Opción A: Usar tus imágenes actuales

Si tienes las imágenes en formato PNG:
1. Guárdalas con estos nombres **exactos**:
   - `hero.png`
   - `enemy.png`  
   - `background.png`

2. Colócalas en la carpeta: `pwa/assets/`

#### Opción B: Si necesitas extraerlas

Si tus imágenes están en otro formato o en un archivo:
1. Abre cada imagen en un editor (Paint, GIMP, Photoshop)
2. Guarda como PNG
3. Renombra según lo indicado arriba
4. Copia a `pwa/assets/`

---

## 🚀 PASO 2: Iniciar el Servidor

### En Windows (PowerShell/CMD):

```powershell
# Navega a la carpeta pwa
cd C:\Users\joant\Desktop\infinite-tower\pwa

# Inicia el servidor
python -m http.server 8000
```

Si no tienes Python, instálalo desde: https://www.python.org/downloads/

---

## 🚀 PASO 3: Abrir en el Navegador

### En tu PC:

Abre Chrome, Firefox, o Edge y ve a:
```
http://localhost:8000
```

### En tu Móvil (misma WiFi):

1. **Descubre tu IP local:**
   ```powershell
   ipconfig
   ```
   Busca algo como: `192.168.1.X` o `192.168.0.X`

2. **En el móvil:**
   Abre Chrome y ve a:
   ```
   http://192.168.1.X:8000
   ```
   (Reemplaza X con tu IP)

---

## 📱 PASO 4 (Opcional): Instalar como App

### En Android:
1. Abre el juego en Chrome
2. Menú (⋮) → **"Agregar a pantalla de inicio"**
3. Confirma
4. ¡Tendrás un icono en tu launcher!

### En iOS:
1. Abre el juego en Safari
2. Botón compartir (🔗) → **"Añadir a inicio"**
3. Confirma
4. ¡Funciona como app nativa!

---

## 🎮 Cómo Jugar

### 1. Menú Principal
- **Selecciona dificultad:** Fácil, Normal, o Difícil
- **Ver Top Runs:** Toca "Top 3 Runs" para ver tus mejores partidas
- **Toca "JUGAR"** para comenzar

### 2. Asignación de Stats (5 puntos iniciales)
- **⚡ Velocidad de Ataque:** Atacas más rápido (max 5.0/s)
- **⚔️ Ataque:** Más daño
- **💥 Crítico:** Chance de pegar el doble (max 75%)
- **🌪️ Evasión:** Esquivas ataques (max 25%)
- **🛡️ Defensa:** Reduces daño recibido
- **❤️ Vida:** Más HP

**Estrategias:**
- **Ofensivo:** ATK + SPD + CRIT → Matarás rápido pero eres frágil
- **Defensivo:** HP + DEF + EVA → Aguantas más pero matas lento
- **Equilibrado:** Mix de todo → Adaptable

### 3. Batalla
- **Auto-batalla:** Se pelea solo, solo observas
- **Toggle de velocidad:** Botón "1x/2x" arriba a la derecha
- **Cada 5 pisos:** Recibes +3 puntos para mejorar

### 4. IA Adaptativa
El juego evalúa tu build cada 3 pisos:
- Si eres muy ofensivo → Enemigos más tanque
- Si eres muy defensivo → Enemigos cañón de cristal
- Si estás equilibrado → Enemigos normales

### 5. Muerte
- **Ves el piso alcanzado** y la duración
- **Si estás en top 3:** Se guarda automáticamente
- **Vuelta al menú:** Intenta una nueva estrategia

---

## 🎯 Consejos Pro

1. **Primer run:** Prueba un build equilibrado para entender el juego
2. **Experimenta:** Cada build tiene ventajas y desventajas
3. **Observa la IA:** Nota cómo cambian los enemigos según tu estrategia
4. **Usa el speed 2x:** Acelera las batallas cuando estés seguro
5. **Top Runs:** Intenta diferentes dificultades para variedad

---

## 🐛 Troubleshooting

### "No veo mis sprites"
1. ✅ Verifica que los archivos estén en `pwa/assets/`
2. ✅ Nombres correctos: `hero.png`, `enemy.png`, `background.png`
3. ✅ Recarga la página (Ctrl + Shift + R)

### "El servidor no inicia"
1. ✅ Instala Python: https://www.python.org/downloads/
2. ✅ Verifica que estás en la carpeta `pwa`
3. ✅ Intenta otro puerto: `python -m http.server 8080`

### "No puedo ver el juego en el móvil"
1. ✅ PC y móvil en la misma WiFi
2. ✅ Verifica la IP con `ipconfig`
3. ✅ Desactiva firewall temporalmente
4. ✅ Intenta: `http://TU-IP:8000` (reemplaza TU-IP)

### "El juego va lento"
1. ✅ Usa Chrome (navegador más rápido)
2. ✅ Cierra otras pestañas
3. ✅ Reduce el tamaño de la ventana del juego

---

## 📊 Datos del Juego

### Almacenamiento Local
- Los top 3 runs se guardan en **LocalStorage** del navegador
- Son locales a cada dispositivo/navegador
- No se sincronizan entre dispositivos

### Ver datos guardados:
1. Abre DevTools (F12)
2. Pestaña "Console"
3. Escribe: `localStorage.getItem('infinite_tower_top_runs')`

### Borrar datos:
1. Abre DevTools (F12)
2. Pestaña "Console"
3. Escribe: `localStorage.removeItem('infinite_tower_top_runs')`
4. Recarga la página

---

## 🌐 Compartir el Juego

### Opción 1: GitHub Pages (Gratis, Fácil)
1. Crea un repositorio en GitHub
2. Sube la carpeta `pwa`
3. Ve a Settings → Pages → Activa GitHub Pages
4. Comparte la URL: `https://tu-usuario.github.io/infinite-tower`

### Opción 2: Netlify (Aún más fácil)
1. Ve a netlify.com
2. Drag & drop la carpeta `pwa`
3. Obtendrás una URL instantánea
4. ¡Compártela!

---

## 📁 Estructura de Archivos (para referencia)

```
pwa/
├── index.html              # Juego principal
├── manifest.json           # Config PWA
├── service-worker.js       # Soporte offline
├── css/
│   └── styles.css          # Estilos
├── js/
│   ├── combat.js           # Motor de combate
│   ├── enemy.js            # Enemigos + IA
│   ├── game.js             # Lógica del juego
│   └── app.js              # UI
├── assets/
│   ├── hero.png            # ⚠️ TU SPRITE
│   ├── enemy.png           # ⚠️ TU SPRITE
│   ├── background.png      # ⚠️ TU FONDO
│   └── README_ASSETS.md    # Instrucciones
├── README.md               # Documentación completa
├── QUICK_START.md          # Inicio rápido
└── INSTRUCCIONES_USUARIO.md # Este archivo
```

---

## ✅ Checklist Final

Antes de jugar, verifica:

- [ ] Python instalado
- [ ] Sprites colocados en `pwa/assets/` con nombres correctos
- [ ] Servidor corriendo (`python -m http.server 8000`)
- [ ] Navegador abierto en `http://localhost:8000`
- [ ] Sprites visibles en el juego
- [ ] ¡A jugar!

---

## 🎉 ¡Listo!

Tu juego está **100% funcional** y listo para disfrutar. 

**Características implementadas:**
- ✅ 100% de la especificación MVP
- ✅ Fórmulas exactas de scaling
- ✅ IA adaptativa funcional
- ✅ Sistema de combate fiel
- ✅ Progresión correcta
- ✅ Persistencia de datos
- ✅ Offline support
- ✅ Mobile-friendly

---

## 📞 Necesitas Ayuda?

1. **README.md** - Documentación completa
2. **QUICK_START.md** - Inicio súper rápido
3. **assets/README_ASSETS.md** - Info sobre sprites

---

**🗼 ¡Disfruta escalando la Torre Infinita!**

*Desarrollado con Vanilla JavaScript - Sin frameworks, sin dependencias, solo diversión pura.*

