// v1.0.2 - Cache Busting
import * as state from './state.js';
import * as logic from './logic.js';
import * as ui from './ui.js';
import { auth, profileService, logService, historyService, configService } from './service.js';
import { showToast, addRipple } from './utils.js';

// Global state for temporary UI interactions
let currentScreen = 'dash';
let activeWType = 'cardio';

// Component caching flag
let isComponentsLoaded = false;

// Bridge object to expose functions to HTML onclick attributes
window.app = {
  // --- COMPONENT LOADER ---
  loadComponents: async () => {
    if (isComponentsLoaded) return;
    const components = [
        { id: 'auth-container', name: 'auth' },
        { id: 'onboarding-container', name: 'onboarding' },
        { id: 'screen-dash', name: 'dashboard', parent: 'main-content' },
        { id: 'screen-weight', name: 'weight', parent: 'main-content' },
        { id: 'screen-food', name: 'food', parent: 'main-content' },
        { id: 'screen-workout', name: 'workout', parent: 'main-content' },
        { id: 'screen-profile', name: 'profile', parent: 'main-content' },
        { id: 'screen-contact', name: 'contact', parent: 'main-content' },
        { id: 'modals-container', name: 'modals' }
    ];

    for (const comp of components) {
        try {
            const resp = await fetch(`./components/${comp.name}.html`);
            const html = await resp.text();
            const container = comp.parent ? document.getElementById(comp.parent) : document.getElementById(comp.id);
            if (container) {
                if (comp.parent) {
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = html;
                    const element = wrapper.firstElementChild;
                    container.appendChild(element);
                } else {
                    container.innerHTML = html;
                }
            }
        } catch (e) {
            console.error(`Failed to load component: ${comp.name}`, e);
        }
    }
    isComponentsLoaded = true;
  },

  // --- AUTH ---
  toggleAuthMode: (mode) => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (mode === 'register') {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    } else {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      // Re-init google button if we switch back to login
      window.app.renderGoogleButton();
    }
  },

  renderGoogleButton: () => {
    if (window.google && document.getElementById('g_id_signin')) {
        google.accounts.id.renderButton(
            document.getElementById('g_id_signin'),
            { theme: 'outline', size: 'large', width: 340, shape: 'pill' }
        );
    }
  },

  handleGoogleLogin: async (response) => {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
    try {
      // In a real app, send response.credential to your backend
      await auth.loginGoogle(response.credential);
      showToast('Signed in with Google');
      await initApp();
    } catch (e) {
      if (loader) loader.style.display = 'none';
      showToast(e.message);
    }
  },

  handleLogin: async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    
    // Validations
    let valid = true;
    if (!email || !email.includes('@')) {
        document.getElementById('login-email-error').innerText = 'Valid email required';
        valid = false;
    } else {
        document.getElementById('login-email-error').innerText = '';
    }
    if (!pass || pass.length < 4) {
        document.getElementById('login-pass-error').innerText = 'Password must be at least 4 chars';
        valid = false;
    } else {
        document.getElementById('login-pass-error').innerText = '';
    }

    if (!valid) return;
    
    const loader = document.getElementById('app-loader');
    if (loader) loader.style.display = 'flex';
    
    try {
      await auth.login(email, pass);
      showToast('Logged in successfully');
      await initApp();
    } catch (e) {
      if (loader) loader.style.display = 'none';
      showToast(e.message);
    }
  },

  handleRegister: async () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    if (!name || !email || !pass) return showToast('Please fill all fields');
    
    try {
      await auth.register(email, pass, name);
      showToast('Account created! Please login.');
      window.app.toggleAuthMode('login');
    } catch (e) {
      showToast(e.message);
    }
  },

  handleLogout: async () => {
    await auth.logout();
    location.reload();
  },

  // --- THEME ---
  toggleTheme: () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('ss_theme', next);
    
    const icon = document.getElementById('theme-icon-sidebar');
    if (icon) icon.innerText = next === 'dark' ? '☀️' : '🌙';

    if (window.animations) window.animations.updateThemeColors(next === 'dark');
  },

  // --- NAVIGATION ---
  switchTab: async (tab, el, keepDate) => {
    const screens = document.querySelectorAll('.screen');
    const navItems = document.querySelectorAll('.nav-item');
    
    screens.forEach(s => s.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    
    const targetScreen = document.getElementById('screen-' + tab);
    if (targetScreen) targetScreen.classList.add('active');
    
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    
    currentScreen = tab;
    
    if (!keepDate && tab !== 'dash') {
        state.store.viewDate = state.todayKey();
        state.store.dayData = state.getDayData(state.store.viewDate);
    }
    
    if (tab === 'dash') await ui.renderDashboard(state.store.profile);
    else if (tab === 'weight') ui.renderWeightHistory();
    else if (tab === 'food') ui.renderFoodLog(state.store.viewDate);
    else if (tab === 'workout') ui.renderWorkoutLog(state.store.viewDate);
    else if (tab === 'profile') ui.renderProfile(state.store.profile);

    // Trigger animations for new content
    window.dispatchEvent(new CustomEvent('ss-content-updated'));
    if (window.animations) window.animations.pageTransition();
  },

  // --- CORE APP ACTIONS ---
  saveProfile: async () => {
    const name = document.getElementById('ob-name').value.trim();
    const age = parseFloat(document.getElementById('ob-age').value);
    const height = parseFloat(document.getElementById('ob-height').value);
    const weight = parseFloat(document.getElementById('ob-weight').value);
    const targetWeight = parseFloat(document.getElementById('ob-target').value);
    
    if (!name || isNaN(age) || isNaN(height) || isNaN(weight) || isNaN(targetWeight)) {
      return showToast('Please fill all fields correctly');
    }
    
    await state.saveProfileData(state.store.profile);
    initApp();
  },

  logWeight: () => {
    const val = parseFloat(document.getElementById('w-input').value);
    if (isNaN(val)) return;
    state.logWeight(val);
    document.getElementById('w-input').value = '';
    showToast('Weight logged');
  },

  shiftDate: async (delta) => {
    const date = new Date(state.store.viewDate + 'T12:00:00');
    date.setDate(date.getDate() + delta);
    const newKey = date.toISOString().split('T')[0];
    state.store.viewDate = newKey;
    
    const { logService } = await import('./service.js');
    const user = auth.getCurrentUser();
    if (user) {
        state.store.dayData = await logService.getDaily(user.email, newKey);
    }
  },

  addWater: (glasses) => {
    state.store.dayData.water += glasses;
    ui.renderFoodLog(state.store.viewDate);
  },

  removeWater: () => {
    state.store.dayData.water = Math.max(0, state.store.dayData.water - 1);
    ui.renderFoodLog(state.store.viewDate);
  },

  // --- FOOD MODAL ---
  openAddFood: (mealType) => {
    document.getElementById('food-modal').style.display = 'flex';
  },

  closeAddFood: () => {
    document.getElementById('food-modal').style.display = 'none';
  },

  searchFood: (query) => {
    ui.renderFoodResults(query);
  },

  addFoodItem: (foodObj, mealType) => {
    state.addFood(mealType || 'breakfast', foodObj);
    window.app.closeAddFood();
    showToast(`Added ${foodObj.name}`);
  },

  removeFood: async (meal, index) => {
    await state.removeFood(meal, index);
    showToast('Food removed');
  },

  // --- WORKOUT MODAL ---
  openLogSheet: () => {
    document.getElementById('log-sheet').style.display = 'flex';
    ui.renderWorkoutForm(activeWType);
  },

  closeLogSheet: () => {
    document.getElementById('log-sheet').style.display = 'none';
  },

  setWType: (type, el) => {
    activeWType = type;
    document.querySelectorAll('.wtype-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    ui.renderWorkoutForm(type);
  },

  onActivityChange: () => {
    const act = document.getElementById('wo-activity').value;
    const isTreadmill = ['walking_slow', 'walking_mod', 'walking_fast', 'jogging', 'running_mod', 'running_fast'].includes(act);
    document.getElementById('wo-incline-dist').style.display = isTreadmill ? 'block' : 'none';
    window.app.updateBurnPreview();
  },

  toggleDistFields: () => {
    const useDist = document.getElementById('wo-use-dist').checked;
    document.getElementById('wo-dist-fields').style.display = useDist ? 'flex' : 'none';
    window.app.updateBurnPreview();
  },

  updateBurnPreview: () => {
    const preview = document.getElementById('wo-burn-preview');
    if (!preview) return;
    
    const act = document.getElementById('wo-activity').value;
    const dur = parseFloat(document.getElementById('wo-duration').value) || 0;
    const hr = parseFloat(document.getElementById('wo-hr').value) || 0;
    const useDist = document.getElementById('wo-use-dist')?.checked;
    const dist = useDist ? parseFloat(document.getElementById('wo-distance').value) || 0 : null;
    const incl = useDist ? parseFloat(document.getElementById('wo-incline').value) || 0 : null;

    const burn = logic.calculateBurn(act, dur, state.store.profile, hr, dist, incl);
    preview.innerText = Math.round(burn) + ' kcal';
  },

  logCardio: () => {
    const act = document.getElementById('wo-activity').value;
    const dur = parseFloat(document.getElementById('wo-duration').value) || 0;
    const hr = parseFloat(document.getElementById('wo-hr').value) || 0;
    const useDist = document.getElementById('wo-use-dist')?.checked;
    const dist = useDist ? parseFloat(document.getElementById('wo-distance').value) || 0 : null;
    const incl = useDist ? parseFloat(document.getElementById('wo-incline').value) || 0 : null;

    if (dur <= 0) return showToast('Duration is required');
    
    const burn = logic.calculateBurn(act, dur, state.store.profile, hr, dist, incl);
    state.addWorkout({ type: 'cardio', activity: act, duration: dur, burn });
    window.app.closeLogSheet();
    showToast('Cardio logged');
  },

  logStrength: () => {
    const ex = document.getElementById('wo-exercise').value.trim();
    const sets = parseInt(document.getElementById('wo-sets').value);
    const reps = parseInt(document.getElementById('wo-reps').value);
    const weight = parseFloat(document.getElementById('wo-weight').value);
    const dur = parseInt(document.getElementById('wo-str-dur').value) || 30;

    if (!ex || !sets || !reps) return showToast('Fill exercise, sets, reps');
    
    const burn = logic.calculateBurn('strength', dur, state.store.profile);
    state.addWorkout({ type: 'strength', exercise: ex, sets, reps, weight, duration: dur, burn });
    window.app.closeLogSheet();
    showToast('Strength logged');
  },

  removeWorkout: async (index) => {
    await state.removeWorkout(index);
    showToast('Workout removed');
  },

  // --- PROFILE & SETTINGS ---
  updateProfile: () => {
    const weight = parseFloat(document.getElementById('edit-weight').value);
    const targetWeight = parseFloat(document.getElementById('edit-target').value);
    if (!isNaN(weight)) state.store.profile.weight = weight;
    if (!isNaN(targetWeight)) state.store.profile.targetWeight = targetWeight;
    showToast('Profile updated');
    ui.renderProfile(state.store.profile);
    ui.renderDashboard(state.store.profile);
  },

  handleContactSubmit: () => {
    const subject = document.getElementById('contact-subject').value.trim();
    const msg = document.getElementById('contact-msg').value.trim();
    if (!subject || !msg) return showToast('Please enter subject and message');
    showToast('Message sent! We\'ll get back to you soon.');
    document.getElementById('contact-subject').value = '';
    document.getElementById('contact-msg').value = '';
  },

  saveCalOverride: () => {
    const val = parseFloat(document.getElementById('cal-override').value);
    state.store.profile.manualCalorieTarget = isNaN(val) ? null : val;
    showToast('Calorie goal saved');
    ui.renderProfile(state.store.profile);
  },

  resetApp: () => {
    if (confirm('Reset all data?')) {
      localStorage.clear();
      location.reload();
    }
  }
};

// ... Sidebar & Tab injection helpers
function buildNavUI() {
    const navs = [
        { id: 'dash', label: 'Dashboard', icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>' },
        { id: 'weight', label: 'Weight', icon: '<path d="M3 6h18"></path><path d="M7 12h10"></path><path d="M10 18h4"></path>' },
        { id: 'food', label: 'Food Log', icon: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>' },
        { id: 'workout', label: 'Workouts', icon: '<path d="M6 3h12"></path><path d="M6 8h12"></path><path d="M6 13h12"></path><path d="M6 18h12"></path>' },
        { id: 'profile', label: 'Profile', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' },
        { id: 'contact', label: 'Contact Us', icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>' }
    ];

    const sidebar = document.getElementById('sidebar-nav');
    const tabs = document.getElementById('mobile-tabs');
    
    if (sidebar) sidebar.innerHTML = '';
    if (tabs) tabs.innerHTML = '';

    navs.forEach(n => {
        const sBtn = document.createElement('button');
        sBtn.className = 'nav-item magnetic';
        sBtn.setAttribute('data-tab', n.id);
        sBtn.onclick = () => window.app.switchTab(n.id);
        sBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${n.icon}</svg><span>${n.label}</span>`;
        if (sidebar) sidebar.appendChild(sBtn);
        
        const tBtn = document.createElement('button');
        tBtn.className = 'tab-btn';
        tBtn.setAttribute('data-tab', n.id);
        tBtn.onclick = () => window.app.switchTab(n.id);
        tBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${n.icon}</svg><span>${n.label}</span>`;
        if (tabs) tabs.appendChild(tBtn);
    });
}

// Initialize app
async function initApp() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';

  try {
    // 1. Load Components
    await window.app.loadComponents();
    buildNavUI();

    // 2. Theme
    const savedTheme = localStorage.getItem('ss_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('theme-icon-sidebar');
    if (icon) icon.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
    
    if (window.animations) {
      window.animations.updateThemeColors(savedTheme === 'dark');
    }

    const user = auth.getCurrentUser();
    const authContainer = document.getElementById('auth-container');
    const onboarding = document.getElementById('onboarding-container');
    const mainApp = document.getElementById('main-app');

    if (!user) {
      state.loadUserContext(null); // Clear state
      authContainer.classList.remove('hidden');
      onboarding.classList.add('hidden');
      mainApp.classList.add('hidden');
      return;
    }
    
    // Load user data from backend
    try {
      await state.loadUserContext(user.email);
    } catch (e) {
      console.error("Failed to load user state", e);
    }
    authContainer.classList.add('hidden');
    
    if (!state.store.profile) {
      onboarding.classList.remove('hidden');
      mainApp.classList.add('hidden');
      return;
    }
    
    onboarding.classList.add('hidden');
    mainApp.classList.remove('hidden');
    mainApp.style.display = 'flex'; // Ensure flex layout
    
    // Reactivity
    state.onChange(async (prop, val) => {
      if (prop === 'profile' || prop === 'dayData' || prop === 'viewDate') {
        await ui.renderDashboard(state.store.profile);
        ui.renderFoodLog(state.store.viewDate);
        ui.renderWorkoutLog(state.store.viewDate);
        ui.renderProfile(state.store.profile);
      }
    });

    await window.app.switchTab('dash');
    
    // Initialize Google Sign-In after components are loaded
    if (window.google) {
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Placeholder
            callback: window.app.handleGoogleLogin
        });
        window.app.renderGoogleButton();
    }

    window.dispatchEvent(new CustomEvent('ss-content-updated'));
  } catch (err) {
    console.error("InitApp critical failure:", err);
  } finally {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', initApp);
