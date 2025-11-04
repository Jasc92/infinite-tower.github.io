# 🎯 Propuesta Final de 15 Nuevas Reliquias - Ajustada según Feedback

## 📋 Cambios según Feedback

### ✅ Reliquias Aprobadas (con ajustes):
1. **Diamond Shield** ✅ - OK
2. **Shield Battery** ✅ - OK
3. **Rage Combo** ✅ - OK
4. **Weak Point** ✅ - OK
5. **Overkill** ❌ - NO (la vida se resetea al iniciar combate)
6. **Burst Fire** ❌ - NO (ya hay una parecida)
7. **Spite** ✅ - OK (bajo 30% HP: +60% daño)
8. **Battle Hardened** ✅ - OK
9. **Blink** ✅ - OK
10. **Damage Absorb** ❌ - NO (muy overpowered)
11. **Retaliate** ⚠️ - OK pero solo primeros X hits (no todo el combate)
12. **Stat Mirror** ❌ - NO
13. **Potion Master** ✅✅ - LE ENCANTA
14. **Lucky Strike** ❌ - NO
15. **Energy Surge** ⚠️ - OK pero necesita hacer ataques más lentos o algo para balance

---

## 🆕 15 Nuevas Reliquias Finales (Ajustadas)

### 🛡️ SISTEMA DE ESCUDO (2 reliquias)

#### 1. **💎 Diamond Shield** ✅
- **Icono:** 💎
- **Descripción:** "Gain a shield equal to 25% max HP at battle start. Shield prevents critical hits and absorbs damage first"
- **Mecánica:** 
  - Al inicio de cada combate: `player.shield = Math.round(player.maxHp * 0.25)`
  - Visual: HP+Shield (ej: 100+25) con barra azul que representa el porcentaje de escudo
  - Mientras tienes escudo: **los críticos se tratan como daño normal**
  - El daño se resta primero del escudo, luego del HP
- **Sinergias:** Fortify, Thick Skin, builds de tanque

#### 2. **🔄 Shield Battery** ✅
- **Icono:** 🔄
- **Descripción:** "Shield regenerates 10% of max HP every 5 seconds (if shield is broken)"
- **Mecánica:** Solo funciona si el escudo está roto (0), regenera cada 5 segundos
- **Sinergias:** Con Diamond Shield = regeneración constante

---

### ⚡ OFENSIVAS (5)

#### 3. **⚔️ Rage Combo** ✅
- **Icono:** ⚔️
- **Descripción:** "Each consecutive hit increases damage by 5% (max 50%, resets on miss)"
- **Mecánica:** Contador de hits consecutivos, cada hit aumenta daño, resetea al fallar
- **Sinergias:** First Blood, Double Strike, builds de alta precisión

#### 4. **🎯 Weak Point** ✅
- **Icono:** 🎯
- **Descripción:** "Each attack ignores 2% more of enemy defense (max 60%)"
- **Mecánica:** Contador de ataques en el combate, se suma con Armor Piercing
- **Sinergias:** Armor Piercing, builds de ataque rápido, enemigos tanque

#### 5. **🔥 Spite** ✅
- **Icono:** 🔥
- **Descripción:** "Below 30% HP, deal +60% damage"
- **Mecánica:** Solo funciona en combate, se suma con otros buffs de daño
- **Sinergias:** Last Stand, Lifesteal, Second Wind

#### 6. **⚡ Burst Fire** ❌ → **REEMPLAZADO por: ⚔️ Executioner**
- **Icono:** ⚔️
- **Descripción:** "Deal +50% damage to enemies below 40% HP"
- **Mecánica:** Similar a Execute pero menos agresivo (40% vs 20%), se suma con Execute
- **Sinergias:** Execute, Critical Mass, builds de daño masivo

#### 7. **💀 Overkill** ❌ → **REEMPLAZADO por: 🎯 Precision Strike**
- **Icono:** 🎯
- **Descripción:** "Attacks cannot miss, but deal -10% damage"
- **Mecánica:** Garantiza hits pero reduce daño ligeramente
- **Sinergias:** Rage Combo (no resetea el combo), builds de precisión

---

### 🛡️ DEFENSIVAS (4)

#### 8. **🛡️ Battle Hardened** ✅
- **Icono:** 🛡️
- **Descripción:** "Each hit taken increases defense by 1 (max +20, resets on heal above 80% HP)"
- **Mecánica:** Contador de hits recibidos, se resetea al curar por encima de 80% HP
- **Sinergias:** Shield Wall, builds de tanque, Lifesteal

#### 9. **💫 Blink** ✅
- **Icono:** 💫
- **Descripción:** "20% chance to dodge any attack completely"
- **Mecánica:** RNG-based, no funciona con escudo (el escudo absorbe primero)
- **Sinergias:** Diamond Shield, Thick Skin, builds de suerte

#### 10. **🔄 Damage Absorb** ❌ → **REEMPLAZADO por: 🛡️ Iron Will**
- **Icono:** 🛡️
- **Descripción:** "Take 10% less damage from critical hits, +20 Defense"
- **Mecánica:** Mitiga específicamente críticos y añade defensa plana
- **Sinergias:** Thick Skin, Shield Wall, Fortify

#### 11. **⚔️ Retaliate** ⚠️ → **AJUSTADO: Solo primeros 5 hits**
- **Icono:** ⚔️
- **Descripción:** "First 5 hits received, counter-attack immediately for 40% of normal damage"
- **Mecánica:** Solo los primeros 5 hits del combate, se activa inmediatamente después de recibir daño
- **Sinergias:** Double Strike, Critical Mass, builds de ataque rápido

---

