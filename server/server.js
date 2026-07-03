const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// ── Cuadro del Mundial (semilla editable a mano) ────────────────────────────────

const BRACKET_FILE = path.join(__dirname, 'worldcup2026.json');

function readBracket() {
  return JSON.parse(fs.readFileSync(BRACKET_FILE, 'utf-8'));
}

// ── Persistencia de predicciones ────────────────────────────────────────────────
// No es una DB: es un JSON plano. El "guardar de verdad" es la captura del admin.
// Escritura atómica (tmp + rename) para no corromper el archivo si el proceso muere.

const PREDICTIONS_FILE = path.join(__dirname, 'predictions.json');

function readPredictions() {
  try { return JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf-8')); }
  catch { return []; }
}

function writePredictions(data) {
  const tmp = PREDICTIONS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, PREDICTIONS_FILE);
}

// ── REST API ──────────────────────────────────────────────────────────────────

// Cuadro base: partidos bloqueados (reales) + estructura de llaves.
app.get('/api/bracket', (_req, res) => {
  try { res.json(readBracket()); }
  catch (err) {
    console.error('[GET /bracket]', err);
    res.status(500).json({ error: 'No se pudo leer el cuadro' });
  }
});

// Jugador envía su predicción completa.
app.post('/api/predictions', (req, res) => {
  try {
    const { groupName, members, picks } = req.body;
    const cleanMembers = Array.isArray(members)
      ? members.map(m => String(m).trim()).filter(Boolean)
      : [];

    if (!cleanMembers.length) {
      return res.status(400).json({ error: 'Agregá al menos un integrante' });
    }

    const predictions = readPredictions();
    const prediction = {
      id: `pred_${Date.now()}`,
      groupName: String(groupName ?? '').trim(),
      members: cleanMembers,
      picks: picks ?? {},
      createdAt: new Date().toISOString(),
    };
    predictions.push(prediction);
    writePredictions(predictions);
    res.status(201).json(prediction);
  } catch (err) {
    console.error('[POST /predictions]', err);
    res.status(500).json({ error: 'No se pudo guardar la predicción' });
  }
});

// Admin ve todas las predicciones para revisarlas / capturarlas.
app.get('/api/predictions', (_req, res) => res.json(readPredictions()));

// Limpia la tabla completa.
app.delete('/api/predictions', (_req, res) => {
  try {
    writePredictions([])
    res.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /predictions]', err)
    res.status(500).json({ error: 'No se pudo limpiar' })
  }
})

app.delete('/api/predictions/:id', (req, res) => {
  try {
    writePredictions(readPredictions().filter(p => p.id !== req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /predictions]', err);
    res.status(500).json({ error: 'No se pudo eliminar' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  const lanIps = Object.values(os.networkInterfaces())
    .flat()
    .filter(i => i.family === 'IPv4' && !i.internal)
    .map(i => `    LAN:     http://${i.address}:${PORT}`);

  console.log('\n🏆  Versus — Simulador Mundial 2026 listo!');
  console.log(`    Local:   http://localhost:${PORT}`);
  lanIps.forEach(l => console.log(l));
  console.log('');
});
