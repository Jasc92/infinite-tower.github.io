# 🎯 Propuesta de 15 Nuevas Reliquias - V2 (Mecánicas Únicas)

## 📋 Análisis de Mecánicas Existentes (para evitar duplicados)

### Reliquias Actuales (20):
**Ofensivas:** Berserker Rage, Critical Mass, First Blood, Armor Piercing, Double Strike, Execute, Bleed
**Defensivas:** Second Wind, Thorns, Fortify, Shield Wall, Regeneration, Last Stand, Thick Skin
**Híbridas:** Vampire, Haste, Momentum, Blood Pact, Adrenaline, Balanced Stance

### Mecánicas Ya Cubiertas:
- ✅ DoT (Bleed)
- ✅ Reflejo de daño (Thorns)
- ✅ Reducción de daño (Thick Skin)
- ✅ Curación trigger (Second Wind)
- ✅ Supervivencia (Last Stand)
- ✅ Lifesteal (Vampire, Blood Pact)
- ✅ Attack Speed boost (Haste, Adrenaline)
- ✅ Stacking damage (Momentum)
- ✅ Double attack (Double Strike)
- ✅ Execute (Execute)
- ✅ Armor piercing (Armor Piercing)
- ✅ First hit crit (First Blood)
- ✅ Crit multiplier (Critical Mass)
- ✅ Regeneración pasiva (Regeneration)

---

## 🆕 15 Nuevas Reliquias Propuestas (Mecánicas Únicas)

### 🛡️ SISTEMA DE ESCUDO (2 reliquias)

#### 1. **💎 Diamond Shield** (Shield Base)
- **Icono:** 💎
- **Descripción:** "Gain a shield equal to 25% max HP at battle start. Shield prevents critical hits and absorbs damage first"
- **Mecánica:** 
  - Al inicio de cada combate: `player.shield = Math.round(player.maxHp * 0.25)`
  - El escudo se muestra como HP+Shield (ej: 100+25)
  - Mientras tienes escudo: **los críticos se tratan como daño normal**
  - El daño se resta primero del escudo, luego del HP
  - Visual: barra azul que representa el porcentaje de escudo sobre HP total
- **Sinergias:**
  - Con Fortify: más HP = más escudo
  - Con Thick Skin: protección doble (escudo + reducción)
  - Con builds de tanque: inmunidad temporal a críticos

#### 2. **🔄 Shield Battery** (Shield Regen)
- **Icono:** 🔄
- **Descripción:** "Shield regenerates 10% of max HP every 5 seconds (if shield is broken)"
- **Mecánica:**
  - Solo funciona si el escudo está roto (0)
  - Cada 5 segundos: `shield = Math.min(maxShield, shield + Math.round(maxHp * 0.10))`
  - Si tienes Diamond Shield: regenera el escudo inicial
  - Si no tienes escudo base: crea un escudo temporal
- **Sinergias:**
  - Con Diamond Shield: regeneración constante de escudo
  - Con builds defensivos: protección renovable

---

### ⚡ OFENSIVAS ÚNICAS (5)

#### 3. **⚔️ Rage Combo** (Combo System)
- **Icono:** ⚔️
- **Descripción:** "Each consecutive hit increases damage by 5% (max 50%, resets on miss)"
- **Mecánica:**
  - Contador de hits consecutivos
  - Cada hit: `damageMult = 1.0 + (hits * 0.05)`
  - Si fallas: contador se resetea
  - Múltiples reliquias pueden stackear el contador
- **Sinergias:**
  - Con First Blood: primer hit garantizado
  - Con Double Strike: más hits = más stacks
  - Con builds de alta precisión: mantener el combo

#### 4. **🎯 Weak Point** (Defense Ignore Scaling)
- **Icono:** 🎯
- **Descripción:** "Each attack ignores 2% more of enemy defense (max 60%)"
- **Mecánica:**
  - Contador de ataques en el combate
  - Cada ataque: `ignoreDefense = Math.min(0.60, attacks * 0.02)`
  - Se suma con Armor Piercing
  - Resetea cada combate
- **Sinergias:**
  - Con Armor Piercing: 30% base + hasta 60% = 90% ignore
  - Con builds de ataque rápido: más stacks
  - Con enemigos tanque: contrarresta alta defensa

#### 5. **💀 Overkill** (Excess Damage Conversion)
- **Icono:** 💀
- **Descripción:** "Excess damage from killing blows heals you for 50% of overkill"
- **Mecánica:**
  - Si el daño final es mayor que el HP restante del enemigo
  - Overkill = `damage - remainingHp`
  - Curación = `Math.round(overkill * 0.50)`
  - Solo funciona en killing blows
- **Sinergias:**
  - Con Execute: más overkill potencial
  - Con Critical Mass: críticos grandes = más overkill
  - Con builds de daño masivo: curación pasiva

#### 6. **🔥 Spite** (Low HP Offensive)
- **Icono:** 🔥
- **Descripción:** "Below 30% HP, deal +60% damage"
- **Mecánica:**
  - Similar a Savage Strike pero más agresivo (30% vs 50%)
  - Solo funciona en combate
  - Se suma con otros buffs de daño
