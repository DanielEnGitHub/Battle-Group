const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// ── Quiz persistence ──────────────────────────────────────────────────────────

const QUIZZES_FILE = path.join(__dirname, 'quizzes.json');

function readQuizzes() {
  try { return JSON.parse(fs.readFileSync(QUIZZES_FILE, 'utf-8')); }
  catch { return []; }
}

function writeQuizzes(data) {
  fs.writeFileSync(QUIZZES_FILE, JSON.stringify(data, null, 2));
}

// ── Game state ────────────────────────────────────────────────────────────────

function createInitialState() {
  return {
    phase: 'lobby',           // 'lobby' | 'question' | 'results' | 'podium'
    teams: {},                // { [socketId]: Team }
    currentQuiz: null,
    currentQuestionIndex: -1,
    questionStartTime: null,
    answers: {},              // { [socketId]: { optionIndex, timeMs, correct, points } }
    nextJoinIndex: 0,         // contador para asignar carril fijo al registrarse
  };
}

let game = createInitialState();

// Timers de limpieza por desconexión: { [socketId]: timeoutId }
// El equipo se borra sólo si no reconecta en DISCONNECT_TTL ms.
const DISCONNECT_TTL = 5 * 60 * 1000; // 5 minutos
const disconnectTimers = {};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTeamsSorted() {
  return Object.values(game.teams).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTime - b.totalTime;
  });
}

function getRacePositions() {
  const sorted = getTeamsSorted(); // ordenado por score → sirve para calcular rank
  const rankMap = new Map(sorted.map((t, i) => [t.socketId, i]));

  // Devuelve en orden de registro (joinIndex fijo = carril fijo)
  return Object.values(game.teams)
    .sort((a, b) => a.joinIndex - b.joinIndex)
    .map(t => ({
      ...t,
      rank: rankMap.get(t.socketId) ?? 0,
      progress: Math.min(t.score / 12, 1),
    }));
}

function getStateSnapshot() {
  return {
    phase: game.phase,
    teams: getTeamsSorted(),
    quizName: game.currentQuiz?.name ?? null,
    totalQuestions: game.currentQuiz?.questions.length ?? 0,
    currentQuestionIndex: game.currentQuestionIndex,
  };
}

// ── REST API ──────────────────────────────────────────────────────────────────

app.get('/api/quizzes', (_req, res) => res.json(readQuizzes()));

app.post('/api/quizzes', (req, res) => {
  const quizzes = readQuizzes();
  const quiz = {
    id: `quiz_${Date.now()}`,
    name: req.body.name,
    questions: req.body.questions || [],
    createdAt: new Date().toISOString(),
  };
  quizzes.push(quiz);
  writeQuizzes(quizzes);
  res.status(201).json(quiz);
});

app.put('/api/quizzes/:id', (req, res) => {
  const quizzes = readQuizzes();
  const idx = quizzes.findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  quizzes[idx] = { ...quizzes[idx], name: req.body.name, questions: req.body.questions };
  writeQuizzes(quizzes);
  res.json(quizzes[idx]);
});

