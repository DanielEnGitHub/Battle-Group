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
  // Escritura atómica: escribe en tmp y renombra para evitar JSON corrupto
  // si el proceso muere a mitad de la escritura.
  const tmp = QUIZZES_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, QUIZZES_FILE);
}

// ── Game state ────────────────────────────────────────────────────────────────

const DEFAULT_TOTAL_POINTS = 12;

function createInitialState() {
  return {
    phase: 'lobby',
    teams: {},
    currentQuiz: null,
    questions: [],
    currentQuestionIndex: -1,
    questionStartTime: null,
    answers: {},
    nextJoinIndex: 0,
    totalPoints: DEFAULT_TOTAL_POINTS, // max score; split evenly across the round's questions
    finalStandings: [], // frozen when the game ends so the podium can't shift
    podiumStage: 0,     // 0 = hidden, then one step per podium place, last step = full table
  };
}

let game = createInitialState();

// Timers de gracia por desconexión — el equipo se borra si no reconecta en TTL.
const DISCONNECT_TTL = 5 * 60 * 1000;
const disconnectTimers = {};

// Tolerates network latency between the client timer hitting zero and the answer arriving.
const LATE_ANSWER_GRACE_MS = 1500;
// Short pause after the last answer so that player sees their confirmation before the reveal.
const ALL_ANSWERED_DELAY_MS = 1000;

// Closes the current question automatically (time over or everyone answered).
let questionTimer = null;
function clearQuestionTimer() {
  clearTimeout(questionTimer);
  questionTimer = null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTeamsSorted() {
  return Object.values(game.teams)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTime - b.totalTime;
    })
    .map(({ optionOrder, ...publicTeam }) => publicTeam);
}

function getStateSnapshot() {
  return {
    phase: game.phase,
    teams: getTeamsSorted(),
    quizName: game.currentQuiz?.name ?? null,
    totalQuestions: game.questions.length,
    bankSize: game.currentQuiz?.questions.length ?? 0,
    currentQuestionIndex: game.currentQuestionIndex,
  };
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function baseQuestionPayload(q, index) {
  return {
    index,
    total: game.questions.length,
    text: q.text,
    options: q.options,
    img: q.img ?? null,
    timeLimit: q.timeLimit,
  };
}

// optionOrder[shuffledPosition] = originalOptionIndex. Lives on the team so it survives reconnects.
function ensureOptionOrder(team, q) {
  if (!team.optionOrder || team.optionOrder.length !== q.options.length) {
    team.optionOrder = shuffle(q.options.map((_, i) => i));
  }
  return team.optionOrder;
}

function playerQuestionPayload(team, q, index) {
  const order = ensureOptionOrder(team, q);
  return { ...baseQuestionPayload(q, index), options: order.map(i => q.options[i]) };
}

function podiumPayload() {
  const all = game.finalStandings;
  return { podium: all.slice(0, 3), all, stage: game.podiumStage, totalPoints: game.totalPoints };
}

// One step per podium place (3rd → 1st) plus a final step for the full table
function podiumMaxStage() {
  return game.finalStandings.slice(0, 3).length + 1;
}

function timeLeftMs(q) {
  return Math.max(0, q.timeLimit * 1000 - (Date.now() - game.questionStartTime));
}

function resultsPayload() {
  return {
    answers: Object.entries(game.answers).map(([sid, a]) => ({
      teamName: game.teams[sid]?.name ?? '?',
      correct: a.correct,
      timeMs: a.timeMs,
    })),
  };
}

// Players only get their own correct option; standings stay hidden until the podium
function playerResultsPayload(team, q) {
  return { correctIndex: ensureOptionOrder(team, q).indexOf(q.correctIndex) };
}

function revealResults() {
  if (game.phase !== 'question') return;
  clearQuestionTimer();
  game.phase = 'results';
  const q = game.questions[game.currentQuestionIndex];

  io.to('admin').emit('question_results', { ...resultsPayload(), correctIndex: q.correctIndex });
  Object.values(game.teams).forEach(team => {
    io.to(team.socketId).emit('question_results', playerResultsPayload(team, q));
  });
}

function connectedTeamIds() {
  return Object.keys(game.teams).filter(sid => !disconnectTimers[sid]);
}

function revealIfEveryoneAnswered() {
  if (game.phase !== 'question') return;
  const connected = connectedTeamIds();
  if (connected.length === 0 || !connected.every(sid => game.answers[sid])) return;
  clearQuestionTimer();
  questionTimer = setTimeout(revealResults, ALL_ANSWERED_DELAY_MS);
}

function advanceQuestion() {
  clearQuestionTimer();
  const nextIdx = game.currentQuestionIndex + 1;

  if (nextIdx >= game.questions.length) {
    game.phase = 'podium';
    game.finalStandings = getTeamsSorted();
    game.podiumStage = 0;
    io.emit('game_over', podiumPayload());
    return;
  }

  game.currentQuestionIndex = nextIdx;
  game.phase = 'question';
  game.answers = {};
  game.questionStartTime = Date.now();

  const q = game.questions[nextIdx];
  questionTimer = setTimeout(revealResults, q.timeLimit * 1000 + LATE_ANSWER_GRACE_MS);
  Object.values(game.teams).forEach(team => {
    team.optionOrder = null;
    io.to(team.socketId).emit('question_start', playerQuestionPayload(team, q, nextIdx));
  });
  io.to('admin').emit('question_start', {
    ...baseQuestionPayload(q, nextIdx),
    correctIndex: q.correctIndex,
  });
}

function getLanIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i.family === 'IPv4' && !i.internal)
    .map(i => i.address);
}

