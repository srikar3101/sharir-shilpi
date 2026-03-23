// Granular API Service - Integrates with Structured Backend
import { ls, ss } from './utils.js';

const API_BASE = 'http://localhost:3000/api';

export const auth = {
  register: async (email, password, name) => {
    const resp = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Registration failed');
    return result;
  },

  login: async (email, password) => {
    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || 'Login failed');
    ls('ss_active_user_data', result);
    return result;
  },

  logout: () => ls('ss_active_user_data', null),
  getCurrentUser: () => ls('ss_active_user_data', null)
};

export const profileService = {
  get: async (email) => {
    const resp = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(email)}`);
    return await resp.json();
  },
  save: async (profile) => {
    const resp = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return await resp.json();
  }
};

export const logService = {
  getDaily: async (email, date) => {
    const resp = await fetch(`${API_BASE}/logs?email=${encodeURIComponent(email)}&date=${date}`);
    return await resp.json();
  },
  saveWeight: async (email, date, weight) => {
    await fetch(`${API_BASE}/weight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, date, weight })
    });
  },
  saveFood: async (email, date, meal_type, food) => {
    await fetch(`${API_BASE}/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, date, meal_type, ...food })
    });
  },
  saveWorkout: async (email, date, wo) => {
    await fetch(`${API_BASE}/workout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, date, ...wo })
    });
  },
  saveWater: async (email, date, water) => {
    await fetch(`${API_BASE}/water`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, date, water })
    });
  }
};

export const historyService = {
  getWeight: async (email) => {
    const resp = await fetch(`${API_BASE}/history/weight?email=${encodeURIComponent(email)}`);
    return await resp.json();
  }
};

export const configService = {
  getCustomFoods: async (email) => {
    const resp = await fetch(`${API_BASE}/custom-foods?email=${encodeURIComponent(email)}`);
    return await resp.json();
  },
  saveCustomFood: async (email, food) => {
    await fetch(`${API_BASE}/custom-foods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...food })
    });
  },
  getPRs: async (email) => {
    const resp = await fetch(`${API_BASE}/prs?email=${encodeURIComponent(email)}`);
    return await resp.json();
  },
  savePR: async (email, prName, prData) => {
    await fetch(`${API_BASE}/prs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ex_name: prName, ...prData })
    });
  }
};