app.delete('/api/quizzes/:id', (req, res) => {
  writeQuizzes(readQuizzes().filter(q => q.id !== req.params.id));
  res.json({ ok: true });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // ── Admin ─────────────────────────────────────────────────────────────────

  socket.on('admin_join', () => {
    socket.join('admin');
    socket.emit('game_state', getStateSnapshot());
    console.log('Admin conectado');
  });

  socket.on('select_quiz', ({ quizId }) => {
    const quiz = readQuizzes().find(q => q.id === quizId);
    if (!quiz) return socket.emit('server_error', 'Quiz no encontrado');
    game.currentQuiz = quiz;
    game.phase = 'lobby';
    game.currentQuestionIndex = -1;
    game.answers = {};
    io.emit('game_state', getStateSnapshot());
  });

  socket.on('next_question', () => {
    if (!game.currentQuiz) return;
    const nextIdx = game.currentQuestionIndex + 1;

    if (nextIdx >= game.currentQuiz.questions.length) {
      game.phase = 'podium';
      // El podio usa orden por puntaje, no por carril
      const byScore = getTeamsSorted();
      const podiumData = {
        podium: byScore.slice(0, 3),
        all:    byScore,
      };
      io.emit('game_over', podiumData);
      return;
    }

    game.currentQuestionIndex = nextIdx;
    game.phase = 'question';
    game.answers = {};
    game.questionStartTime = Date.now();

    const q = game.currentQuiz.questions[nextIdx];
    const base = {
      index: nextIdx,
      total: game.currentQuiz.questions.length,
      text: q.text,
      options: q.options,
      timeLimit: q.timeLimit ?? 30,
    };

    // Jugadores NO ven el índice correcto
    io.to('players').emit('question_start', base);
    // Admin sí lo ve
    io.to('admin').emit('question_start', { ...base, correctIndex: q.correctIndex });
  });

  socket.on('reveal_results', () => {
    if (game.phase !== 'question') return;
    game.phase = 'results';
    const q = game.currentQuiz.questions[game.currentQuestionIndex];

    io.emit('question_results', {
      correctIndex: q.correctIndex,
      answers: Object.entries(game.answers).map(([sid, a]) => ({
        teamName: game.teams[sid]?.name ?? '?',
        correct: a.correct,
        timeMs: a.timeMs,
      })),
      leaderboard: getRacePositions(),
    });
  });

  socket.on('reset_game', () => {
    const preservedTeams = Object.fromEntries(
      Object.entries(game.teams).map(([sid, team]) => [
        sid,
        { ...team, score: 0, totalTime: 0, hasParticipated: false },
      ])
    );
    const preservedNextJoinIndex = game.nextJoinIndex;
    game = createInitialState();
    game.teams = preservedTeams;
    game.nextJoinIndex = preservedNextJoinIndex; // mantener carriles
    io.emit('game_state', getStateSnapshot());
    console.log('Juego reiniciado');
  });

  // ── Player ────────────────────────────────────────────────────────────────

  socket.on('join_room', ({ teamName, sessionId }) => {
    const name = teamName?.trim();
    if (!name) return socket.emit('join_error', { message: 'Nombre inválido' });

    // Buscar reconexión por sessionId
    const reconnect = Object.entries(game.teams).find(([, t]) => t.sessionId === sessionId);
    if (reconnect) {
      const [oldSid, data] = reconnect;
      // Cancelar el timer de limpieza si estaba pendiente
      if (disconnectTimers[oldSid]) {
        clearTimeout(disconnectTimers[oldSid]);
        delete disconnectTimers[oldSid];
      }
      delete game.teams[oldSid];
      game.teams[socket.id] = { ...data, socketId: socket.id };
      console.log(`Reconectado: ${name}`);
    } else {
      // Verificar nombre duplicado
      if (Object.values(game.teams).some(t => t.name === name)) {
        return socket.emit('join_error', {
          message: `"${name}" ya está en uso. Elegí otro nombre.`,
        });
      }
      game.teams[socket.id] = {
        socketId: socket.id,
        sessionId,
        name,
        score: 0,
        totalTime: 0,
        hasParticipated: false,
        joinIndex: game.nextJoinIndex++, // carril fijo para siempre
      };
      console.log(`Nuevo equipo: ${name}`);
    }

    socket.join('players');
    socket.emit('join_success', { team: game.teams[socket.id] });
    socket.emit('game_state', getStateSnapshot());
    io.to('admin').emit('teams_update', getTeamsSorted());
  });

  socket.on('submit_answer', ({ optionIndex }) => {
    if (game.phase !== 'question') return;
    if (game.answers[socket.id]) return;        // No doble envío
    if (!game.teams[socket.id]) return;

    const timeMs = Date.now() - game.questionStartTime;
    const q = game.currentQuiz.questions[game.currentQuestionIndex];
    const correct = optionIndex === q.correctIndex;
    const pointsPerQ = 12 / game.currentQuiz.questions.length;
    const points = correct ? pointsPerQ : 0;

    game.answers[socket.id] = { optionIndex, timeMs, correct, points };
    game.teams[socket.id].hasParticipated = true;
    game.teams[socket.id].score = parseFloat(
      Math.min(game.teams[socket.id].score + points, 12).toFixed(4)
    );
    game.teams[socket.id].totalTime += timeMs;

    // Confirmar al jugador
    socket.emit('answer_result', { correct, points, timeMs });

    // Notificar al admin
    io.to('admin').emit('answer_received', {
      teamName: game.teams[socket.id].name,
      correct,
      answersCount: Object.keys(game.answers).length,
      totalTeams: Object.keys(game.teams).length,
    });

    // Actualizar carrera en todos los dispositivos
    io.emit('race_update', getRacePositions());
  });

  // ── Logout explícito (botón "Salir") ─────────────────────────────────────

  socket.on('logout', () => {
    // El jugador eligió salir → siempre se borra de inmediato.
    if (disconnectTimers[socket.id]) {
      clearTimeout(disconnectTimers[socket.id]);
      delete disconnectTimers[socket.id];
    }
    delete game.teams[socket.id];
    console.log(`[logout] ${socket.id}`);
    io.to('admin').emit('teams_update', getTeamsSorted());
  });

  // ── Disconnect ────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    const team = game.teams[socket.id];
    if (!team) return;

    // No borrar inmediatamente: dar un período de gracia para reconexión.
    // Si el jugador no vuelve en DISCONNECT_TTL ms → se limpia solo.
    disconnectTimers[socket.id] = setTimeout(() => {
      delete game.teams[socket.id];
      delete disconnectTimers[socket.id];
      io.to('admin').emit('teams_update', getTeamsSorted());
      console.log(`[timeout] ${team.name} removido por inactividad`);
    }, DISCONNECT_TTL);

    // El admin ve al equipo "aún presente" hasta que expire el timer.
    io.to('admin').emit('teams_update', getTeamsSorted());
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  const lanIps = Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i.family === 'IPv4' && !i.internal)
    .map(i => `    LAN:     http://${i.address}:${PORT}  ← compartí esta con los jugadores`);

  console.log('\n🏁  Versus Server listo!');
  console.log(`    Local:   http://localhost:${PORT}`);
  lanIps.forEach(l => console.log(l));
  console.log('\n💡  Auto-discovery futuro (sin compartir IP):');
  console.log('    Linux:  avahi-publish-service Versus _versus._tcp 3001');
  console.log('    Node:   npm i mdns  →  mdns.createAdvertisement(...)\n');
});
