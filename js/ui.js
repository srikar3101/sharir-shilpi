import * as state from './state.js';
import * as logic from './logic.js';
import { animateCount, showToast } from './utils.js';

// Chart instance
let wcInst = null;

export async function renderDashboard(profile) {
  if (!profile) return;
  const d = state.getDayData(state.todayKey());
  const latestW = logic.getLatestW(profile);
  const h = new Date().getHours();
  const streak = await logic.calcStreak(profile.email);

  document.getElementById('dash-greeting').textContent = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', ' + (profile.name || 'User');
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('streak-pill').textContent = 'Day ' + streak;

  const email = profile.email;
  const viewDate = state.store.viewDate;
  renderStreakCal(email, viewDate);

  // Weight
  if (latestW) {
    document.getElementById('prog-today').textContent = latestW.toFixed(1) + ' kg';
  }
  if (profile.targetWeight) {
    document.getElementById('prog-target').textContent = profile.targetWeight.toFixed(1) + ' kg';
  }
  animateCount(document.getElementById('prog-days'), 0, logic.daysToTarget(profile), 600);

  const pct = logic.pctProg(profile);
  document.getElementById('weight-prog-fill').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('prog-start-lbl').textContent = (profile.weight || 0) + ' kg';
  document.getElementById('prog-target-lbl').textContent = (profile.targetWeight || 0) + ' kg';

  // Cals
  const ft = logic.calcFood(d.foodLog);
  const burned = logic.calcBurn(d.workoutLog);
  const budget = logic.getDailyBudget(profile);
  const net = ft.cal - burned;
  const deficit = budget - net;

  const elIn = document.getElementById('dash-food-in');
  const elOut = document.getElementById('dash-burned');
  const elBudget = document.getElementById('dash-budget');
  const elNet = document.getElementById('ring-net');

  if (elIn) elIn.textContent = ft.cal + ' kcal';
  if (elOut) elOut.textContent = burned + ' kcal';
  if (elBudget) elBudget.textContent = budget + ' kcal';
  if (elNet) animateCount(elNet, 0, net, 500);

  const de = document.getElementById('dash-deficit');
  if (de) {
    de.textContent = deficit > 0 ? '-' + deficit + ' kcal' : '+' + Math.abs(deficit) + ' kcal';
    de.style.color = deficit > 0 ? 'var(--green)' : 'var(--red)';
  }

  const pc = Math.min(1, ft.cal / budget);
  const ringColor = pc > 1 ? 'var(--red)' : pc > 0.85 ? 'var(--amber)' : 'var(--green)';
  animateCalRing(pc, ringColor);

  // Macros
  const macroT = logic.calcMacroTargets(profile);
  document.getElementById('dash-p').textContent = ft.p + 'g';
  document.getElementById('dash-c').textContent = ft.c + 'g';
  document.getElementById('dash-f').textContent = ft.f + 'g';
  document.getElementById('dash-pt').textContent = '/ ' + macroT.p + 'g';
  document.getElementById('dash-ct').textContent = '/ ' + macroT.c + 'g';
  document.getElementById('dash-ft').textContent = '/ ' + macroT.f + 'g';

  const ppct = Math.round((ft.p / macroT.p) * 100);
  const cpct = Math.round((ft.c / macroT.c) * 100);
  const fpct = Math.round((ft.f / macroT.f) * 100);

  _setProgColor('prog-p', ppct, '#60a5fa');
  _setProgColor('prog-c', cpct, '#fbbf24');
  _setProgColor('prog-f', fpct, '#f87171');

  // PRs
  const prs = logic.rebuildPRs();
  const pc2 = document.getElementById('pr-container');
  const keys = Object.keys(prs);
  if (pc2) {
    pc2.innerHTML = keys.length
      ? keys.slice(0, 6).map(k => `<div class="pr-badge"><div class="pr-ex">${k}</div><div class="pr-val">${prs[k].w}kg × ${prs[k].r}</div></div>`).join('')
      : '<div style="color:var(--text3);font-size:13px;">No PRs yet. Crush your workout!</div>';
  }

  renderStreakCal();

  // Weekly stats
  _renderWeeklyStats(budget);
}

function _setProgColor(id, pct, fallback) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = Math.min(100, pct) + '%';
  el.style.background = pct > 110 ? 'var(--red)' : pct > 90 ? 'var(--green)' : fallback;
}

