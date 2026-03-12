// Datos iniciales de hábitos por categoría
const habitGroups = {
  Salud:       ["Beber 2L de agua", "Mover el cuerpo", "Comer consciente", "Dormir antes de las 12", "Calmar la mente"],
  Productividad:["Leer 10+ páginas", "Tiempo enfocado", "Plan del día", "No redes sin motivo", "1 meta clave hecha"],
  Mental:      ["3 cosas que agradezco", "Escribir cómo me siento", "Mover las piernas", "Desconectar 1h+", "Momento de calma"]
};

// Estado global de la aplicación
let screen = "start";                     // pantalla actual
let group = localStorage.getItem("group") || null;
let selectedDate = new Date().toISOString().split("T")[0];
let history = JSON.parse(localStorage.getItem("history")) || {};
let xp = parseInt(localStorage.getItem("xp") || "0");
let customHabits = JSON.parse(localStorage.getItem("customHabits")) || {
  Salud: [], Productividad: [], Mental: []
};
let assistantArea = null;                 // área seleccionada en el asistente

// Mensajes motivacionales aleatorios
const messages = [
  "Hoy es un buen día para cuidarte",
  "Pequeños hábitos = grandes cambios",
  "Tú puedes con esto... y lo estás haciendo",
  "Un día a la vez... vas genial",
  "Listo para ganar tu partida de hoy?",
  "Tu versión de mañana te lo agradece",
  "Dale que vas muy bien",
  "Vegetta777 estaria orgulloso de ti",
  "Fiera, Maquina, Lamborguini Aventador",
  "CR7 te envidia, segui asi",
  "Ni Messi hace lo que vos haces",
  "Asi es que es, fiera, como tal",
  "What's good homie?",
  "Let's do some",
  "Fiera galáctica, hasta Elon Musk te pediría tips",
  "Gato intergaláctico, conquistador de universos"
];

// Preguntas del asistente
const assistantQuestions = [
  "¿Qué hábitos deseas mejorar?",
  "¿En qué quieres enfocarte hoy?",
  "Elige un área para recibir sugerencias",
  "¿List@ para progresar? Selecciona un área",
  "¿Te gustaría un empujón en alguna categoría?"
];

// Sugerencias del asistente por categoría
const suggestions = {
  Salud: [
    "Beber un vaso de agua al despertar",
    "Comer una porción extra de verduras",
    "Ir a la cama 30 minutos antes",
    "Dar una caminata de 20 minutos",
    "Estirar cuello y espalda cada 2h",
    "Tomar té verde sin azúcar"
  ],
  Productividad: [
    "Hacer una lista de tareas matutina",
    "Desactivar notificaciones 1h",
    "Técnica Pomodoro (25m)",
    "Leer un artículo relacionado a tu trabajo",
    "Ordenar tu escritorio 10 minutos",
    "Escribir un correo importante pendiente"
  ],
  Mental: [
    "Meditar 5 minutos",
    "Escribir tres cosas positivas",
    "Escuchar música relajante",
    "Respirar profundamente 5 veces",
    "Dibujar algo simple",
    "Tomar un baño relajante"
  ]
};

// Sistema de temas desbloqueables por nivel
const themes = {
  green:   { name: 'Verde',   unlockLevel: 1,  class: 'theme-green'  },
  blue:    { name: 'Azul',    unlockLevel: 5,  class: 'theme-blue'   },
  purple:  { name: 'Morado',  unlockLevel: 10, class: 'theme-purple' },
  gold:    { name: 'Dorado',  unlockLevel: 20, class: 'theme-gold'   }
};

let currentTheme = localStorage.getItem('currentTheme') || 'green';

// ────────────────────────────────────────────────
// Funciones auxiliares
// ────────────────────────────────────────────────

function save() {
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("xp", xp);
  localStorage.setItem("group", group);
  localStorage.setItem("customHabits", JSON.stringify(customHabits));
}