// ── REST API ──────────────────────────────────────────────────────────────────

app.get('/api/network', (_req, res) => res.json({ ips: getLanIps() }));

app.get('/api/quizzes', (_req, res) => res.json(readQuizzes()));

app.post('/api/quizzes', (req, res) => {
  try {
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
  } catch (err) {
    console.error('[POST /quizzes]', err);
    res.status(500).json({ error: 'Error al guardar el quiz' });
  }
});

app.put('/api/quizzes/:id', (req, res) => {
  try {
    const quizzes = readQuizzes();
    const idx = quizzes.findIndex(q => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
    quizzes[idx] = { ...quizzes[idx], name: req.body.name, questions: req.body.questions };
    writeQuizzes(quizzes);
    res.json(quizzes[idx]);
  } catch (err) {
    console.error('[PUT /quizzes]', err);
    res.status(500).json({ error: 'Error al actualizar el quiz' });
  }
});

app.delete('/api/quizzes/:id', (req, res) => {
  try {
    writeQuizzes(readQuizzes().filter(q => q.id !== req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /quizzes]', err);
    res.status(500).json({ error: 'Error al eliminar el quiz' });
  }
});

// ── Socket.io ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // ── Admin ─────────────────────────────────────────────────────────────────

  socket.on('admin_join', () => {
    socket.join('admin');
    socket.emit('game_state', getStateSnapshot());

    // Catch-up so a reloaded admin screen lands on the live question/results/podium
    if ((game.phase === 'question' || game.phase === 'results') && game.questions.length) {
      const q = game.questions[game.currentQuestionIndex];
      socket.emit('question_start', {
        ...baseQuestionPayload(q, game.currentQuestionIndex),
        correctIndex: q.correctIndex,
        timeLeftMs: timeLeftMs(q),
      });
      socket.emit('answer_received', { answersCount: Object.keys(game.answers).length });
      if (game.phase === 'results') {
        socket.emit('question_results', { ...resultsPayload(), correctIndex: q.correctIndex });
      }
    } else if (game.phase === 'podium') {
      socket.emit('game_over', podiumPayload());
    }
    console.log('Admin conectado');
  });

  socket.on('select_quiz', ({ quizId }) => {
    const quiz = readQuizzes().find(q => q.id === quizId);
    if (!quiz) return socket.emit('server_error', 'Quiz no encontrado');
    game.currentQuiz = quiz;
    game.questions = [];
    game.phase = 'lobby';
    game.currentQuestionIndex = -1;
    game.answers = {};
    io.emit('game_state', getStateSnapshot());
  });

  socket.on('start_game', ({ questionCount, timeLimit, totalPoints } = {}) => {
    if (!game.currentQuiz || game.phase !== 'lobby') return;
    const bank = game.currentQuiz.questions;
    const count = Math.round(clampNumber(questionCount, 1, bank.length, bank.length));
    const seconds = Math.round(clampNumber(timeLimit, 5, 300, 20));

    game.totalPoints = clampNumber(totalPoints, 1, 1000, DEFAULT_TOTAL_POINTS);
    game.questions = shuffle(bank).slice(0, count).map(q => ({ ...q, timeLimit: seconds }));
    game.currentQuestionIndex = -1;
    advanceQuestion();
  });

  socket.on('next_question', () => {
    if (!game.questions.length || game.phase === 'podium') return;
    advanceQuestion();
  });

  socket.on('reveal_results', revealResults);

  socket.on('podium_next', () => {
    if (game.phase !== 'podium' || game.podiumStage >= podiumMaxStage()) return;
    game.podiumStage += 1;
    io.emit('podium_stage', game.podiumStage);
  });

  // New game with the same players. Disconnect timers are kept so absent players still expire.
  socket.on('reset_game', () => {
    clearQuestionTimer();
    const preservedNextJoinIndex = game.nextJoinIndex;
    const preservedTeams = Object.fromEntries(
      Object.entries(game.teams).map(([sid, team]) => [
        sid,
        { ...team, score: 0, totalTime: 0, optionOrder: null },
      ])
    );

    game = createInitialState();
    game.teams = preservedTeams;
    game.nextJoinIndex = preservedNextJoinIndex;
    io.emit('game_state', getStateSnapshot());
    console.log('Juego reiniciado');
  });

  // Ends every player session and clears the room
  socket.on('end_session', () => {
    clearQuestionTimer();
    Object.keys(disconnectTimers).forEach(sid => {
      clearTimeout(disconnectTimers[sid]);
      delete disconnectTimers[sid];
    });
    io.to('players').emit('session_ended');
    io.in('players').socketsLeave('players');

    game = createInitialState();
    io.emit('game_state', getStateSnapshot());
    console.log('Sesión terminada por el admin');
  });

  // ── Player ────────────────────────────────────────────────────────────────

  // `resume` is set when a device restores a saved session; it must never create a new player
  socket.on('join_room', ({ teamName, sessionId, resume }) => {
    const name = teamName?.trim();
    if (!name) return socket.emit('join_error', { message: 'Nombre inválido' });

    const reconnect = Object.entries(game.teams).find(([, t]) => t.sessionId === sessionId);
    if (!reconnect && resume) return socket.emit('session_expired');
    if (reconnect) {
      const [oldSid, data] = reconnect;
      if (disconnectTimers[oldSid]) {
        clearTimeout(disconnectTimers[oldSid]);
        delete disconnectTimers[oldSid];
      }
      delete game.teams[oldSid];
      game.teams[socket.id] = { ...data, socketId: socket.id };
      if (game.answers[oldSid]) {
        game.answers[socket.id] = game.answers[oldSid];
        delete game.answers[oldSid];
      }
      console.log(`Reconectado: ${name}`);
    } else {
      if (Object.values(game.teams).some(t => t.name === name)) {
        return socket.emit('join_error', {
          message: `"${name}" ya está en uso. Elige otro nombre.`,
        });
      }
      game.teams[socket.id] = {
        socketId: socket.id,
        sessionId,
        name,
        score: 0,
        totalTime: 0,
        joinIndex: game.nextJoinIndex++,
      };
      console.log(`Nuevo equipo: ${name}`);
    }

    socket.join('players');
    socket.emit('join_success', { team: game.teams[socket.id] });
    socket.emit('game_state', getStateSnapshot());

    // Catch-up if a question, its results, or the podium are live
    if ((game.phase === 'question' || game.phase === 'results') && game.questions.length) {
      const team = game.teams[socket.id];
      const q = game.questions[game.currentQuestionIndex];
      socket.emit('question_start', {
        ...playerQuestionPayload(team, q, game.currentQuestionIndex),
        timeLeftMs: timeLeftMs(q),
      });
      if (game.answers[socket.id]) {
        socket.emit('answer_result', game.answers[socket.id]);
      }
      if (game.phase === 'results') {
        socket.emit('question_results', playerResultsPayload(team, q));
      }
    } else if (game.phase === 'podium') {
      socket.emit('game_over', podiumPayload());
    }

    io.emit('teams_update', getTeamsSorted());
  });

  socket.on('submit_answer', ({ optionIndex }) => {
    if (game.phase !== 'question') return;
    if (game.answers[socket.id]) return;
    const team = game.teams[socket.id];
    if (!team) return;

    const q = game.questions[game.currentQuestionIndex];
    const originalIndex = team.optionOrder?.[optionIndex];
    if (originalIndex === undefined) return;

    const timeMs = Date.now() - game.questionStartTime;
    if (timeMs > q.timeLimit * 1000 + LATE_ANSWER_GRACE_MS) return;
    const correct = originalIndex === q.correctIndex;
    const points = correct ? game.totalPoints / game.questions.length : 0;

    game.answers[socket.id] = { optionIndex, originalIndex, timeMs, correct, points };
    team.score = parseFloat(Math.min(team.score + points, game.totalPoints).toFixed(4));
    team.totalTime += timeMs;

    socket.emit('answer_result', { correct, points, timeMs });

    io.to('admin').emit('answer_received', {
      teamName: team.name,
      correct,
      answersCount: Object.keys(game.answers).length,
      totalTeams: Object.keys(game.teams).length,
    });

    revealIfEveryoneAnswered();
  });

  socket.on('logout', () => {
    if (disconnectTimers[socket.id]) {
      clearTimeout(disconnectTimers[socket.id]);
      delete disconnectTimers[socket.id];
    }
    delete game.teams[socket.id];
    delete game.answers[socket.id];
    console.log(`[logout] ${socket.id}`);
    io.emit('teams_update', getTeamsSorted());
    revealIfEveryoneAnswered();
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    const team = game.teams[socket.id];
    if (!team) return;

    disconnectTimers[socket.id] = setTimeout(() => {
      delete game.teams[socket.id];
      delete disconnectTimers[socket.id];
      io.emit('teams_update', getTeamsSorted());
      console.log(`[timeout] ${team.name} removido por inactividad`);
    }, DISCONNECT_TTL);

    // A dropped player shouldn't hold the question open for everyone else
    revealIfEveryoneAnswered();
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🏆  Servidor de Modo Competencia listo!');
  console.log(`    Local:   http://localhost:${PORT}`);
  getLanIps().forEach(ip => console.log(`    LAN:     http://${ip}:${PORT}`));
  console.log('');
});