- **Sinergias:**
  - Con Last Stand: supervivencia + daño masivo
  - Con Lifesteal: mantenerte en el rango bajo
  - Con Second Wind: curación que te saca del rango

#### 7. **⚡ Burst Fire** (Attack Speed Burst)
- **Icono:** ⚡
- **Descripción:** "First 3 attacks in battle are 50% faster"
- **Mecánica:**
  - Contador de ataques del jugador
  - Primeros 3 ataques: `attackSpeed *= 1.5`
  - Después: velocidad normal
  - Resetea cada combate
- **Sinergias:**
  - Con First Blood: primer hit rápido y crítico
  - Con Rage Combo: más hits rápidos = más stacks
  - Con builds de ataque rápido: ventaja inicial

---

### 🛡️ DEFENSIVAS ÚNICAS (4)

#### 8. **🛡️ Battle Hardened** (Defense Scaling)
- **Icono:** 🛡️
- **Descripción:** "Each hit taken increases defense by 1 (max +20, resets on heal above 80% HP)"
- **Mecánica:**
  - Contador de hits recibidos
  - Cada hit: `bonusDefense += 1` (máx 20)
  - Si te curas por encima del 80% HP: se resetea
  - Es temporal, solo en combate
- **Sinergias:**
  - Con Shield Wall: defensa base + stacking
  - Con builds de tanque: defensa masiva
  - Con Lifesteal: mantenerte bajo 80% para mantener stacks

#### 9. **💫 Blink** (Dodge Mechanic)
- **Icono:** 💫
- **Descripción:** "20% chance to dodge any attack completely"
- **Mecánica:**
  - RNG-based pero potente
  - Si esquivas: 0 daño
  - No funciona con escudo (el escudo absorbe primero)
  - Stackea con otros efectos de dodge
- **Sinergias:**
  - Con Diamond Shield: doble protección
  - Con Thick Skin: reducción + dodge
  - Con builds de suerte: más procs

#### 10. **🔄 Damage Absorb** (Shield from Damage)
- **Icono:** 🔄
- **Descripción:** "Taking damage grants 5% of damage as temporary shield (max 30% max HP)"
- **Mecánica:**
  - Cada vez que recibes daño: `shield += Math.round(damage * 0.05)`
  - Cap: `shield <= Math.round(maxHp * 0.30)`
  - El escudo se pierde al final del combate
  - Si tienes Diamond Shield: se suma al escudo base
- **Sinergias:**
  - Con Diamond Shield: escudo base + escudo temporal
  - Con Thorns: recibes daño pero ganas escudo
  - Con builds de tanque: más escudo = más protección

#### 11. **⚔️ Retaliate** (Counter-Attack on Hit)
- **Icono:** ⚔️
- **Descripción:** "When hit, immediately counter-attack for 40% of normal damage"
- **Mecánica:**
  - Similar a Thorns pero es un ataque real
  - Se activa inmediatamente después de recibir daño
  - No usa el timer de ataque normal
  - Puede hacer crítico (usa tu crit chance)
- **Sinergias:**
  - Con Double Strike: más contraataques
  - Con Critical Mass: contraataques críticos potentes
  - Con builds de ataque rápido: más contraataques

---

### 🎲 HÍBRIDAS/UTILIDAD ÚNICAS (4)

#### 12. **📊 Stat Mirror** (Enemy Stat Copy)
- **Icono:** 📊
- **Descripción:** "Copy 10% of enemy's highest stat as your own (permanent for this run)"
- **Mecánica:**
  - Al matar un enemigo: analiza sus stats
  - Encuentra el stat más alto
  - Copia el 10% de ese stat
  - Se acumula durante toda la run
  - Si el stat más alto es HP: aumenta tu max HP
  - Si es Attack: aumenta tu attack, etc.
- **Sinergias:**
  - Con Execute: más kills = más stats
  - Con builds de daño: más probabilidad de kills
  - Escala con el progreso: enemigos más fuertes = más stats

#### 13. **⚗️ Potion Master** (Heal Over Time)
- **Icono:** ⚗️
- **Descripción:** "Heal 3% max HP every 3 seconds, but lose 1% max HP permanently each floor"
- **Mecánica:**
  - Trade-off: curación constante vs HP máximo
  - Cada 3 segundos en combate: cura 3% max HP
  - Al avanzar de floor: `maxHp *= 0.99` (pierde 1%)
  - El HP actual se ajusta proporcionalmente
- **Sinergias:**
  - Con Fortify: compensa la pérdida de HP
  - Con Lifesteal: curación doble
  - Con builds de largo plazo: trade-off interesante

#### 14. **🎲 Lucky Strike** (RNG Double Proc)
- **Icono:** 🎲
- **Descripción:** "15% chance for any effect to trigger twice (crits, double strike, etc.)"
- **Mecánica:**
  - Añade un "double proc" chance a todos los efectos RNG
  - Si tienes Double Strike (15%) + Lucky Strike (15%): 
    - Chance de double strike normal: 15%
    - Chance de double proc: 15% * 15% = 2.25%
    - Total: 15% + 2.25% = 17.25% chance total
  - Funciona con críticos, double strike, blink, etc.