function _renderWeeklyStats(budget) {
  let wo = 0, cg = 0, tw = 0, wd = 0;
  for (let i = 0; i < 7; i++) {
    const dk = new Date();
    dk.setDate(dk.getDate() - i);
    const key = dk.toISOString().slice(0, 10);
    const dd = state.getDayData(key);
    if (!dd) continue;
    if ((dd.workoutLog || []).length) wo++;
    const ft2 = logic.calcFood(dd.foodLog || { breakfast: [], lunch: [], snacks: [], dinner: [] });
    if (ft2.cal > 0 && ft2.cal - logic.calcBurn(dd.workoutLog || []) <= budget) cg++;
    if (dd.water) { tw += dd.water; wd++; }
  }
  document.getElementById('week-wo').textContent = wo + ' / 7';
  document.getElementById('week-wo-fill').style.width = (wo / 7 * 100) + '%';
  document.getElementById('week-cal').textContent = cg + ' / 7';
  document.getElementById('week-cal-fill').style.width = (cg / 7 * 100) + '%';
  document.getElementById('week-water').textContent = wd ? (tw / wd).toFixed(1) + ' glasses/day' : '—';
}

export function animateCalRing(pct, color) {
  const ring = document.getElementById('cal-ring');
  if (!ring) return;
  const target = 251.2 * (1 - Math.min(1, pct));
  ring.style.strokeDashoffset = 251.2;
  ring.style.stroke = color;
  const start = performance.now();
  const anim = (now) => {
    const t = Math.min((now - start) / 700, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    ring.style.strokeDashoffset = 251.2 + (target - 251.2) * ease;
    if (t < 1) requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);
}

export async function renderStreakCal(email, viewDate) {
  const grid = document.getElementById('streak-cal');
  if (!grid || !email) return;
  const tk = state.todayKey();
  
  // Get 30 days of range data
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { logService } = await import('./service.js');
  const rangeData = await logService.getRange(email, start, tk);

  const currentMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  };
  const ms = currentMonthStart();

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  let h = days.map(d => `<div class="cal-day-label">${d}</div>`).join('');
  const startDate = new Date(); startDate.setDate(startDate.getDate() - 29);
  for (let i = 0; i < startDate.getDay(); i++) h += '<div class="cal-cell future"></div>';

  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const data = rangeData[key];
    
    let hasLog = false;
    let full = false;
    if (data) {
      hasLog = data.hasWeight || data.hasFood || data.hasWorkout || data.hasWater;
      full = data.hasWeight && data.hasFood; // Simplified for "full"
    }
    const isT = key === tk;
    const isPast = key <= tk;
    const isThisMonth = key >= ms;
    let cls = 'cal-cell' + (isPast && isThisMonth ? ' clickable' : '');
    if (hasLog) cls += full ? ' logged-full' : ' logged';
    if (isT) cls += ' today';
    if (key === viewDate && key !== tk) cls += ' selected';
    const clickable = isPast && isThisMonth;
    h += `<div class="${cls}" ${clickable ? `onclick="window.app.calCellClick('${key}')"` : 'title="Previous month — view only"'} style="${!isThisMonth && isPast ? 'opacity:0.35;cursor:default;' : ''}"></div>`;
  }
  grid.innerHTML = h;
  requestAnimationFrame(animateCalCells);
}

export function animateCalCells() {
  const cells = document.querySelectorAll('.cal-cell:not(.future)');
  cells.forEach((cell, i) => {
    cell.classList.remove('cal-animate');
    setTimeout(() => cell.classList.add('cal-animate'), i * 18);
  });
}

