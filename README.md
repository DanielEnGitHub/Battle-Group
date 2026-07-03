# 🏆 Versus — Simulador Mundial 2026

Simulador de predicciones del Mundial 2026. Cada grupo (1 o más integrantes) arranca en los **dieciseisavos de final** (ronda de 32): los partidos ya jugados aparecen bloqueados con su resultado real, y los pendientes los completa el jugador cargando los goles. Si un partido queda empatado, elige el ganador por penales. Los ganadores avanzan solos por el cuadro hasta la final. Al terminar, la predicción se envía al admin, que ve el cuadro de cada grupo para revisarlo o capturarlo.

> Rama del proyecto Battle-Group (trivia en vivo). Este simulador **no** usa tiempo real ni base de datos: las predicciones se guardan en un JSON plano y el "guardado de verdad" es la captura de pantalla del admin.

## Stack

- **Cliente:** React 19 + Vite + TypeScript + Tailwind v4
- **Servidor:** Node.js + Express (REST)
- **Package manager:** pnpm

## Requisitos

- Node.js 18+
- pnpm (`npm install -g pnpm`)

## Instalación

```bash
# 1. Clonar el repositorio
git clone git@github.com:DanielEnGitHub/Battle-Group.git
cd Battle-Group

# 2. Instalar dependencias (raíz + server + cliente)
pnpm install
pnpm run install:all
```

## Correr el proyecto

```bash
pnpm dev
```

Levanta ambos servicios en paralelo:

| Servicio | URL |
|----------|-----|
| Cliente (jugadores) | http://localhost:5173 |
| Servidor | http://localhost:3001 |
| Admin | http://localhost:5173/admin |

## Uso en red local (LAN)

Al iniciar el servidor, la consola muestra la IP de la red local:

```
🏁  Battle-Group Server listo!
    Local:   http://localhost:3001
    LAN:     http://192.168.x.x:3001
```

Los jugadores acceden desde sus dispositivos a `http://192.168.x.x:5173` (misma IP, puerto 5173).

## Flujo

1. **Jugadores** entran a `/` desde sus dispositivos, ponen el nombre del grupo y sus integrantes (botón "+" para sumar más)
2. Cargan los goles ronda por ronda; si hay empate, eligen ganador por penales. Los ganadores propagan solos, y el botón **Siguiente** se habilita solo cuando la ronda está completa
3. En la última ronda (la final) tocan **Finalizar y enviar** — la predicción llega al server
4. **Admin** entra a `/admin` y ve el cuadro de cada grupo para revisarlo y capturarlo

### Actualizar resultados reales

Los partidos ya jugados están en `server/worldcup2026.json`. Cada uno con `"locked": true` muestra su resultado real y no se puede predecir. Cuando termine un partido nuevo, editá ese archivo (poné el `result` y `"locked": true`) y reiniciá el server.

## Estructura del proyecto

```
Versus/
├── server/                 # Express (REST, sin sockets)
│   ├── server.js           # /api/bracket + /api/predictions
│   ├── worldcup2026.json   # Cuadro semilla (editable a mano)
│   └── predictions.json    # Predicciones enviadas (se crea solo)
├── battle-group/           # React + Vite (cliente)
│   └── src/
│       ├── pages/           # PlayerPage, AdminPage
│       ├── components/      # GroupRegister, BracketBoard, MatchCard
│       ├── lib/             # bracket.ts (resolución), api.ts
│       └── types/           # bracket.ts (tipos compartidos)
└── package.json            # Scripts raíz (dev, install:all)
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Levanta servidor y cliente en paralelo |
| `pnpm run install:all` | Instala dependencias de ambos servicios |
