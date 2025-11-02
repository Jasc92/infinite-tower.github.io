# 🎮 INFINITE TOWER - ¡EMPIEZA AQUÍ! 🗼

## ✅ **El juego PWA está 100% COMPLETO**

---

## 🚀 3 PASOS RÁPIDOS:

### ✏️ **PASO 1: Coloca tus Sprites**

Tienes 3 imágenes (el héroe, el orco, y el fondo).  
Necesitas copiarlas a la carpeta `assets/` con estos nombres:

```
pwa/
└── assets/
    ├── hero.png          ← El héroe con armadura
    ├── enemy.png         ← El orco verde
    └── background.png    ← El fondo de piedra
```

**Importante:** Los nombres deben ser **exactamente** esos (todo en minúsculas).

---

### 🖥️ **PASO 2: Abre una Terminal/PowerShell**

1. **Presiona** `Windows + R`
2. **Escribe:** `powershell`
3. **Enter**

En la terminal, escribe:

```powershell
cd C:\Users\joant\Desktop\infinite-tower\pwa
python -m http.server 8000
```

Deberías ver algo como:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

✅ **¡El servidor está corriendo!** Déjalo abierto.

---

### 🌐 **PASO 3: Abre el Juego**

#### En tu PC:
1. Abre **Chrome**
2. Ve a: **`http://localhost:8000`**
3. **¡A jugar!** 🎮

#### En tu Móvil (misma WiFi):
1. **Descubre tu IP:**
   - En la PowerShell escribe: `ipconfig`
   - Busca: `Dirección IPv4` (algo como `192.168.1.XX`)

2. **En el móvil:**
   - Abre Chrome
   - Ve a: `http://192.168.1.XX:8000` (reemplaza XX con tu IP)
   - **¡A jugar desde el móvil!** 📱

---

## 📱 **BONUS: Instalar como App en el Móvil**

Una vez que funcione en el móvil:

1. **Toca el menú** (⋮) en Chrome
2. **"Agregar a pantalla de inicio"**
3. **Confirmar**
4. ¡Ahora tienes un icono en tu launcher! 🎉

Funciona **offline** una vez instalada.

---

## 🎮 **Cómo se Juega**

1. **Menú:** Selecciona dificultad (Fácil/Normal/Difícil)
2. **Stats:** Asigna 5 puntos iniciales para tu build
3. **Batalla:** Observa el combate automático (puedes acelerar con 2x)
4. **Cada 5 pisos:** Ganas +3 puntos para mejorar
5. **IA Adaptativa:** Los enemigos cambian según tu estrategia cada 3 pisos
6. **Muerte:** Ves tu piso alcanzado y si estás en el top 3

---

## 🛠️ **¿No funciona?**

### "Python no se reconoce"
- **Instala Python:** https://www.python.org/downloads/
- ✅ Marca "Add Python to PATH" durante instalación
- Reinicia PowerShell

### "No veo los sprites"
- ✅ Verifica que las imágenes estén en `pwa/assets/`
- ✅ Nombres correctos: `hero.png`, `enemy.png`, `background.png`
- ✅ Recarga la página (Ctrl + Shift + R)

### "No puedo conectar desde el móvil"
- ✅ PC y móvil en la **misma WiFi**
- ✅ Desactiva temporalmente el **firewall de Windows**
- ✅ Verifica bien tu IP con `ipconfig`

---

## 📚 **Más Información:**

- **README.md** → Documentación completa
- **QUICK_START.md** → Inicio súper rápido
- **INSTRUCCIONES_USUARIO.md** → Guía detallada del usuario

---

## ✅ **Checklist:**

- [ ] Imágenes copiadas a `pwa/assets/`
- [ ] Nombres correctos (hero.png, enemy.png, background.png)
- [ ] Python instalado
- [ ] Servidor corriendo en PowerShell
- [ ] Juego abierto en `http://localhost:8000`
- [ ] **¡FUNCIONANDO!** 🎉

---

## 🎉 **¡ESO ES TODO!**

Tienes un juego **completo, funcional, y listo para jugar**.

**Características:**
- ✅ Auto-batalla en tiempo real
- ✅ IA adaptativa (contrarresta tu estrategia)
- ✅ Sistema de progresión (stats cada 5 pisos)
- ✅ Top 3 runs guardados localmente
- ✅ 3 dificultades
- ✅ Toggle de velocidad 1x/2x
- ✅ Funciona offline como PWA
- ✅ 100% del spec implementado

---

**🗼 ¡DISFRUTA ESCALANDO LA TORRE INFINITA!**

