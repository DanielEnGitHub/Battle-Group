# 🏎️ Battle-Group

App de trivia en tiempo real estilo Kahoot con carrera de autos. Jugadores compiten respondiendo preguntas y ven sus autos avanzar en una pista en vivo.

## Stack

- **Cliente:** React 19 + Vite + TypeScript + Tailwind v4
- **Servidor:** Node.js + Express + Socket.io
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

## Flujo de juego

1. **Admin** entra a `/admin`, crea o selecciona un quiz
2. **Jugadores** entran a `/` desde sus dispositivos y registran su equipo
3. Admin inicia la partida — las preguntas avanzan manualmente
4. Después de cada respuesta, la pista se actualiza en tiempo real para todos
5. Al finalizar todas las preguntas, se muestra el podio final con el ranking por puntaje

## Estructura del proyecto

```
Battle-Group/
├── server/          # Express + Socket.io
│   └── server.js
├── battle-group/    # React + Vite (cliente)
│   └── src/
│       ├── pages/       # AdminPage, PlayerPage
│       ├── components/  # UI por rol (admin, player, shared)
│       └── types/       # Tipos TypeScript compartidos
└── package.json     # Scripts raíz (dev, install:all)
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Levanta servidor y cliente en paralelo |
| `pnpm run install:all` | Instala dependencias de ambos servicios |
