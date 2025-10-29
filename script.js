// ===================== DADOS DO JOGO =====================
const DATA = {
  biomes: [
    { id: 'amazonia', name: 'Amazônia', desc: 'Maior floresta tropical do mundo.' },
    { id: 'cerrado', name: 'Cerrado', desc: 'Savanas brasileiras ricas em biodiversidade.' },
    { id: 'caatinga', name: 'Caatinga', desc: 'Bioma semiárido com espécies adaptadas à seca.' },
    { id: 'pantanal', name: 'Pantanal', desc: 'Maior planície alagável do planeta.' },
    { id: 'mata', name: 'Mata Atlântica', desc: 'Bioma costeiro muito ameaçado.' },
    { id: 'pampa', name: 'Pampa', desc: 'Campos do sul com rica fauna e flora.' }
  ],

  problems: [
    { id: 'queimadas', name: 'Queimadas', desc: 'Fogo destrói habitats e libera CO₂.' },
    { id: 'desmatamento', name: 'Desmatamento', desc: 'Remoção da vegetação nativa.' },
    { id: 'poluicao', name: 'Poluição', desc: 'Contaminação do solo e água.' },
    { id: 'extincao', name: 'Extinção', desc: 'Perda de espécies por caça e degradação.' }
  ],

  ods: [
    { id: 4,  title: 'ODS 4 - Educação de qualidade', desc: 'Educação ambiental e conscientização.', points: 30 },
    { id: 13, title: 'ODS 13 - Ação climática', desc: 'Combate às mudanças climáticas.', points: 40 },
    { id: 15, title: 'ODS 15 - Vida terrestre', desc: 'Proteção de ecossistemas.', points: 35 },
    { id: 6,  title: 'ODS 6 - Água potável e saneamento', desc: 'Preservação de recursos hídricos.', points: 20 }
  ]
};


// ===================== ESTADO DO JOGO =====================
let state = {
  remaining: [],
  total: 0,
  current: {},
  rounds: []
};


// ===================== UTILIDADES =====================
const $ = (s) => document.querySelector(s);

const screens = {
  start:   $('#start-screen'),
  biome:   $('#biome-screen'),
  problem: $('#problem-screen'),
  ods:     $('#ods-screen'),
  result:  $('#result-screen'),
  final:   $('#final-screen')
};

function show(screenName) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenName].classList.add('active');
}


// ===================== SOM SIMPLES =====================
let ctx;

function beep(f = 440, t = 0.05) {
  if (!window.AudioContext) return;
  if (!ctx) ctx = new AudioContext();

  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.frequency.value = f;
  g.gain.value = 0.02;

  o.connect(g);
  g.connect(ctx.destination);
  o.start();

  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t);
  o.stop(ctx.currentTime + t + 0.01);
}


// ===================== INICIALIZAÇÃO =====================
function init() {
  state.remaining = DATA.biomes.map(b => b.id);
  state.total = 0;
  state.rounds = [];

  renderMap();
  updateProgress(0);
  show('biome');
}


// ===================== MAPA DE BIOMAS =====================
function renderMap() {
  const map = $('#biome-map');

  map.querySelectorAll('.biome-point').forEach(btn => {
    const id = btn.dataset.id;
    btn.disabled = !state.remaining.includes(id);
    btn.onclick = () => moveRocketTo(id);
  });
}


// ===================== ANIMAÇÃO DO FOGUETE =====================
function moveRocketTo(id) {
  const btn = document.querySelector(`.biome-point[data-id='${id}']`);
  const rocket = $('#rocket');
  const rectMap = btn.parentElement.getBoundingClientRect();
  const rectBtn = btn.getBoundingClientRect();

  const top = rectBtn.top - rectMap.top + btn.offsetHeight / 2;
  const left = rectBtn.left - rectMap.left + btn.offsetWidth / 2;

  rocket.style.top = `${top}px`;
  rocket.style.left = `${left}px`;
  rocket.style.transform = 'translate(-50%, -50%) rotate(20deg)';

  beep(660, 0.08);

  setTimeout(() => selectBiome(id), 1000);
}