function level()          { return Math.floor(xp / 100) + 1; }
function xpInLevel()      { return xp % 100; }

function randomQuestion() {
  return assistantQuestions[Math.floor(Math.random() * assistantQuestions.length)];
}

// Aplicar tema seleccionado
function applyTheme(themeName) {
  if (!themes[themeName]) return;
  currentTheme = themeName;
  document.body.className = '';
  document.body.classList.add(themes[themeName].class);
  localStorage.setItem('currentTheme', themeName);
}

function getUnlockedThemes() {
  const currentLevel = level();
  return Object.entries(themes).filter(([_, theme]) => currentLevel >= theme.unlockLevel);
}

// Mostrar notificación temporal (toast)
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fadeOut');
    setTimeout(() => toast.remove(), 600);
  }, 5000);
}

// Obtener hábitos del día seleccionado (reconstruye si es necesario)
function getHabits(date = selectedDate) {
  if (!group) return [];
  history[group] = history[group] || {};
  const base = habitGroups[group] || [];
  const extra = customHabits[group] || [];
  const expected = base.concat(extra);

  const existing = history[group][date];
  if (!existing || existing.length !== expected.length || existing.some((h,i) => h.name !== expected[i])) {
    history[group][date] = expected.map(name => ({ name, done: false }));
  }
  return history[group][date];
}

function isCustomHabit(habitName) {
  return customHabits[group]?.includes(habitName);
}

function deleteCustomHabit(habitName) {
  if (!group || !isCustomHabit(habitName)) return;
  customHabits[group] = customHabits[group].filter(h => h !== habitName);

  // Eliminar de todos los días guardados
  Object.keys(history[group] || {}).forEach(date => {
    history[group][date] = history[group][date].filter(h => h.name !== habitName);
  });

  save();
  render();
}

// ────────────────────────────────────────────────
// Interacción con hábitos
// ────────────────────────────────────────────────

function toggleHabit(index) {
  const today = new Date().toISOString().split("T")[0];
  if (selectedDate > today) {
    showToast("No puedes marcar hábitos en fechas futuras", "error");
    return;
  }

  const habits = getHabits();
  habits[index].done = !habits[index].done;

  if (habits[index].done) {
    xp += 10;
    if (navigator.vibrate) navigator.vibrate(20);
  } else {
    xp = Math.max(0, xp - 10);
  }

  checkPerfectDay();
  save();
  render();
}

function checkPerfectDay() {
  const habits = getHabits();
  const allDone = habits.every(h => h.done);
  if (allDone && !habits.bonus) {
    xp += 50;
    habits.bonus = true;
    const bonusEl = document.getElementById("bonus");
    bonusEl.style.display = "block";
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    setTimeout(() => bonusEl.style.display = "none", 2800);
  }
}

// ────────────────────────────────────────────────
// Estadísticas y cálculos
// ────────────────────────────────────────────────

function calculateCurrentStreak() {
  if (!group) return 0;
  let streak = 0;
  let date = new Date();
  while (true) {
    const d = date.toISOString().split("T")[0];
    if (history[group]?.[d]?.every(h => h.done)) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else break;
  }
  return streak;
}

function calculateBestStreak() {
  if (!group) return 0;
  const perfectDays = Object.keys(history[group] || {})
    .filter(d => history[group][d]?.every(h => h.done))
    .sort();

  if (perfectDays.length === 0) return 0;

  let max = 1, current = 1;
  for (let i = 1; i < perfectDays.length; i++) {
    const prev = new Date(perfectDays[i-1]);
    const curr = new Date(perfectDays[i]);
    if ((curr - prev) / (86400 * 1000) === 1) {
      current++;
      max = Math.max(max, current);
    } else current = 1;
  }
  return max;
}

// ────────────────────────────────────────────────
// Renderizado de pantallas
// ────────────────────────────────────────────────

function renderCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let html = '<div class="calendar-grid">';
  ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].forEach(d => {
    html += `<div class="cal-day" style="font-weight:bold;color:#777">${d}</div>`;
  });

  const startWeekday = (firstDay.getDay() || 7) - 1;
  for (let i = 0; i < startWeekday; i++) html += `<div class="cal-day"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls = "cal-day";
    if (dateStr === selectedDate) cls += " today";
    const dayHist = history[group]?.[dateStr];
    if (dayHist) {
      if (dayHist.every(h => h.done)) cls += " perfect";
      else if (dayHist.some(h => h.done)) cls += " partial";
      else cls += " empty";
    } else cls += " empty";
    html += `<div class="${cls}">${d}</div>`;
  }
  html += '</div>';
  return html;
}

function getLast7DaysData() {
  const data = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const habits = history[group]?.[dateStr];
    let status = 'empty';
    let height = 0;
    if (habits) {
      const doneCount = habits.filter(h => h.done).length;
      if (doneCount === habits.length) {
        status = 'perfect';
        height = 100;
      } else if (doneCount > 0) {
        status = 'partial';
        height = Math.max(20, (doneCount / habits.length) * 100);
      } else {
        status = 'empty';
        height = 10;
      }
    }
    data.push({ date: d.getDate(), status, height });
  }
  return data;
}

function render() {
  const content = document.getElementById("app-content");
  document.getElementById("motivation").textContent = messages[Math.floor(Math.random() * messages.length)];

  if (screen === "start") {
    content.innerHTML = `
      <h3 style="text-align:center; margin:30px 0 40px;">¿Qué área quieres mejorar hoy?</h3>
      ${Object.keys(habitGroups).map(g => `
        <button onclick="selectGroup('${g}')">${g}</button>
      `).join('')}
      <button onclick="goAssistant()" style="margin-top:20px; background:#1976d2;">Asistente</button>
    `;
    return;
  }

  const habits = getHabits();
  const doneCount = habits.filter(h => h.done).length;
  const progress = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;

  if (screen === "assistant") {
    content.innerHTML = `
      <div class="assistant-question">¿Qué deseas mejorar el día de hoy?</div>
      ${Object.keys(habitGroups).map(area => `
        <div class="assistant-area" onclick="chooseArea('${area}')">${area}</div>
      `).join('')}
      <button onclick="screen='start';render()" style="margin-top:24px; background:#777;">← Volver</button>
    `;
    return;
  }

  if (screen === "assistantArea") {
    const area = assistantArea;
    content.innerHTML = `
      <div class="assistant-bubble">Estas son las sugerencias que tengo para tu día en <b>${area}</b>:</div>
      ${suggestions[area].map(h => `
        <div class="suggestion-item">
          <span>${h}</span>
          <button onclick='addSuggestion("${area}",${JSON.stringify(h)})'>Agregar</button>
        </div>
      `).join('')}
      <button onclick="screen='assistant';render()" style="margin-top:24px; background:#777;">← Cambiar área</button>
    `;
    return;
  }

  if (screen === "home") {
    content.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        <h3>Racha actual: <b>${calculateCurrentStreak()}</b> días</h3>
        <small>Nivel ${level()} • ${xpInLevel()} / 100 xp</small>
      </div>

      <div class="progress">
        <div class="progress-bar" style="width:${xpInLevel()}%"></div>
      </div>

      <input type="date" value="${selectedDate}" onchange="changeDate(this.value)" style="width:100%; padding:10px; margin:16px 0; border:1px solid #ddd; border-radius:8px;">

      <button onclick="addCustomHabit()" style="margin:12px 0; background:#ff5722;">Añadir hábito</button>
      <button onclick="clearAllHabits()" style="margin:12px 0; background:#f44336;">Limpiar todos</button>

      ${habits.map((h,i) => `
        <div class="habit ${h.done?'done':'notdone'}" style="display:flex; justify-content:space-between; align-items:center;">
          <span style="flex:1; cursor:pointer;" onclick="toggleHabit(${i})">${h.done ? '✓' : '☐'} ${h.name}</span>
          ${isCustomHabit(h.name) ? `<button onclick="deleteCustomHabit('${h.name}')" style="width:auto; padding:4px 8px; margin:0; background:#e53935; font-size:0.9rem;">×</button>` : ''}
        </div>
      `).join('')}

      <div class="nav">
        <button onclick="screen='calendar';render()">Calendario</button>
        <button onclick="screen='stats';render()">Estadísticas</button>
        <button onclick="screen='start';render()">Cambiar área</button>
      </div>
    `;
  }

  else if (screen === "calendar") {
    content.innerHTML = `
      <h3 style="text-align:center">Historial mensual</h3>
      <p style="text-align:center; color:#555; margin-bottom:16px;">
        Verde fuerte = día perfecto<br>
        Verde claro = algo hecho
      </p>
      ${renderCalendar()}
      <button onclick="screen='home';render()" style="margin-top:24px;">← Volver a hábitos</button>
    `;
  }

  else if (screen === "stats") {
    const currentStreak = calculateCurrentStreak();
    const bestStreak = calculateBestStreak();
    const last7 = getLast7DaysData();

    content.innerHTML = `
      <h3 style="text-align:center; margin-bottom:24px; color:#2e7d32;">
        Tu progreso en LifeCare
      </h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
        <div style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-radius: 16px; padding: 16px; text-align:center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="font-size: 2.4rem; margin-bottom: 8px;">Fuego</div>
          <div style="font-size: 1.1rem; font-weight: bold; color: #2e7d32;">Racha actual</div>
          <div style="font-size: 2.8rem; font-weight: 800; color: #1b5e20;">${currentStreak}</div>
          <div style="color: #555; font-size: 0.95rem;">días seguidos</div>
        </div>
        
        <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 16px; padding: 16px; text-align:center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="font-size: 2.4rem; margin-bottom: 8px;">Trofeo</div>
          <div style="font-size: 1.1rem; font-weight: bold; color: #1565c0;">Mejor racha</div>
          <div style="font-size: 2.8rem; font-weight: 800; color: #0d47a1;">${bestStreak}</div>
          <div style="color: #555; font-size: 0.95rem;">días</div>
        </div>
      </div>

      <div style="background: #fffde7; border-radius: 16px; padding: 18px; margin-bottom: 24px; text-align:center; box-shadow: 0 3px 10px rgba(0,0,0,0.06);">
        <div style="font-size: 2.8rem; font-weight: bold; color: #f57f17;">Nivel ${level()}</div>
        <div style="margin: 12px 0; font-size: 1.1rem; color: #5d4037;">
          ${xpInLevel()} / 100 XP
        </div>
        <div class="progress" style="height:14px; background:#e0e0e0; margin:12px 0;">
          <div class="progress-bar" style="width:${xpInLevel()}%; background: linear-gradient(to right, #ffb300, #ff9800);"></div>
        </div>
        <div style="color: #555; font-size: 0.95rem;">
          XP total acumulado: <b>${xp}</b>
        </div>
      </div>

      <div style="margin: 28px 0; background:#f9f9f9; border-radius:16px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <h4 style="text-align:center; margin:0 0 12px; color:#2e7d32;">Últimos 7 días</h4>
        <div class="mini-chart">
          ${last7.map(day => `
            <div class="bar-container">
              <div class="bar ${day.status}" style="height:${day.height}%"></div>
              <div class="bar-label">${day.date}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <h4 style="margin: 24px 0 12px; color: #2e7d32; text-align:center;">Logros desbloqueados</h4>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${[
          { cond: currentStreak >= 3,  text: "Racha de 3 días" },
          { cond: currentStreak >= 7,  text: "Racha de 7 días" },
          { cond: currentStreak >= 14, text: "Racha de 14 días" },
          { cond: currentStreak >= 30, text: "Racha de 30 días" },
          { cond: level() >= 5,        text: "Nivel 5 alcanzado" },
          { cond: xp >= 1000,          text: "1000 XP acumulados" },
          { cond: xp >= 2500,          text: "Maestría 2500 XP" }
        ].map(item => `
          <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:12px; background:${item.cond ? '#e8f5e9' : '#f5f5f5'}; border-left: 5px solid ${item.cond ? '#4caf50' : '#bdbdbd'};">
            <span style="font-size:1.6rem;">${item.cond ? '✓' : '🔒'}</span>
            <span style="${item.cond ? 'color:#1b5e20; font-weight:600;' : 'color:#757575;'}">${item.text}</span>
          </div>
        `).join('')}
      </div>

      <h4 style="margin: 24px 0 12px; text-align:center;">Temas desbloqueables</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${getUnlockedThemes().map(([key, theme]) => `
          <button onclick="applyTheme('${key}'); render();" style="text-align:left; padding:10px 14px; margin:0; background:${currentTheme === key ? '#4caf50' : '#ddd'}; color:${currentTheme === key ? 'white' : '#333'};">
            ${currentTheme === key ? '✓' : ''} ${theme.name} ${key === 'green' ? '(Nivel 1)' : key === 'blue' ? '(Nivel 5)' : key === 'purple' ? '(Nivel 10)' : '(Nivel 20)'}
          </button>
        `).join('')}
        ${getUnlockedThemes().length === 0 ? '<p style="text-align:center; color:#999;">Sube de nivel para desbloquear temas</p>' : ''}
      </div>

      <button onclick="screen='home';render()" style="margin-top:32px; background:#1976d2; padding:14px;">
        ← Volver a mis hábitos
      </button>
    `;
  }
}

// ────────────────────────────────────────────────
// Acciones de usuario
// ────────────────────────────────────────────────

function selectGroup(g) {
  group = g;
  screen = "home";
  render();
}

function addCustomHabit() {
  if (!group) return;
  showHabitModal();
}

function clearAllHabits() {
  const today = new Date().toISOString().split("T")[0];
  if (selectedDate > today) {
    showToast("No puedes modificar hábitos en fechas futuras", "error");
    return;
  }

  const habits = getHabits();
  const doneCount = habits.filter(h => h.done).length;
  xp = Math.max(0, xp - (doneCount * 10));
  if (habits.bonus) {
    xp = Math.max(0, xp - 50);
    habits.bonus = false;
  }
  habits.forEach(h => h.done = false);
  save();
  render();
}

// Modal nuevo hábito
function showHabitModal() {
  const overlay = document.getElementById('habit-modal-overlay');
  const modal = document.getElementById('habit-modal');
  overlay.classList.add('visible');
  setTimeout(() => modal.classList.add('visible'), 10);
  document.getElementById('habit-input').value = '';
  document.getElementById('habit-input').focus();
}

function hideHabitModal() {
  const overlay = document.getElementById('habit-modal-overlay');
  const modal = document.getElementById('habit-modal');
  modal.classList.remove('visible');
  overlay.classList.remove('visible');
}

function confirmHabitModal() {
  const input = document.getElementById('habit-input');
  const name = input.value.trim();
  if (!name) return;
  customHabits[group] = customHabits[group] || [];
  customHabits[group].push(name);
  if (history[selectedDate]) delete history[selectedDate];
  save();
  hideHabitModal();
  render();
}

// Asistente
function goAssistant() {
  screen = "assistant";
  assistantArea = null;
  render();
}

function chooseArea(area) {
  assistantArea = area;
  screen = "assistantArea";
  render();
}

function addSuggestion(area, habit) {
  customHabits[area] = customHabits[area] || [];
  customHabits[area].push(habit);
  if (history[selectedDate]) delete history[selectedDate];
  save();
  showToast(`Hábito añadido: ${habit}`, "success");
  render();
}

function changeDate(d) {
  selectedDate = d;
  render();
}

// ────────────────────────────────────────────────
// Inicialización
// ────────────────────────────────────────────────

function initTheme() {
  applyTheme(currentTheme);
}

initTheme();
render();