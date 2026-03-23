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
  if (!p) return 2000;
  const bmr = calcBMR(p);
  const mult = p.actMult || 1.2;
  return Math.round(bmr * mult);
}

export function getDailyBudget(profile) {
  if (!profile) return 2000;
  const tdee = calcTDEE(profile);
  const pace = profile.pace || 0.5;
  return state.getCalOverride() || Math.round(tdee - (pace * 7700 / 7));
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

export async function calcStreak(email) {
  if (!email) return 0;
  // Get 90 days of range data
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  try {
    const { logService } = await import('./service.js');
    const rangeData = await logService.getRange(email, start, end);
    let s = 0;
    for (let i = 0; i < 90; i++) {
        const dk = new Date();
        dk.setDate(dk.getDate() - i);
        const key = dk.toISOString().slice(0, 10);
        const data = rangeData[key];
        if (data) {
            const hasLog = data.hasWeight || data.hasFood || data.hasWorkout || data.hasWater;
            if (hasLog) s++;
            else if (i > 0) break;
        } else if (i > 0) break;
    }
    return Math.max(1, s);
  } catch (e) {
    console.error("Streak calc failed", e);
    return 1;
  }
}

export function calcMacroTargets(profile) {
  if (!profile) return { p: 150, c: 200, f: 65 };
  const w = getLatestW(profile) || 70;
  const budget = getDailyBudget(profile) || 2000;
  const p = Math.round(1.8 * w);
  const f = Math.round((budget * 0.25) / 9);
  const c = Math.round((budget - (p * 4) - (f * 9)) / 4);
  return { p, c: Math.max(50, c), f };
}

export async function rebuildPRs(email) {
  if (!email) return {};
  try {
    const { logService } = await import('./service.js');
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    const workouts = await logService.getWorkoutRange(email, start, end);
    
    const prs = {};
    workouts.forEach(w => {
        if (w.type !== 'strength' || !w.weight || w.weight <= 0) return;
        const ex = w.name;
        if (!prs[ex] || w.weight > prs[ex].w || (w.weight === prs[ex].w && (w.reps || 0) > prs[ex].r)) {
            prs[ex] = { w: w.weight, r: w.reps || 0, s: w.sets || 0, date: w.date };
        }
    });

    state.savePRs(prs);
    return prs;
  } catch (e) {
    console.error("PR rebuild failed", e);
    return {};
  }
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
