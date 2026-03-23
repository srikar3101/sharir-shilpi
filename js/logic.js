import * as state from './state.js';
import { anthropicFetch } from './utils.js';

export const MET = {
  walking_slow: 2.5, walking_mod: 3.3, walking_fast: 4.3,
  jogging: 7.0, running_mod: 8.5, running_fast: 11.0,
  cycling_mod: 6.0, cycling_fast: 10.0,
  swimming: 6.0, elliptical: 5.0, stairclimber: 9.0,
  hiit: 14.0, jump_rope: 12.0, yoga: 2.5, pilates: 3.0
};

export const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' };
export const WATER_GOAL = 8;

export function calcBMR(p) {
  return p.sex === 'male'
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
    : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
}

export function calcTDEE(p) {
  return Math.round(calcBMR(p) * p.actMult);
}

export function getDailyBudget(profile) {
  if (!profile) return 2000;
  return state.getCalOverride() || Math.round(calcTDEE(profile) - (profile.pace * 7700 / 7));
}

export function calcBurn(wl) {
  return wl.reduce((s, w) => s + (w.burned || 0), 0);
}

export function calcFood(fl) {
  let cal = 0, p = 0, c = 0, f = 0;
  for (const m of Object.values(fl)) {
    for (const i of m) {
      cal += i.cal; p += i.p; c += i.c; f += i.f;
    }
  }
  return { cal: Math.round(cal), p: Math.round(p), c: Math.round(c), f: Math.round(f) };
}

export function getLatestW(profile) {
  if (!profile) return 0;
  const wh = state.getWeightHistory();
  return wh.length ? wh[wh.length - 1].w : profile.weight;
}

export function daysToTarget(profile) {
  if (!profile) return 0;
  const latestW = getLatestW(profile);
  const diff = latestW - profile.targetWeight;
  return diff <= 0 ? 0 : Math.ceil((diff / profile.pace) * 7);
}

export function pctProg(profile) {
  if (!profile) return 0;
  const tot = profile.weight - profile.targetWeight;
  if (tot <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((profile.weight - getLatestW(profile)) / tot) * 100)));
}

export function calcStreak() {
  let s = 0;
  for (let i = 0; i < 90; i++) {
    const dk = new Date();
    dk.setDate(dk.getDate() - i);
    const key = dk.toISOString().slice(0, 10);
    const dd = localStorage.getItem('vd_' + key); // Direct access for streak calc efficiency
    if (dd) {
      const data = JSON.parse(dd);
      const hasLog = data.weight || Object.values(data.foodLog || {}).some(m => m.length > 0) || (data.workoutLog || []).length > 0;
      if (hasLog) s++;
      else if (i > 0) break;
    } else if (i > 0) break;
  }
  return Math.max(1, s);
}

export function calcMacroTargets(profile) {
  if (!profile) return { p: 150, c: 200, f: 65 };
  const w = getLatestW(profile);
  const budget = getDailyBudget(profile);
  const p = Math.round(1.8 * w);
  const f = Math.round((budget * 0.25) / 9);
  const c = Math.round((budget - (p * 4) - (f * 9)) / 4);
  return { p, c: Math.max(50, c), f };
}

export function rebuildPRs() {
  const prs = {};
  for (let i = 0; i < 90; i++) {
    const dk = new Date();
    dk.setDate(dk.getDate() - i);
    const key = dk.toISOString().slice(0, 10);
    const dd = state.getDayData(key);
    if (!dd || (dd.workoutLog || []).length === 0) continue;
    for (const w of dd.workoutLog) {
      if (w.type !== 'strength' || !w.weight || w.weight <= 0) continue;
      const ex = w.name;
      if (!prs[ex] || w.weight > prs[ex].w || (w.weight === prs[ex].w && (w.reps || 0) > prs[ex].r)) {
        prs[ex] = { w: w.weight, r: w.reps || 0, s: w.sets || 0, date: key };
      }
    }
  }
  state.savePRs(prs);
  return prs;
}

export function calcCardioBurnFull(ak, dur, weight, dist, incline, hr, profile) {
  if (hr > 50 && dur > 0) {
    const age = (profile && profile.age) || 30;
    const wlb = weight * 2.2046;
    const kcalMin = (0.6309 * hr + 0.1988 * wlb + 0.2017 * age - 55.0969) / 4.184;
    return Math.max(1, Math.round(kcalMin * dur));
  }
  return calcCardioburn(ak, dur, weight, dist, incline);
}

function calcCardioburn(ak, dur, weight, dist, incline) {
  let met = MET[ak] || 5;
  const isWalkRun = ['walking_slow', 'walking_mod', 'walking_fast', 'jogging', 'running_mod', 'running_fast'].includes(ak);
  if (isWalkRun && dist > 0) {
    const distM = dist * 1000;
    const speed = dur > 0 ? distM / dur : 0;
    const grade = (incline || 0) / 100;
    let vo2;
    if (ak.startsWith('walking')) { vo2 = 0.1 * speed + 1.8 * speed * grade + 3.5; }
    else { vo2 = 0.2 * speed + 0.9 * speed * grade + 3.5; }
    return Math.round((vo2 / 1000) * weight * 5 * dur);
  }
  if (isWalkRun && (incline || 0) > 0) { met = met + (incline * 0.5); }
  return Math.round(met * weight / 60 * dur);
}