// ===================== ETAPA 1 - ESCOLHA DO BIOMA =====================
function selectBiome(id) {
  const b = DATA.biomes.find(x => x.id === id);
  state.current.biome = b;

  $('#biome-title').textContent = b.name;
  $('#biome-desc').textContent = b.desc;

  const list = $('#problem-list');
  list.innerHTML = '';

  DATA.problems.forEach(p => {
    const div = document.createElement('div');
    div.className = 'option';
    div.innerHTML = `<strong>${p.name}</strong><br><small>${p.desc}</small>`;
    div.onclick = () => selectProblem(p.id);
    list.appendChild(div);
  });

  show('problem');
}


// ===================== ETAPA 2 - ESCOLHA DO PROBLEMA =====================
function selectProblem(id) {
  const p = DATA.problems.find(x => x.id === id);
  state.current.problem = p;

  $('#problem-title').textContent = p.name;
  $('#problem-desc').textContent = p.desc;

  const list = $('#ods-list');
  list.innerHTML = '';

  DATA.ods.forEach(o => {
    const div = document.createElement('div');
    div.className = 'option';
    div.innerHTML = `
      <div><strong>${o.title}</strong></div>
      <small>${o.desc}</small>
      <div style="margin-top:6px;font-weight:700;color:#0b5fb1">+${o.points}</div>
    `;
    div.onclick = () => selectODS(o.id);
    list.appendChild(div);
  });

  show('ods');
}


// ===================== ETAPA 3 - ESCOLHA DO ODS =====================
function selectODS(id) {
  const o = DATA.ods.find(x => x.id === id);
  state.current.ods = o;

  beep(800, 0.1);

  // Atualiza progresso
  state.rounds.push({
    biome: state.current.biome,
    problem: state.current.problem,
    ods: o
  });

  state.total += o.points;
  state.remaining = state.remaining.filter(x => x !== state.current.biome.id);

  $('#choice-summary').innerHTML = `
    ${state.current.biome.name} → ${state.current.problem.name}<br>
    Você escolheu <strong>${o.title}</strong>
  `;

  $('#round-score').textContent = o.points;
  $('#total-score').textContent = state.total;

  updateProgress();
  show('result');
}


// ===================== PRÓXIMO BIOMA =====================
function nextBiome() {
  if (state.remaining.length > 0) {
    renderMap();
    show('biome');
  } else {
    showFinal();
  }
}


// ===================== BARRA DE PROGRESSO =====================
function updateProgress() {
  const total = DATA.biomes.length;
  const done = total - state.remaining.length;
  const pct = (done / total) * 100;

  $('#progress-bar').style.width = pct + '%';
}


// ===================== TELA FINAL =====================
function showFinal() {
  const max = DATA.biomes.length * 40;
  const pct = (state.total / max) * 100;

  let msg = pct > 80
    ? 'Excelente! 🌟'
    : 'Bom trabalho! Continue aprendendo 🌿';

  const resumo = state.rounds
    .map(r => `• ${r.biome.name} — ${r.problem.name} → ${r.ods.title} (+${r.ods.points})`)
    .join('<br>');

  $('#final-score').textContent = state.total;
  $('#final-text').innerHTML = `${msg}<br><br><strong>Resumo:</strong><br>${resumo}`;

  show('final');
}


// ===================== EVENTOS =====================
document.addEventListener('DOMContentLoaded', () => {
  show('start');

  $('#start-btn').onclick = () => {
    beep(520, 0.05);
    init();
  };

  $('#biome-back').onclick   = () => show('start');
  $('#problem-back').onclick = () => show('biome');
  $('#ods-back').onclick     = () => show('problem');
  $('#next-biome').onclick   = () => nextBiome();
  $('#play-again').onclick   = () => init();
});
