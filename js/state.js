import { ls, ss } from './utils.js';
import { auth, profileService, logService, historyService, configService } from './service.js';

// No more catch-all debounceSave. We will save specifically on item change.

// Keys
const K_PROFILE = 'ss_profile_';
const K_WH = 'ss_wh_';
const K_CF = 'ss_cf_';
const K_PRS = 'ss_prs_';
const K_CO = 'ss_co_';
const K_VD = 'ss_vd_';

let currentUser = null;

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Scoped Getters
function getScoped(base, email, fallback) {
  if (!email) return fallback;
  return ls(base + email, fallback);
}

function setScoped(base, email, val) {
  if (!email) return;
  ss(base + email, val);
}

export const store = new Proxy({
  viewDate: todayKey(),
  profile: null,
  dayData: { foodLog: { breakfast: [], lunch: [], snacks: [], dinner: [] }, workoutLog: [], water: 0 },
  weightHistory: [],
  customFoods: [],
  prs: {},
  calOverride: null
}, {
  set(target, prop, value) {
    target[prop] = value;
    listeners.forEach(fn => fn(prop, value));
    return true;
  }
});

const listeners = [];
export function onChange(fn) {
  listeners.push(fn);
}

// Persistence Sync
onChange(async (prop, val) => {
  if (!currentUser) return;
  
  try {
    if (prop === 'profile') {
        await profileService.save({ email: currentUser, ...val });
    }
    if (prop === 'weightHistory' && val.length > 0) {
        const latest = val[val.length - 1];
        await logService.saveWeight(currentUser, latest.date, latest.w);
    }
    if (prop === 'dayData') {
        // Water is still saved here, but food/workouts have explicit save/delete
        await logService.saveWater(currentUser, store.viewDate, val.water);
    }
    if (prop === 'customFoods') {
        const latest = val[val.length - 1];
        if (latest) await configService.saveCustomFood(currentUser, latest);
    }
    if (prop === 'prs') {
        for (const [ex, data] of Object.entries(val)) {
            await configService.savePR(currentUser, ex, data);
        }
    }
  } catch (e) {
    console.error(`Failed to sync ${prop} to server`, e);
  }
});

export async function saveProfileData(data) {
    if (!currentUser) return;
    store.profile = data;
    await profileService.save({ email: currentUser, ...data });
}

export async function loadUserContext(email) {
    currentUser = email;
    if (!email) {
        store.profile = null;
        return;
    }

    try {
        // Parallel fetch for speed
        const [profile, history, logs, customFoods, prs] = await Promise.all([
            profileService.get(email),
            historyService.getWeight(email),
            logService.getDaily(email, todayKey()),
            configService.getCustomFoods(email),
            configService.getPRs(email)
        ]);

        store.profile = profile || null;
        store.weightHistory = history || [];
        store.dayData = logs || { foodLog: { breakfast: [], lunch: [], snacks: [], dinner: [] }, workoutLog: [], water: 0 };
        store.customFoods = customFoods || [];
        
        // Convert PR list to object
        const prObj = {};
        if (prs) prs.forEach(p => prObj[p.ex_name] = { w: p.w, r: p.r, s: p.s, date: p.date });
        store.prs = prObj;

        store.viewDate = todayKey();
    } catch (e) {
        console.error("Failed to load user context from server", e);
        store.profile = null;
    }
}

export function getDayData(k) {
  // Return current store data if matches, else return empty (will be updated by shiftDate)
  if (store.viewDate === k) return store.dayData;
  return {
    weight: null,
    foodLog: { breakfast: [], lunch: [], snacks: [], dinner: [] },
    workoutLog: [],
    water: 0
  };
}

// Legacy helper compatibility
export function getWeightHistory() { return store.weightHistory; }
export function getCalOverride() { return store.calOverride; }
export async function logWeight(w) {
    const entry = { date: todayKey(), w };
    store.weightHistory = [...store.weightHistory.filter(e => e.date !== entry.date), entry].sort((a,b) => a.date.localeCompare(b.date));
    store.dayData = { ...store.dayData, weight: w };
    // Trigger explicit API save
    await logService.saveWeight(currentUser, entry.date, w);
}
export async function addFood(meal, food) {
    const log = { ...store.dayData.foodLog };
    if (!log[meal]) log[meal] = [];
    
    // Optimistic add (no ID yet)
    const tempIdx = log[meal].push(food) - 1;
    store.dayData = { ...store.dayData, foodLog: log };

    try {
        const result = await logService.saveFood(currentUser, store.viewDate, meal, food);
        if (result && result.id) {
            store.dayData.foodLog[meal][tempIdx].id = result.id;
        }
    } catch (e) {
        console.error("Failed to save food", e);
    }
}

export async function removeFood(meal, index) {
    const food = store.dayData.foodLog[meal][index];
    if (food && food.id) {
        await logService.deleteFood(food.id);
    }
    const log = { ...store.dayData.foodLog };
    log[meal].splice(index, 1);
    store.dayData = { ...store.dayData, foodLog: log };
}

export async function addWorkout(wo) {
    // Optimistic add
    const tempIdx = store.dayData.workoutLog.push(wo) - 1;
    store.dayData = { ...store.dayData, workoutLog: [...store.dayData.workoutLog] };

    try {
        const result = await logService.saveWorkout(currentUser, store.viewDate, wo);
        if (result && result.id) {
            store.dayData.workoutLog[tempIdx].id = result.id;
        }
    } catch (e) {
        console.error("Failed to save workout", e);
    }
}

export async function removeWorkout(index) {
    const wo = store.dayData.workoutLog[index];
    if (wo && wo.id) {
        await logService.deleteWorkout(wo.id);
    }
    const list = [...store.dayData.workoutLog];
    list.splice(index, 1);
    store.dayData = { ...store.dayData, workoutLog: list };
}

// Added for logic.js compatibility
export async function savePRs(prs) {
    store.prs = prs;
}