export function renderWeightHistory() {
  const wh = state.getWeightHistory().slice().reverse().slice(0, 20);
  const c = document.getElementById('weight-history');
  if (!c) return;
  if (!wh.length) {
    c.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0;">No entries yet.</div>';
    return;
  }
  c.innerHTML = wh.map((e, i) => {
    const nxt = wh[i + 1];
    const diff = nxt ? (e.w - nxt.w).toFixed(1) : null;
    const ds = new Date(e.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const dStr = diff ? (diff > 0 ? `<span style="color:var(--red)">+${diff}</span>` : `<span style="color:var(--green)">${diff}</span>`) : '';
    return `<div class="weight-entry"><div><div class="we-date">${ds}</div><div class="we-diff">${dStr}</div></div><div class="we-val">${e.w.toFixed(1)} <span style="font-size:13px;color:var(--text2)">kg</span></div></div>`;
  }).join('');
  renderWeightChart(wh.slice().reverse());
}

export function renderWeightChart(wh) {
  const cv = document.getElementById('weight-chart');
  if (!cv || !window.Chart) return;
  const data = wh.slice(-14);
  if (data.length < 2) return;
  const labels = data.map(e => new Date(e.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  if (wcInst) wcInst.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#b3b3b3' : '#525252';

  wcInst = new window.Chart(cv, {
    type: 'line',
    data: { labels, datasets: [{ data: data.map(e => e.w), borderColor: '#6366f1', borderWidth: 2, fill: false, tension: .35, pointBackgroundColor: '#6366f1', pointRadius: 3 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutElastic'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f1f1f',
          titleColor: '#f5f5f5',
          bodyColor: '#b3b3b3',
          borderColor: '#2f2f2f',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} kg`
          }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 }, callback: v => v + 'kg' } }
      }
    }
  });
}

export function renderWater(viewDate) {
  const d = state.getDayData(viewDate);
  const g = d.water || 0;
  const wp = document.getElementById('water-pill');
  if (wp) wp.textContent = g + ' / ' + logic.WATER_GOAL + ' glasses';
  const wm = document.getElementById('water-ml');
  if (wm) wm.textContent = (g * 250) + ' ml today';

  let h = '';
  for (let i = 0; i < logic.WATER_GOAL; i++) {
    h += `<div class="wdrop ${i < g ? 'filled' : ''}" onclick="window.app.setWater(${i + 1})">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="${i < g ? 'var(--cyan)' : 'var(--text3)'}">
        <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/>
      </svg>
    </div>`;
  }
  const wd = document.getElementById('water-drops');
  if (wd) wd.innerHTML = h;
}

export function renderFoodLog(viewDate) {
  const d = state.getDayData(viewDate);
  const ft = logic.calcFood(d.foodLog);
  const tc = document.getElementById('food-total-cal');
  if (tc) tc.textContent = ft.cal;

  const isToday = viewDate === state.todayKey();
  const foodDateEl = document.getElementById('food-kcal-label');
  if (foodDateEl) foodDateEl.textContent = isToday ? 'kcal today' : 'kcal this day';

  const sub = document.getElementById('food-date-sub');
  if (sub) {
    sub.textContent = isToday
      ? new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
      : new Date(viewDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  const mc = document.getElementById('meals-container');
  if (!mc) return;

  mc.innerHTML = Object.entries(logic.MEAL_LABELS).map(([key, label]) => {
    const items = d.foodLog[key] || [];
    const mc2 = items.reduce((s, i) => s + i.cal, 0);
    const ih = items.map((item, idx) => `
      <div class="food-item">
        <div class="food-item-info">
          <div class="food-name">${item.name}</div>
          <div class="food-detail">${item.ql} · P:${Math.round(item.p)}g C:${Math.round(item.c)}g F:${Math.round(item.f)}g</div>
        </div>
        <div style="display:flex;align-items:center;">
          <div class="food-item-right"><div class="food-cal">${Math.round(item.cal)}</div><div class="food-macro">kcal</div></div>
          <button class="del-btn" onclick="window.app.removeFood('${key}',${idx})">×</button>
        </div>
      </div>`).join('');
    return `<div class="card" style="margin-bottom:0;">
      <div class="meal-header" onclick="window.app.openAddFoodFor('${key}')">
        <span class="meal-name">${label}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="meal-cals">${Math.round(mc2)} kcal</span>
          <span style="color:var(--accent);font-size:18px;font-weight:300;">+</span>
        </div>
      </div>
      ${ih || '<div style="font-size:12px;color:var(--text3);padding:8px 0;">Nothing logged</div>'}
    </div>`;
  }).join('<div style="height:10px;"></div>');

  renderWater(viewDate);
}

export function renderWorkoutLog(viewDate) {
  const isT = viewDate === state.todayKey();
  const d = state.getDayData(viewDate);
  const list = document.getElementById('workout-log-list');
  if (!list) return;
  let tb = 0;

  const lbl = document.getElementById('wo-log-label');
  if (lbl) {
    const vd = new Date(viewDate + 'T12:00:00');
    lbl.textContent = isT ? "Today's workouts" : vd.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' workouts';
  }

  if (!d.workoutLog.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0;">No workouts logged yet. Tap + to add.</div>';
    const burnEl = document.getElementById('wo-total-burn');
    if (burnEl) burnEl.textContent = '0';
    return;
  }

  const cardios = []; const strengthGroups = {};
  d.workoutLog.forEach((w, i) => {
    tb += w.burned;
    if (w.type === 'cardio' || !w.type) cardios.push({ w, i });
    else {
      const key = w.name;
      if (!strengthGroups[key]) strengthGroups[key] = [];
      strengthGroups[key].push({ w, i });
    }
  });

  let html = '';
  cardios.forEach(({ w, i }) => {
    html += `<div class="wo-group">
      <div class="wo-cardio-row">
        <div class="wo-cardio-icon">🏃</div>
        <div class="wo-cardio-info">
          <div class="wo-cardio-name">${w.name}</div>
          <div class="wo-cardio-detail">${w.duration} min${w.dist ? ` · ${w.dist}km` : ''}${w.incline ? ` · ${w.incline}% incline` : ''}</div>
        </div>
        <div style="font-size:13px;color:var(--sky);font-family:'DM Mono',monospace;font-weight:600;flex-shrink:0;margin-right:8px;">${w.burned} kcal</div>
        <button class="wo-set-del" onclick="window.app.removeWorkout(${i})">×</button>
      </div>
    </div>`;
  });

  Object.entries(strengthGroups).forEach(([exName, sets]) => {
    const groupTotal = sets.reduce((s, { w }) => s + w.burned, 0);
    const setRows = sets.map(({ w, i }, si) => `
      <div class="wo-set-row">
        <span class="wo-set-badge">Set ${si + 1}</span>
        <span class="wo-set-detail">${w.sets}×${w.reps}${w.weight ? ' @ ' + w.weight + 'kg' : ''} · ${w.duration}min</span>
        <span class="wo-set-cal">${w.burned} kcal</span>
        <div class="wo-set-actions">
          <button class="wo-set-edit" onclick="window.app.editWorkout(${i})">Edit</button>
          <button class="wo-set-del" onclick="window.app.removeWorkout(${i})">×</button>
        </div>
      </div>`).join('');
    html += `<div class="wo-group">
      <div class="wo-group-header">
        <span class="wo-group-name">${exName}</span>
        <span class="wo-group-total">${sets.length} set${sets.length > 1 ? 's' : ''} · ${groupTotal} kcal</span>
      </div>
      ${setRows}
    </div>`;
  });

  list.innerHTML = html;
  const burnEl = document.getElementById('wo-total-burn');
  if (burnEl) burnEl.textContent = tb;
}

export function renderProfile(profile) {
  if (!profile) return;
  const tdee = logic.calcTDEE(profile);
  const goal = logic.getDailyBudget(profile);
  const def = tdee - goal;

  const tdeeDisp = document.getElementById('tdee-display');
  if (tdeeDisp) tdeeDisp.textContent = tdee + ' kcal/day';

  const tdeeBr = document.getElementById('tdee-breakdown');
  if (tdeeBr) tdeeBr.textContent = `BMR: ${Math.round(logic.calcBMR(profile))} × ${profile.actMult} = ${tdee} TDEE · Goal: ${goal} kcal/day (${def} kcal deficit)`;

  const ov = state.getCalOverride();
  const ovEl = document.getElementById('cal-override');
  if (ovEl && ov) ovEl.value = ov;

  const ew = document.getElementById('edit-weight');
  const et = document.getElementById('edit-target');
  const ep = document.getElementById('edit-pace');
  if (ew) ew.value = profile.weight;
  if (et) et.value = profile.targetWeight;
  if (ep) ep.value = profile.pace;

  const ps = document.getElementById('profile-stats');
  if (ps) {
    ps.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="metric-tile"><div class="lbl">Name</div><div style="font-size:16px;font-weight:500;">${profile.name}</div></div>
        <div class="metric-tile"><div class="lbl">Age</div><div class="val">${profile.age}</div></div>
        <div class="metric-tile"><div class="lbl">Height</div><div class="val">${profile.height}<span> cm</span></div></div>
        <div class="metric-tile"><div class="lbl">Start weight</div><div class="val">${profile.weight}<span> kg</span></div></div>
        <div class="metric-tile"><div class="lbl">Target weight</div><div class="val" style="color:var(--green)">${profile.targetWeight}<span> kg</span></div></div>
        <div class="metric-tile"><div class="lbl">Pace</div><div style="font-size:15px;font-weight:500;">${profile.pace} kg/wk</div></div>
      </div>`;
  }
}