### 🎲 HÍBRIDAS/UTILIDAD (4)

#### 12. **📊 Stat Mirror** ❌ → **REEMPLAZADO por: ⚡ Power Spike**
- **Icono:** ⚡
- **Descripción:** "Every 5 floors, gain +10% to all stats (permanent)"
- **Mecánica:** Cada 5 floors (5, 10, 15, 20...), multiplica todos los stats por 1.1
- **Sinergias:** Balanced Stance, builds de largo plazo, escalado progresivo

#### 13. **⚗️ Potion Master** ✅✅
- **Icono:** ⚗️
- **Descripción:** "Heal 3% max HP every 3 seconds, but lose 1% max HP permanently each floor"
- **Mecánica:** Trade-off: curación constante vs pérdida de HP máximo cada floor
- **Sinergias:** Fortify, Lifesteal, builds de largo plazo

#### 14. **🎲 Lucky Strike** ❌ → **REEMPLAZADO por: 🔄 Recycle**
- **Icono:** 🔄
- **Descripción:** "When you dodge or miss, gain +15% attack speed for 3 seconds"
- **Mecánica:** Si esquivas un ataque o fallas un ataque, ganas velocidad temporal
- **Sinergias:** Blink, builds de suerte, precisión

#### 15. **⚡ Energy Surge** ⚠️ → **AJUSTADO: Ataques más lentos**
- **Icono:** ⚡
- **Descripción:** "Every 4 seconds, next attack deals 2.5x damage and cannot miss. -15% attack speed"
- **Mecánica:** Timer de 4 segundos, siguiente ataque hace 2.5x daño, pero reduce velocidad de ataque permanentemente
- **Sinergias:** Critical Mass, Execute, builds de daño masivo

---

## 📊 Resumen Final

### Sistema de Escudo (2):
1. **Diamond Shield** - Escudo base que previene críticos
2. **Shield Battery** - Regeneración de escudo

### Ofensivas (5):
3. **Rage Combo** - Combo system (más daño por hits consecutivos)
4. **Weak Point** - Defense ignore scaling
5. **Spite** - Low HP offensive (30% threshold)
6. **Executioner** - +50% damage to enemies below 40% HP (NUEVA)
7. **Precision Strike** - Attacks cannot miss but -10% damage (NUEVA)

### Defensivas (4):
8. **Battle Hardened** - Defense stacking on hit
9. **Blink** - Dodge chance (20%)
10. **Iron Will** - -10% crit damage + 20 Defense (NUEVA)
11. **Retaliate** - First 5 hits counter-attack (AJUSTADA)

### Híbridas/Utilidad (4):
12. **Power Spike** - Every 5 floors: +10% all stats (NUEVA)
13. **Potion Master** - Heal over time but lose max HP (FAVORITA)
14. **Recycle** - On dodge/miss: +15% attack speed for 3s (NUEVA)
15. **Energy Surge** - Cooldown burst but -15% attack speed (AJUSTADA)

---

## 🎮 Sistema de Reliquias Nuevo

### Distribución:
- **Floor 1 (Inicio):** 1 reliquia (elegir de 3)
- **Floor 10 (antes del boss 11):** 1 reliquia (elegir de 3)
- **Floor 20 (antes del boss 21):** 1 reliquia (elegir de 3)
- **Floor 30 (antes del boss 31):** 1 reliquia (elegir de 3)
- **... y así sucesivamente**

### Máximo:
- Puedes tener hasta **3 reliquias activas** a la vez
- Si ya tienes 3, puedes reemplazar una al elegir una nueva

### Flujo:
1. **Inicio:** Menu → Relic Selection (1 reliquia) → Stats → Battle
2. **Floor 10, 20, 30...:** Battle → Relic Selection (1 reliquia) → Stats → Battle

---

## ⚖️ Balance y Consideraciones

### Reliquias Nuevas:
- **Executioner**: Similar a Execute pero menos agresivo, permite sinergias
- **Precision Strike**: Garantiza hits pero reduce daño, útil para combos
- **Iron Will**: Mitiga críticos específicamente, complementa Thick Skin
- **Power Spike**: Escalado progresivo cada 5 floors, útil para runs largas
- **Recycle**: Beneficio de fallos/esquivar, interesante para builds de suerte
- **Energy Surge**: Ajustado con -15% attack speed para balance

### Ajustes:
- **Retaliate**: Solo primeros 5 hits (no todo el combate)
- **Energy Surge**: -15% attack speed para balance (trade-off)

---

## 🚀 Prioridad de Implementación

### Fase 1 (Sistema de Shield + Favoritas):
1. **Diamond Shield** ⭐ (IMPLEMENTAR PRIMERO)
2. **Shield Battery**
3. **Potion Master** ⭐ (FAVORITA DEL USUARIO)

### Fase 2 (Mecánicas Simples):
4. **Spite**
5. **Blink**
6. **Battle Hardened**
7. **Retaliate** (ajustada)

### Fase 3 (Mecánicas Medianas):
8. **Rage Combo**
9. **Weak Point**
10. **Executioner**
11. **Precision Strike**
12. **Iron Will**
13. **Recycle**

### Fase 4 (Mecánicas Complejas):
14. **Power Spike**
15. **Energy Surge** (ajustada)

---

## 💡 Notas de Diseño

- **Diamond Shield** es la reliquia principal con la mecánica de escudo mejorada
- **Potion Master** es la favorita del usuario, prioridad alta
- Todas las reliquias ofrecen mecánicas únicas no duplicadas
- El sistema de reliquias cambia: 1 al inicio, luego cada 10 floors (10, 20, 30...)
- Máximo 3 reliquias activas, se pueden reemplazar