- **Sinergias:**
  - Con Double Strike: posibilidad de 4 ataques
  - Con Critical Mass: críticos dobles
  - Con cualquier efecto RNG: potencial de double proc

#### 15. **⚡ Energy Surge** (Cooldown Burst)
- **Icono:** ⚡
- **Descripción:** "Every 4 seconds, next attack deals 2.5x damage and cannot miss"
- **Mecánica:**
  - Timer de 4 segundos
  - Cuando se activa: el siguiente ataque hace 2.5x daño
  - Ese ataque no puede fallar (ignora evasion/dodge)
  - Se resetea cada combate
- **Sinergias:**
  - Con Critical Mass: 2.5x base + 2.5x crit = 6.25x damage
  - Con Execute: combo masivo en enemigos bajos
  - Con First Blood: primer hit garantizado potente

---

## 📊 Resumen por Categoría

### Sistema de Escudo (2):
1. **Diamond Shield** - Escudo base que previene críticos
2. **Shield Battery** - Regeneración de escudo

### Ofensivas (5):
3. **Rage Combo** - Combo system (más daño por hits consecutivos)
4. **Weak Point** - Defense ignore scaling
5. **Overkill** - Excess damage conversion to healing
6. **Spite** - Low HP offensive (30% threshold)
7. **Burst Fire** - First 3 attacks faster

### Defensivas (4):
8. **Battle Hardened** - Defense stacking on hit
9. **Blink** - Dodge chance (20%)
10. **Damage Absorb** - Shield from damage taken
11. **Retaliate** - Counter-attack on hit

### Híbridas/Utilidad (4):
12. **Stat Mirror** - Copy enemy stats on kill
13. **Potion Master** - Heal over time but lose max HP
14. **Lucky Strike** - Double proc chance
15. **Energy Surge** - Cooldown burst damage

---

## 🎮 Sinergias Destacadas

### Combo "Shield Tank":
- **Diamond Shield** + **Shield Battery** + **Damage Absorb** = Escudo masivo y renovable que previene críticos

### Combo "Glass Cannon":
- **Spite** + **Adrenaline** + **Vampire** = Bajo HP pero súper rápido con daño masivo + curación

### Combo "Combo Master":
- **Rage Combo** + **Burst Fire** + **First Blood** + **Double Strike** = Combo inicial masivo

### Combo "Stat Stealing":
- **Stat Mirror** + **Execute** + **Overkill** = Acumulación de stats mientras matas enemigos

### Combo "RNG Chaos":
- **Lucky Strike** + **Double Strike** + **Blink** + **Critical Mass** = Todo puede pasar dos veces

---

## ⚖️ Balance y Consideraciones

### Mecánicas Nuevas:
1. **Sistema de Shield** (Diamond Shield, Shield Battery, Damage Absorb)
   - Prevención de críticos mientras hay escudo
   - Escudo se muestra como HP+Shield
   - Visual: barra azul que representa el porcentaje de escudo

2. **Combo System** (Rage Combo)
   - Stacking de daño por hits consecutivos
   - Resetea al fallar

3. **Stat Stealing** (Stat Mirror)
   - Copia stats de enemigos al matarlos
   - Se acumula durante toda la run

4. **Trade-off Mechanics** (Potion Master)
   - Curación constante vs pérdida de HP máximo
   - Interesante para builds de largo plazo

### Reliquias que requieren atención:
- **Stat Mirror**: Puede escalar demasiado en runs largas (necesita cap o limitación)
- **Potion Master**: Pérdida de HP puede ser demasiado en runs muy largas
- **Diamond Shield**: Sistema nuevo, necesita testing de visual y mecánica

---

## 🚀 Prioridad de Implementación

### Fase 1 (Sistema de Shield - Prioridad):
1. **Diamond Shield** ⭐ (IMPLEMENTAR PRIMERO)
2. **Shield Battery**

### Fase 2 (Mecánicas Simples):
3. **Spite**
4. **Blink**
5. **Retaliate**
6. **Burst Fire**

### Fase 3 (Mecánicas Medianas):
7. **Rage Combo**
8. **Weak Point**
9. **Overkill**
10. **Battle Hardened**
11. **Damage Absorb**

### Fase 4 (Mecánicas Complejas):
12. **Stat Mirror**
13. **Potion Master**
14. **Lucky Strike**
15. **Energy Surge**

---

## 💡 Notas de Diseño

- **Diamond Shield** es la reliquia principal con la mecánica de escudo mejorada
- Todas las reliquias ofrecen mecánicas únicas no duplicadas
- El sistema de escudo previene críticos mientras está activo (mecánica única)
- Se añaden sistemas de combo, stat stealing, y trade-offs interesantes
- Las sinergias son variadas y ofrecen diferentes estilos de juego

