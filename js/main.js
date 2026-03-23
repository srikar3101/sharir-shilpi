// ============================================================
    // FOOD DATABASE — per 100g + optional piece sizes
    // ============================================================
    // ============================================================
    // PROXY CONFIGURATION
    // Paste your Cloudflare Worker URL below.
    // The worker holds your API key securely server-side.
    // ============================================================
    const PROXY_URL = 'https://sharir-shilpi-proxy.srikar-3101.workers.dev';     // e.g. 'https://sharir-shilpi-proxy.srikar-3101.workers.dev'
    const PROXY_SECRET = 'xhBcJcf37NkGJY0jYWFbRwQn8xDIWh3iFIIVWQrMSn0=';  // must match APP_SECRET set in Cloudflare Worker secrets

    async function aiFetch(prompt, target = 'groq', maxTokens = 600) {
      if (!PROXY_URL || PROXY_URL.trim() === '') {
        throw new Error('NO_PROXY');
      }
      const resp = await fetch(PROXY_URL.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Token': PROXY_SECRET
        },
        body: JSON.stringify({ prompt, target, max_tokens: maxTokens })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg = data?.error?.message || 'HTTP ' + resp.status;
        throw new Error(msg);
      }
      // Return in a shape both callers can handle
      // Support both Anthropic-style and OpenAI/Groq-style responses natively if proxy forwards them
      if (data.choices && data.choices[0]?.message?.content) {
        return { content: [{ type: 'text', text: data.choices[0].message.content }] };
      }
      if (data.text !== undefined) {
        return { content: [{ type: 'text', text: data.text }] };
      }
      return data;
    }

    const FOODS = [
      { name: "Boiled egg", cal: 155, p: 13, c: 1.1, f: 11, pieces: [{ label: "Small", g: 40 }, { label: "Medium", g: 50 }, { label: "Large", g: 60 }, { label: "XL", g: 70 }] },
      { name: "Egg white (raw/boiled)", cal: 52, p: 11, c: 0.7, f: 0.2, pieces: [{ label: "1 white", g: 33 }] },
      { name: "Scrambled eggs", cal: 149, p: 10, c: 1.4, f: 11, pieces: [{ label: "1 egg", g: 50 }] },
      { name: "Chicken breast (grilled)", cal: 165, p: 31, c: 0, f: 3.6 },
      { name: "Chicken thigh (grilled)", cal: 209, p: 26, c: 0, f: 11, pieces: [{ label: "Small", g: 70 }, { label: "Medium", g: 100 }, { label: "Large", g: 130 }] },
      { name: "Chicken breast (boiled)", cal: 150, p: 28, c: 0, f: 3 },
      { name: "Salmon (cooked)", cal: 208, p: 20, c: 0, f: 13, pieces: [{ label: "Small fillet", g: 100 }, { label: "Large fillet", g: 150 }] },
      { name: "Tuna (canned in water)", cal: 116, p: 26, c: 0, f: 1 },
      { name: "Paneer", cal: 265, p: 18, c: 3.6, f: 20 },
      { name: "Tofu (firm)", cal: 76, p: 8, c: 2, f: 4 },
      { name: "Mutton (cooked)", cal: 258, p: 25, c: 0, f: 17 },
      { name: "White rice (cooked)", cal: 130, p: 2.7, c: 28, f: 0.3 },
      { name: "Brown rice (cooked)", cal: 112, p: 2.6, c: 24, f: 0.9 },
      { name: "Basmati rice (cooked)", cal: 121, p: 3.5, c: 25, f: 0.4 },
      { name: "Chapati / roti", cal: 297, p: 9, c: 55, f: 4, pieces: [{ label: "Small", g: 40 }, { label: "Medium", g: 55 }, { label: "Large", g: 70 }] },
      { name: "Idli", cal: 39, p: 2, c: 8, f: 0.2, pieces: [{ label: "1 piece", g: 40 }] },
      { name: "Dosa (plain)", cal: 168, p: 4, c: 28, f: 4, pieces: [{ label: "Small", g: 60 }, { label: "Medium", g: 90 }, { label: "Large", g: 130 }] },
      { name: "Sambar", cal: 49, p: 3, c: 8, f: 1 },
      { name: "Dal (cooked)", cal: 116, p: 9, c: 20, f: 0.4 },
      { name: "Chana dal (cooked)", cal: 164, p: 9, c: 27, f: 2.7 },
      { name: "Rajma (cooked)", cal: 127, p: 8.7, c: 22, f: 0.5 },
      { name: "Moong dal (cooked)", cal: 105, p: 7, c: 19, f: 0.4 },
      { name: "Oats (raw)", cal: 389, p: 17, c: 66, f: 7 },
      { name: "Oats (cooked with water)", cal: 71, p: 2.5, c: 12, f: 1.5 },
      { name: "Bread (white)", cal: 265, p: 9, c: 49, f: 3.2, pieces: [{ label: "1 slice", g: 30 }] },
      { name: "Bread (whole wheat)", cal: 247, p: 13, c: 41, f: 3.4, pieces: [{ label: "1 slice", g: 30 }] },
      { name: "Banana", cal: 89, p: 1.1, c: 23, f: 0.3, pieces: [{ label: "Small", g: 80 }, { label: "Medium", g: 120 }, { label: "Large", g: 150 }] },
      { name: "Apple", cal: 52, p: 0.3, c: 14, f: 0.2, pieces: [{ label: "Small", g: 120 }, { label: "Medium", g: 182 }, { label: "Large", g: 242 }] },
      { name: "Mango", cal: 60, p: 0.8, c: 15, f: 0.4, pieces: [{ label: "Small", g: 150 }, { label: "Medium", g: 200 }, { label: "Large", g: 300 }] },
      { name: "Orange", cal: 47, p: 0.9, c: 12, f: 0.1, pieces: [{ label: "Small", g: 100 }, { label: "Medium", g: 150 }, { label: "Large", g: 200 }] },
      { name: "Watermelon", cal: 30, p: 0.6, c: 7.6, f: 0.2, pieces: [{ label: "1 slice", g: 280 }] },
      { name: "Grapes", cal: 69, p: 0.7, c: 18, f: 0.2 },
      { name: "Papaya", cal: 43, p: 0.5, c: 11, f: 0.3, pieces: [{ label: "Small", g: 200 }, { label: "Medium", g: 350 }] },
      { name: "Guava", cal: 68, p: 2.6, c: 14, f: 1, pieces: [{ label: "Small", g: 80 }, { label: "Medium", g: 120 }, { label: "Large", g: 160 }] },
      { name: "Corn cob", cal: 86, p: 3.2, c: 18.7, f: 1.2, pieces: [{ label: "Small", g: 100 }, { label: "Medium", g: 150 }, { label: "Large", g: 200 }] },
      { name: "Milk (whole)", cal: 61, p: 3.2, c: 4.8, f: 3.3 },
      { name: "Milk (toned)", cal: 46, p: 3.4, c: 5, f: 1.5 },
      { name: "Curd / yogurt (full fat)", cal: 98, p: 5, c: 4, f: 7 },
      { name: "Greek yogurt (0% fat)", cal: 59, p: 10, c: 3.6, f: 0.4 },
      { name: "Whey protein powder", cal: 370, p: 80, c: 6, f: 4, pieces: [{ label: "1 scoop", g: 30 }] },
      { name: "Almonds", cal: 579, p: 21, c: 22, f: 50, pieces: [{ label: "10 almonds", g: 12 }] },
      { name: "Walnuts", cal: 654, p: 15, c: 14, f: 65, pieces: [{ label: "1 half", g: 7 }] },
      { name: "Peanuts", cal: 567, p: 26, c: 16, f: 49 },
      { name: "Peanut butter", cal: 588, p: 25, c: 20, f: 50, pieces: [{ label: "1 tbsp", g: 16 }] },
      { name: "Potato (boiled)", cal: 86, p: 1.9, c: 20, f: 0.1, pieces: [{ label: "Small", g: 80 }, { label: "Medium", g: 130 }, { label: "Large", g: 200 }] },
      { name: "Sweet potato (boiled)", cal: 76, p: 1.6, c: 18, f: 0.1, pieces: [{ label: "Small", g: 100 }, { label: "Medium", g: 150 }, { label: "Large", g: 200 }] },
      { name: "Broccoli", cal: 34, p: 2.8, c: 7, f: 0.4, pieces: [{ label: "1 floret", g: 20 }] },
      { name: "Spinach (raw)", cal: 23, p: 2.9, c: 3.6, f: 0.4 },
      { name: "Tomato", cal: 18, p: 0.9, c: 3.9, f: 0.2, pieces: [{ label: "Small", g: 80 }, { label: "Medium", g: 120 }, { label: "Large", g: 160 }] },
      { name: "Onion", cal: 40, p: 1.1, c: 9, f: 0.1, pieces: [{ label: "Small", g: 70 }, { label: "Medium", g: 110 }, { label: "Large", g: 150 }] },
      { name: "Cucumber", cal: 16, p: 0.7, c: 3.6, f: 0.1, pieces: [{ label: "Small", g: 150 }, { label: "Medium", g: 250 }] },
      { name: "Carrot", cal: 41, p: 0.9, c: 10, f: 0.2, pieces: [{ label: "Small", g: 50 }, { label: "Medium", g: 80 }, { label: "Large", g: 120 }] },
      { name: "Cauliflower", cal: 25, p: 1.9, c: 5, f: 0.3, pieces: [{ label: "1 floret", g: 25 }] },
      { name: "Samosa", cal: 120, p: 2.5, c: 14, f: 6, pieces: [{ label: "1 piece", g: 60 }] },
      { name: "Palak paneer", cal: 180, p: 9, c: 8, f: 13 },
      { name: "Butter chicken", cal: 150, p: 12, c: 8, f: 8 },
      { name: "Biryani (chicken)", cal: 190, p: 12, c: 25, f: 5 },
      { name: "Chole", cal: 140, p: 7, c: 22, f: 3.5 },
      { name: "Upma", cal: 150, p: 4, c: 25, f: 4 },
      { name: "Poha", cal: 180, p: 3.5, c: 36, f: 3 },
      { name: "Olive oil", cal: 884, p: 0, c: 0, f: 100, pieces: [{ label: "1 tbsp", g: 14 }] },
      { name: "Ghee", cal: 900, p: 0, c: 0, f: 100, pieces: [{ label: "1 tsp", g: 5 }, { label: "1 tbsp", g: 14 }] },
      { name: "Sugar", cal: 387, p: 0, c: 100, f: 0, pieces: [{ label: "1 tsp", g: 4 }] },
      { name: "Honey", cal: 304, p: 0.3, c: 82, f: 0, pieces: [{ label: "1 tsp", g: 7 }, { label: "1 tbsp", g: 21 }] },
      { name: "Dark chocolate (70%+)", cal: 598, p: 8, c: 46, f: 43, pieces: [{ label: "1 square", g: 10 }] },
      { name: "Protein bar", cal: 350, p: 25, c: 40, f: 10, pieces: [{ label: "1 bar", g: 60 }] },
      // === BRANDED WHEY PROTEINS (India) — per 100g ===
      { name: "MuscleBlaze Whey Gold (chocolate)", cal: 392, p: 80, c: 7, f: 5, pieces: [{ label: "1 scoop (33g)", g: 33 }] },
      { name: "MuscleBlaze Biozyme Whey (vanilla)", cal: 388, p: 82, c: 5, f: 4, pieces: [{ label: "1 scoop (33g)", g: 33 }] },
      { name: "ON Gold Standard Whey (double choc)", cal: 385, p: 79, c: 7, f: 4, pieces: [{ label: "1 scoop (30g)", g: 30 }] },
      { name: "ON Gold Standard Whey (vanilla)", cal: 383, p: 80, c: 6, f: 4, pieces: [{ label: "1 scoop (30g)", g: 30 }] },
      { name: "Dymatize ISO100 (chocolate)", cal: 364, p: 86, c: 2, f: 1, pieces: [{ label: "1 scoop (29g)", g: 29 }] },
      { name: "MyProtein Impact Whey (chocolate)", cal: 378, p: 82, c: 5, f: 4, pieces: [{ label: "1 scoop (25g)", g: 25 }] },
      { name: "MyProtein Impact Whey (unflavoured)", cal: 370, p: 84, c: 3, f: 3, pieces: [{ label: "1 scoop (25g)", g: 25 }] },
      { name: "GNC AMP 100% Whey (chocolate)", cal: 380, p: 77, c: 9, f: 4, pieces: [{ label: "1 scoop (32g)", g: 32 }] },
      { name: "Muscle Feast Whey Isolate", cal: 360, p: 88, c: 2, f: 1, pieces: [{ label: "1 scoop (28g)", g: 28 }] },
      { name: "BigMuscles Nutrition Raw Whey", cal: 370, p: 78, c: 7, f: 4, pieces: [{ label: "1 scoop (30g)", g: 30 }] },
      { name: "AS-IT-IS Raw Whey Protein", cal: 372, p: 80, c: 6, f: 4, pieces: [{ label: "1 scoop (30g)", g: 30 }] },
      { name: "Nakpro Platinum Whey Isolate", cal: 356, p: 87, c: 2, f: 1, pieces: [{ label: "1 scoop (30g)", g: 30 }] },
      { name: "Fast&Up Whey Advanced (chocolate)", cal: 375, p: 78, c: 8, f: 4, pieces: [{ label: "1 scoop (32g)", g: 32 }] },
      { name: "MuscleBlaze Mass Gainer XXL", cal: 394, p: 16, c: 71, f: 4, pieces: [{ label: "1 serving (75g)", g: 75 }] },
      { name: "ON Serious Mass Gainer", cal: 380, p: 15, c: 74, f: 2, pieces: [{ label: "1 serving (334g)", g: 334 }] },
      // === READY-TO-EAT / PACKAGED FOODS (India) ===
      { name: "Quaker Oats (plain, uncooked)", cal: 374, p: 14, c: 64, f: 7 },
      { name: "Kellogg's Protein Muesli", cal: 378, p: 14, c: 62, f: 7, pieces: [{ label: "1 serving (40g)", g: 40 }] },
      { name: "Yoga Bar Oats & Berries Muesli", cal: 380, p: 10, c: 70, f: 5, pieces: [{ label: "1 serving (50g)", g: 50 }] },
      { name: "RiteBite Max Protein Bar (choco)", cal: 357, p: 30, c: 38, f: 9, pieces: [{ label: "1 bar", g: 67 }] },
      { name: "RiteBite Max Protein Bar (peanut)", cal: 360, p: 31, c: 36, f: 10, pieces: [{ label: "1 bar", g: 67 }] },
      { name: "Yoga Bar Protein Bar (chocolate)", cal: 350, p: 21, c: 40, f: 10, pieces: [{ label: "1 bar", g: 60 }] },
      { name: "Yoga Bar Protein Bar (peanut butter)", cal: 360, p: 20, c: 40, f: 12, pieces: [{ label: "1 bar", g: 60 }] },
      { name: "Mojo Bar (almond & raisin)", cal: 420, p: 8, c: 60, f: 16, pieces: [{ label: "1 bar", g: 35 }] },
      { name: "KIND Bar (dark chocolate nuts)", cal: 480, p: 6, c: 44, f: 29, pieces: [{ label: "1 bar", g: 40 }] },
      { name: "Epigamia Greek Yogurt (plain)", cal: 72, p: 7.5, c: 5, f: 2.5, pieces: [{ label: "1 cup (90g)", g: 90 }] },
      { name: "Epigamia Greek Yogurt (mango)", cal: 88, p: 5.5, c: 12, f: 2, pieces: [{ label: "1 cup (90g)", g: 90 }] },
      { name: "Keya Peanut Butter (crunchy)", cal: 585, p: 24, c: 22, f: 48, pieces: [{ label: "1 tbsp", g: 16 }] },
      { name: "MyFitness Peanut Butter (smooth)", cal: 596, p: 25, c: 20, f: 50, pieces: [{ label: "1 tbsp", g: 16 }] },
      { name: "Dr. Oetker FunFoods Hung Curd", cal: 120, p: 6, c: 6, f: 8 },
      { name: "Mother Dairy Cow Milk (full fat)", cal: 62, p: 3.4, c: 4.9, f: 3.2 },
      { name: "Amul Paneer (fresh)", cal: 265, p: 18, c: 3.6, f: 20, pieces: [{ label: "1 cube (30g)", g: 30 }] },
      { name: "Amul Dahi (full fat)", cal: 98, p: 5, c: 4, f: 7, pieces: [{ label: "1 cup (200g)", g: 200 }] },
      { name: "MTR Protein Oats (ready mix)", cal: 370, p: 12, c: 62, f: 7, pieces: [{ label: "1 sachet (40g)", g: 40 }] },
      { name: "Soulfull Millet Muesli", cal: 380, p: 9, c: 70, f: 6, pieces: [{ label: "1 serving (45g)", g: 45 }] },
      { name: "24 Mantra Organic Brown Rice", cal: 350, p: 7, c: 76, f: 2 },
      { name: "Tata Sampann High Protein Dal Mix", cal: 340, p: 24, c: 52, f: 3, pieces: [{ label: "1 serving (30g)", g: 30 }] },
      { name: "Saffola Oats (masala)", cal: 367, p: 11, c: 65, f: 7, pieces: [{ label: "1 packet (40g)", g: 40 }] },
      { name: "Britannia NutriChoice Digestive", cal: 467, p: 8, c: 68, f: 18, pieces: [{ label: "1 biscuit", g: 11 }] },
      { name: "Parle-G biscuit", cal: 450, p: 7, c: 74, f: 14, pieces: [{ label: "1 biscuit", g: 6 }] },
      { name: "Complan Nutrition Drink (chocolate)", cal: 400, p: 18, c: 60, f: 9, pieces: [{ label: "1 serving (33g)", g: 33 }] },
      { name: "Horlicks (original)", cal: 385, p: 12, c: 74, f: 5, pieces: [{ label: "1 serving (32g)", g: 32 }] },
      { name: "Boost Energy Drink", cal: 375, p: 10, c: 74, f: 4, pieces: [{ label: "1 serving (32g)", g: 32 }] },
      { name: "Bournvita (chocolate drink)", cal: 380, p: 5, c: 85, f: 2, pieces: [{ label: "2 tbsp", g: 20 }] },
      // === RESTAURANT / STREET FOOD ===
      { name: "Vada pav", cal: 267, p: 6, c: 43, f: 8, pieces: [{ label: "1 piece", g: 100 }] },
      { name: "Pav bhaji", cal: 185, p: 5, c: 28, f: 7 },
      { name: "Masala dosa", cal: 185, p: 5, c: 30, f: 5, pieces: [{ label: "1 dosa", g: 100 }] },
      { name: "Aloo paratha", cal: 260, p: 6, c: 40, f: 9, pieces: [{ label: "1 paratha", g: 100 }] },
      { name: "Egg bhurji (scrambled)", cal: 165, p: 11, c: 4, f: 12, pieces: [{ label: "2 eggs", g: 120 }] },
      { name: "Paneer tikka", cal: 220, p: 14, c: 7, f: 15, pieces: [{ label: "1 piece", g: 50 }] },
      { name: "Chicken tikka", cal: 165, p: 28, c: 4, f: 4, pieces: [{ label: "1 piece", g: 60 }] },
      { name: "Grilled fish (avg)", cal: 140, p: 24, c: 0, f: 4 },
      { name: "Egg roll (kati roll)", cal: 210, p: 10, c: 27, f: 7, pieces: [{ label: "1 roll", g: 150 }] },
      { name: "Chicken roll (kati roll)", cal: 240, p: 16, c: 28, f: 7, pieces: [{ label: "1 roll", g: 180 }] },
    ];

    const MET = { walking_slow: 2.5, walking_mod: 3.3, walking_fast: 4.3, jogging: 7.0, running_mod: 8.5, running_fast: 11.0, cycling_mod: 6.0, cycling_fast: 10.0, swimming: 6.0, elliptical: 5.0, stairclimber: 9.0, hiit: 14.0, jump_rope: 12.0, yoga: 2.5, pilates: 3.0 };
    const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' };
    const WATER_GOAL = 8;

    let profile = null, selFood = null, qtyMode = 'g', pieceIdx = 0;
    let viewDate = new Date().toISOString().slice(0, 10);
    const isToday = () => viewDate === todayKey();
    const todayKey = () => new Date().toISOString().slice(0, 10);
    function ls(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
    function ss(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
    function getDayData(k) { return ls('vd_' + k, { weight: null, foodLog: { breakfast: [], lunch: [], snacks: [], dinner: [] }, workoutLog: [], water: 0 }); }
    function saveDayData(k, d) { ss('vd_' + k, d); }
    function getTD() { return getDayData(viewDate); }
    function saveTD(d) { saveDayData(viewDate, d); }
    function getWH() { return ls('v_wh', []); }
    function saveWH(h) { ss('v_wh', h); }

    // DATE NAVIGATION
    function currentMonthStart() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    }
    function shiftDate(delta) {
      const d = new Date(viewDate + 'T12:00:00');
      d.setDate(d.getDate() + delta);
      const nk = d.toISOString().slice(0, 10);
      if (nk > todayKey()) return;
      if (nk < currentMonthStart()) return;
      viewDate = nk;
      updateDateNavUI();
      const activeTab = document.querySelector('.screen.active')?.id;
      if (activeTab === 'screen-food') { renderFoodLog(); }
      else if (activeTab === 'screen-workout') { renderWorkoutLog(); }
    }
    function setViewDate(key) {
      if (key > todayKey()) return;
      viewDate = key; updateDateNavUI();
    }
    function calCellClick(key) {
      if (key > todayKey()) return;
      if (key < currentMonthStart()) return;  // Previous months are read-only
      setViewDate(key);
      renderStreakCal();
      if (key === todayKey()) { return; }  // Just highlight today, no nav needed
      // Show a small sheet to choose food or workout log for that date
      const existing = document.getElementById('cal-nav-sheet'); if (existing) existing.remove();
      const d = new Date(key + 'T12:00:00');
      const dlabel = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      const sheet = document.createElement('div');
      sheet.id = 'cal-nav-sheet';
      sheet.className = 'modal-overlay open';
      sheet.innerHTML = `<div class="modal-sheet" style="gap:10px;">
    <div class="modal-handle"></div>
    <div style="font-size:15px;font-weight:600;">${dlabel}</div>
    <div style="font-size:13px;color:var(--text2);">Jump to:</div>
    <button class="btn btn-secondary" onclick="navToDateTab('food');document.getElementById('cal-nav-sheet').remove();">Food log for this day</button>
    <button class="btn btn-secondary" onclick="navToDateTab('workout');document.getElementById('cal-nav-sheet').remove();">Workout log for this day</button>
    <button class="btn btn-secondary" onclick="document.getElementById('cal-nav-sheet').remove();viewDate=todayKey();renderStreakCal();">Cancel</button>
  </div>`;
      document.body.appendChild(sheet);
      sheet.addEventListener('click', function (e) { if (e.target === this) { this.remove(); viewDate = todayKey(); renderStreakCal(); } });
    }
    function navToDateTab(tab) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('screen-' + tab).classList.add('active');
      const tabBtns = [...document.querySelectorAll('.tab-btn')];
      const tabMap = { dash: 0, weight: 1, food: 2, workout: 3, profile: 4 };
      if (tabBtns[tabMap[tab]]) tabBtns[tabMap[tab]].classList.add('active');
      updateDateNavUI();
      if (tab === 'food') renderFoodLog();
      if (tab === 'workout') renderWorkoutLog();
    }
    function updateDateNavUI() {
      const tk = todayKey(); const isT = viewDate === tk;
      const ms = currentMonthStart(); const isMs = viewDate === ms;
      const d = new Date(viewDate + 'T12:00:00');
      const label = isT ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const sub = isT ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric' });
      ['food', 'wo'].forEach(pfx => {
        const nl = document.getElementById(pfx + '-nav-label');
        const ns = document.getElementById(pfx + '-nav-sub');
        const nf = document.getElementById(pfx + '-nav-fwd');
        const nb = document.getElementById(pfx + '-nav-back');
        const pb = document.getElementById(pfx + '-past-banner');
        if (nl) nl.textContent = label; if (ns) ns.textContent = sub;
        if (nf) { nf.style.opacity = isT ? '0.25' : '1'; nf.style.pointerEvents = isT ? 'none' : 'auto'; }
        if (nb) { nb.style.opacity = isMs ? '0.25' : '1'; nb.style.pointerEvents = isMs ? 'none' : 'auto'; }
        if (pb) pb.style.display = isT ? 'none' : 'block';
      });
    }

    // CALCS
    function calcBMR(p) { return p.sex === 'male' ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5 : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161; }
    function calcTDEE(p) { return Math.round(calcBMR(p) * p.actMult); }
    function getDailyBudget() { if (!profile) return 2000; return ls('v_cal_override', null) || Math.round(calcTDEE(profile) - (profile.pace * 7700 / 7)); }
    function calcBurn(wl) { return wl.reduce((s, w) => s + (w.burned || 0), 0); }
    function calcFood(fl) { let cal = 0, p = 0, c = 0, f = 0; for (const m of Object.values(fl)) for (const i of m) { cal += i.cal; p += i.p; c += i.c; f += i.f; } return { cal: Math.round(cal), p: Math.round(p), c: Math.round(c), f: Math.round(f) }; }
    function getLatestW() { if (!profile) return 0; const wh = getWH(); return wh.length ? wh[wh.length - 1].w : profile.weight; }
    function daysToTarget() { if (!profile) return 0; const diff = getLatestW() - profile.targetWeight; return diff <= 0 ? 0 : Math.ceil((diff / profile.pace) * 7); }
    function pctProg() { if (!profile) return 0; const tot = profile.weight - profile.targetWeight; if (tot <= 0) return 100; return Math.min(100, Math.max(0, Math.round(((profile.weight - getLatestW()) / tot) * 100))); }
    function calcStreak() { let s = 0; for (let i = 0; i < 90; i++) { const dk = new Date(); dk.setDate(dk.getDate() - i); const dd = ls('vd_' + dk.toISOString().slice(0, 10), null); if (dd && (dd.weight || Object.values(dd.foodLog || {}).some(m => m.length > 0) || (dd.workoutLog || []).length > 0)) s++; else if (i > 0) break; } return Math.max(1, s); }

    // ONBOARDING
    function saveProfile() {
      const name = document.getElementById('ob-name').value.trim();
      const age = parseFloat(document.getElementById('ob-age').value);
      const height = parseFloat(document.getElementById('ob-height').value);
      const weight = parseFloat(document.getElementById('ob-weight').value);
      const targetWeight = parseFloat(document.getElementById('ob-target').value);
      if (!name || !age || !height || !weight || !targetWeight) { showToast('Please fill all fields'); return; }
      profile = { name, sex: document.getElementById('ob-sex').value, age, height, weight, targetWeight, pace: parseFloat(document.getElementById('ob-pace').value), actMult: parseFloat(document.getElementById('ob-activity').value), startDate: todayKey() };
      ss('v_profile', profile); initApp();
    }

    // INIT
    function initApp() {
      profile = ls('v_profile', null);
      if (!profile) { document.getElementById('onboarding').style.display = 'block'; document.getElementById('main-app').style.display = 'none'; return; }
      document.getElementById('onboarding').style.display = 'none';
      document.getElementById('main-app').style.display = 'block';
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('screen-dash').classList.add('active');
      document.querySelector('.tab-btn').classList.add('active');
      renderDashboard(); renderFoodLog(); renderWorkoutLog(); renderProfile(); renderWeightHistory();
    }

    // AI INSIGHT
    async function fetchAIInsight(force = false) {
      if (!profile) return;
      const ck = 'v_insight_' + todayKey();
      if (!force) { const c = ls(ck, null); if (c) { showInsight(c); return; } }
      const d = getTD(); const ft = calcFood(d.foodLog); const burned = calcBurn(d.workoutLog);
      const budget = getDailyBudget(); const deficit = budget - (ft.cal - burned);
      const wh = getWH(); const rw = wh.slice(-7).map(e => e.w);
      const wtrend = rw.length >= 2 ? (rw[rw.length - 1] - rw[0]).toFixed(1) : null;
      const prompt = `You are a concise, highly intelligent AI health coach in the premium fitness app "Sharir Shilpi". Give a personalized, sophisticated daily insight for ${profile.name} in exactly 2-3 short sentences. Be heavily data-driven based on today's logs, and provide one high-impact actionable tip. Use a motivating, modern tone. No fluff, no generic advice, no emojis.

Today's data:
- Current weight: ${getLatestW().toFixed(1)} kg → Target: ${profile.targetWeight} kg (${daysToTarget()} days to go)
- Calorie budget: ${budget} kcal | Eaten: ${ft.cal} kcal | Burned: ${burned} kcal | Net: ${ft.cal - burned} kcal | ${deficit > 0 ? deficit + ' kcal UNDER budget' : Math.abs(deficit) + ' kcal OVER budget'}
- Protein: ${ft.p}g | Carbs: ${ft.c}g | Fat: ${ft.f}g
- Water: ${d.water || 0} / 8 glasses
- Streak: ${calcStreak()} days
- Weight trend this week: ${wtrend !== null ? wtrend + ' kg change' : 'not enough data'}
- Workouts today: ${d.workoutLog.length}

Respond with ONLY the insight text. No labels, no formatting.`;

      setInsightLoading(true);
      try {
        const data = await aiFetch(prompt, 'groq', 1000);
        const text = data.content?.find(b => b.type === 'text')?.text || fallbackInsight(ft, burned, budget, deficit);
        ss(ck, text); showInsight(text);
      } catch (e) {
        if (e.message === 'NO_PROXY') showInsight(fallbackInsight(ft, burned, budget, deficit));
        else showInsight(fallbackInsight(ft, burned, budget, deficit));
      }
    }
    function setInsightLoading(on) {
      const el = document.getElementById('insight-text'); const btn = document.getElementById('regen-btn'); const dot = document.getElementById('idot');
      if (on) { el.innerHTML = '<div class="shimmer"></div><div class="shimmer" style="width:80%"></div><div class="shimmer" style="width:55%"></div>'; btn.style.display = 'none'; dot.classList.add('pulse'); }
    }
    function showInsight(text) {
      document.getElementById('insight-text').textContent = text;
      document.getElementById('regen-btn').style.display = 'block';
      document.getElementById('idot').classList.remove('pulse');
      const mood = getMoodFromInsight(text);
      setBuddyMood(mood);
    }
    function fallbackInsight(ft, burned, budget, deficit) {
      if (!profile) return 'Log your first entry to get personalised insights!';
      const w = getLatestW(); const days = daysToTarget();
      const lines = [];
      if (deficit > 100) lines.push(`You're ${deficit} kcal under budget today — on track.`);
      else if (deficit < 0) lines.push(`You're ${Math.abs(deficit)} kcal over budget — a 20-min walk would help.`);
      else lines.push('Right at your calorie target. Finish the day strong.');
      lines.push(`${(w - profile.targetWeight).toFixed(1)} kg to go — ${days} days at your current pace.`);
      if (ft.p < 80) lines.push(`Protein at ${ft.p}g — try to hit 80g+ to preserve muscle while losing fat.`);
      return lines.join(' ');
    }

    // MACRO TARGETS — based on profile
    function calcMacroTargets() {
      if (!profile) return { p: 150, c: 200, f: 65 };
      const w = getLatestW();
      const budget = getDailyBudget();
      // Protein: 1.8g/kg bodyweight (high for fat loss + muscle preservation)
      const p = Math.round(1.8 * w);
      // Fat: 25% of calories / 9
      const f = Math.round((budget * 0.25) / 9);
      // Carbs: remaining calories / 4
      const c = Math.round((budget - (p * 4) - (f * 9)) / 4);
      return { p, c: Math.max(50, c), f };
    }

    // DASHBOARD
    function renderDashboard() {
      if (!profile) return;
      const d = getTD(); const wh = getWH(); const latest = getLatestW();
      const h = new Date().getHours();
      document.getElementById('dash-greeting').textContent = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + ', ' + profile.name;
      document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      document.getElementById('streak-pill').textContent = 'Day ' + calcStreak();
      // Weight
      document.getElementById('prog-today').textContent = latest.toFixed(1) + ' kg';
      document.getElementById('prog-target').textContent = profile.targetWeight.toFixed(1) + ' kg';
      animateCount(document.getElementById('prog-days'), 0, daysToTarget(), 600);
      const pct = pctProg();
      document.getElementById('weight-prog-fill').style.width = pct + '%';
      document.getElementById('prog-pct').textContent = pct + '%';
      document.getElementById('prog-start-lbl').textContent = profile.weight + ' kg';
      document.getElementById('prog-target-lbl').textContent = profile.targetWeight + ' kg';
      // Cals
      const ft = calcFood(d.foodLog); const burned = calcBurn(d.workoutLog); const budget = getDailyBudget(); const net = ft.cal - burned; const deficit = budget - net;
      document.getElementById('dash-food-in').textContent = ft.cal + ' kcal';
      document.getElementById('dash-burned').textContent = burned + ' kcal';
      document.getElementById('dash-budget').textContent = budget + ' kcal';
      animateCount(document.getElementById('ring-net'), 0, net, 500);
      const de = document.getElementById('dash-deficit');
      de.textContent = deficit > 0 ? '-' + deficit + ' kcal' : '+' + Math.abs(deficit) + ' kcal';
      de.style.color = deficit > 0 ? 'var(--green)' : 'var(--red)';
      const pc = Math.min(1, ft.cal / budget);
      const ringColor = pc > 1 ? 'var(--red)' : pc > 0.85 ? 'var(--amber)' : 'var(--green)';
      animateCalRing(pc, ringColor);
      // Macros with profile-based targets
      const macroT = calcMacroTargets();
      document.getElementById('dash-p').textContent = ft.p + 'g';
      document.getElementById('dash-c').textContent = ft.c + 'g';
      document.getElementById('dash-f').textContent = ft.f + 'g';
      document.getElementById('dash-pt').textContent = '/ ' + macroT.p + 'g';
      document.getElementById('dash-ct').textContent = '/ ' + macroT.c + 'g';
      document.getElementById('dash-ft').textContent = '/ ' + macroT.f + 'g';
      const ppct = Math.round((ft.p / macroT.p) * 100);
      const cpct = Math.round((ft.c / macroT.c) * 100);
      const fpct = Math.round((ft.f / macroT.f) * 100);
      document.getElementById('prog-p').style.width = Math.min(100, ppct) + '%';
      document.getElementById('prog-p').style.background = ppct > 110 ? 'var(--red)' : ppct > 90 ? 'var(--green)' : '#60a5fa';
      document.getElementById('prog-c').style.width = Math.min(100, cpct) + '%';
      document.getElementById('prog-c').style.background = cpct > 110 ? 'var(--red)' : cpct > 90 ? 'var(--green)' : '#fbbf24';
      document.getElementById('prog-f').style.width = Math.min(100, fpct) + '%';
      document.getElementById('prog-f').style.background = fpct > 110 ? 'var(--red)' : fpct > 90 ? 'var(--green)' : '#f87171';
      // PRs — always rebuild from actual history so stale/phantom entries never show
      const prs = rebuildPRs(); const pc2 = document.getElementById('pr-container'); const keys = Object.keys(prs);
      pc2.innerHTML = keys.length ? keys.slice(0, 6).map(k => `<div class="pr-badge"><div class="pr-ex">${k}</div><div class="pr-val">${prs[k].w}kg × ${prs[k].r}</div></div>`).join('') : '<div style="color:var(--text3);font-size:13px;">No PRs yet. Crush your workout!</div>';
      // Streak calendar
      renderStreakCal();
      // Weekly
      let wo = 0, cg = 0, tw = 0, wd = 0;
      for (let i = 0; i < 7; i++) { const dk = new Date(); dk.setDate(dk.getDate() - i); const dd = ls('vd_' + dk.toISOString().slice(0, 10), null); if (!dd) continue; if ((dd.workoutLog || []).length) wo++; const ft2 = calcFood(dd.foodLog || { breakfast: [], lunch: [], snacks: [], dinner: [] }); if (ft2.cal > 0 && ft2.cal - calcBurn(dd.workoutLog || []) <= budget) cg++; if (dd.water) { tw += dd.water; wd++; } }
      document.getElementById('week-wo').textContent = wo + ' / 7'; document.getElementById('week-wo-fill').style.width = (wo / 7 * 100) + '%';
      document.getElementById('week-cal').textContent = cg + ' / 7'; document.getElementById('week-cal-fill').style.width = (cg / 7 * 100) + '%';
      document.getElementById('week-water').textContent = wd ? (tw / wd).toFixed(1) + ' glasses/day' : '—';
      fetchAIInsight(false);
    }

    function renderStreakCal() {
      const grid = document.getElementById('streak-cal'); const tk = todayKey();
      const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      let h = days.map(d => `<div class="cal-day-label">${d}</div>`).join('');
      const start = new Date(); start.setDate(start.getDate() - 29);
      for (let i = 0; i < start.getDay(); i++)h += '<div class="cal-cell future"></div>';
      for (let i = 0; i < 30; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i); const key = d.toISOString().slice(0, 10);
        const dd = ls('vd_' + key, null); const isT = key === tk;
        const hasLog = dd && (dd.weight || Object.values(dd.foodLog || {}).some(m => m.length > 0) || (dd.workoutLog || []).length > 0);
        const full = dd && dd.weight && Object.values(dd.foodLog || {}).some(m => m.length > 0);
        const isPast = key <= tk; const isThisMonth = key >= currentMonthStart();
        let cls = 'cal-cell' + (isPast && isThisMonth ? ' clickable' : ''); if (hasLog) cls += full ? ' logged-full' : ' logged'; if (isT) cls += ' today';
        if (key === viewDate && key !== tk) cls += ' selected';
        const clickable = isPast && isThisMonth;
        h += `<div class="${cls}" ${clickable ? `onclick="calCellClick('${key}')"` : 'title="Previous month — view only"'} style="${!isThisMonth && isPast ? 'opacity:0.35;cursor:default;' : ''}"></div>`;
      }
      grid.innerHTML = h;
      requestAnimationFrame(animateCalCells);
    }

    // WEIGHT
    function logWeight() {
      const val = parseFloat(document.getElementById('w-input').value);
      if (!val || val < 20 || val > 400) { showToast('Enter a valid weight'); return; }
      // Weight is always logged to today (not viewDate)
      const tk = todayKey();
      const d = getDayData(tk); d.weight = val; saveDayData(tk, d);
      const wh = getWH(); const ex = wh.findIndex(e => e.date === tk);
      if (ex >= 0) wh[ex].w = val; else wh.push({ date: tk, w: val });
      saveWH(wh); document.getElementById('w-input').value = '';
      showToast('Weight logged: ' + val + ' kg'); renderWeightHistory(); renderDashboard();
    }
    function renderWeightHistory() {
      const wh = getWH().slice().reverse().slice(0, 20); const c = document.getElementById('weight-history');
      if (!wh.length) { c.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0;">No entries yet.</div>'; return; }
      c.innerHTML = wh.map((e, i) => {
        const nxt = wh[i + 1]; const diff = nxt ? (e.w - nxt.w).toFixed(1) : null;
        const ds = new Date(e.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const dStr = diff ? (diff > 0 ? `<span style="color:var(--red)">+${diff}</span>` : `<span style="color:var(--green)">${diff}</span>`) : '';
        return `<div class="weight-entry"><div><div class="we-date">${ds}</div><div class="we-diff">${dStr}</div></div><div class="we-val">${e.w.toFixed(1)} <span style="font-size:13px;color:var(--text2)">kg</span></div></div>`;
      }).join('');
      renderWeightChart(wh.slice().reverse());
    }
    let wcInst = null;
    function renderWeightChart(wh) {
      const cv = document.getElementById('weight-chart'); if (!cv || !window.Chart) return;
      const data = wh.slice(-14); if (data.length < 2) return;
      const labels = data.map(e => new Date(e.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
      if (wcInst) wcInst.destroy();
      wcInst = new Chart(cv, { type: 'line', data: { labels, datasets: [{ data: data.map(e => e.w), borderColor: '#4ade80', borderWidth: 2, fill: false, tension: .35, pointBackgroundColor: '#4ade80', pointRadius: 3 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw.toFixed(1) + ' kg' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#5e5e5a', font: { size: 10 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#5e5e5a', font: { size: 10 }, callback: v => v + 'kg' } } } } });
    }

    // WATER
    function renderWater() {
      const d = getTD(); const g = d.water || 0;
      document.getElementById('water-pill').textContent = g + ' / ' + WATER_GOAL + ' glasses';
      document.getElementById('water-ml').textContent = (g * 250) + ' ml today';
      let h = ''; for (let i = 0; i < WATER_GOAL; i++)h += `<div class="wdrop ${i < g ? 'filled' : ''}" onclick="setWater(${i + 1})"><svg width="14" height="14" viewBox="0 0 24 24" fill="${i < g ? 'var(--cyan)' : 'var(--text3)'}"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg></div>`;
      document.getElementById('water-drops').innerHTML = h;
    }
    function addWater(n) { const d = getTD(); d.water = Math.min(WATER_GOAL + 4, (d.water || 0) + n); saveTD(d); renderWater(); renderDashboard(); }
    function removeWater() { const d = getTD(); d.water = Math.max(0, (d.water || 0) - 1); saveTD(d); renderWater(); }
    function setWater(n) { const d = getTD(); d.water = n; saveTD(d); renderWater(); }

    // FOOD
    function renderFoodLog() {
      const d = getTD(); const ft = calcFood(d.foodLog);
      document.getElementById('food-total-cal').textContent = ft.cal;
      const isT2 = viewDate === todayKey();
      const foodDateEl = document.getElementById('food-kcal-label');
      if (foodDateEl) foodDateEl.textContent = isT2 ? 'kcal today' : 'kcal this day';
      document.getElementById('food-date-sub').textContent = isT2 ? new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : new Date(viewDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      updateDateNavUI();
      const mc = document.getElementById('meals-container');
      mc.innerHTML = Object.entries(MEAL_LABELS).map(([key, label]) => {
        const items = d.foodLog[key] || []; const mc2 = items.reduce((s, i) => s + i.cal, 0);
        const ih = items.map((item, idx) => `<div class="food-item"><div class="food-item-info"><div class="food-name">${item.name}</div><div class="food-detail">${item.ql} · P:${Math.round(item.p)}g C:${Math.round(item.c)}g F:${Math.round(item.f)}g</div></div><div style="display:flex;align-items:center;"><div class="food-item-right"><div class="food-cal">${Math.round(item.cal)}</div><div class="food-macro">kcal</div></div><button class="del-btn" onclick="removeFood('${key}',${idx})">×</button></div></div>`).join('');
        return `<div class="card" style="margin-bottom:0;"><div class="meal-header" onclick="openAddFoodFor('${key}')"><span class="meal-name">${label}</span><div style="display:flex;align-items:center;gap:8px;"><span class="meal-cals">${Math.round(mc2)} kcal</span><span style="color:var(--accent);font-size:18px;font-weight:300;">+</span></div></div>${ih || '<div style="font-size:12px;color:var(--text3);padding:8px 0;">Nothing logged</div>'}</div>`;
      }).join('<div style="height:10px;"></div>');
      renderWater();
    }
    function openAddFood() { document.getElementById('food-modal').classList.add('open'); document.getElementById('fm-search').focus(); }
    function openAddFoodFor(m) { document.getElementById('food-modal').classList.add('open'); document.getElementById('fm-meal').value = m; document.getElementById('fm-search').focus(); }
    // ============================================================
    // CUSTOM FOOD SYSTEM
    // ============================================================
    function getCustomFoods() { return ls('v_custom_foods', []); }
    function saveCustomFoods(arr) { ss('v_custom_foods', arr); }

    // Merge custom foods into search — returns objects with {food, isCustom, customIdx}
    function getAllFoods() {
      const custom = getCustomFoods();
      return [
        ...FOODS.map(f => ({ food: f, isCustom: false, customIdx: -1 })),
        ...custom.map((f, i) => ({ food: f, isCustom: true, customIdx: i }))
      ];
    }

    let cfServingCount = 0;

    function switchFoodModalTab(tab) {
      ['search', 'myfoods', 'create'].forEach(t => {
        document.getElementById('fm-tab-' + t).classList.toggle('active', t === tab);
        document.getElementById('fm-panel-' + t).style.display = t === tab ? 'flex' : 'none';
        if (t === tab) document.getElementById('fm-panel-' + t).style.flexDirection = 'column';
      });
      if (tab === 'myfoods') renderMyFoods();
      if (tab === 'create') { resetCFForm(); }
    }

    function renderMyFoods() {
      const custom = getCustomFoods();
      const container = document.getElementById('cf-list-container');
      if (!custom.length) {
        container.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:16px 0;text-align:center;">No custom foods yet.<br>Use the Create tab to add your first food.</div>';
        return;
      }
      container.innerHTML = custom.map((f, i) => `
    <div class="cf-item">
      <div style="flex:1;min-width:0;">
        <div class="cf-item-name">${f.name} <span class="cf-badge">custom</span></div>
        <div class="cf-item-macro">P:${f.p}g · C:${f.c}g · F:${f.f}g per 100g</div>
      </div>
      <div style="display:flex;align-items:center;">
        <span class="cf-cal-badge">${f.cal}</span>
        <div class="cf-item-actions">
          <button class="cf-act-btn cf-use-btn" onclick="selCustomFood(${i})">Use</button>
          <button class="cf-act-btn cf-edit-btn" onclick="editCustomFood(${i})">Edit</button>
          <button class="cf-act-btn cf-del-btn" onclick="deleteCustomFood(${i})">Del</button>
        </div>
      </div>
    </div>`).join('');
    }

    function selCustomFood(i) {
      const f = getCustomFoods()[i];
      selFood = { ...f, isCustom: true };
      switchFoodModalTab('search');
      document.getElementById('fm-search').value = f.name;
      document.getElementById('fm-sel-name').textContent = f.name + ' ';
      const badge = document.createElement('span'); badge.className = 'cf-badge'; badge.textContent = 'custom';
      document.getElementById('fm-sel-name').appendChild(badge);
      document.getElementById('fm-sel-macro').textContent = `Per 100g: ${f.cal} kcal · P:${f.p}g · C:${f.c}g · F:${f.f}g`;
      document.getElementById('fm-selected-info').style.display = 'block';
      document.getElementById('fm-add-btn').style.display = 'block';
      document.getElementById('qmode-p').style.display = f.pieces && f.pieces.length ? 'block' : 'none';
      setQtyMode('g'); document.getElementById('fm-qty-g').value = 100; updatePreview();
    }

    function deleteCustomFood(i) {
      if (!confirm('Delete this custom food?')) return;
      const arr = getCustomFoods(); arr.splice(i, 1); saveCustomFoods(arr);
      renderMyFoods(); showToast('Custom food deleted');
    }

    function editCustomFood(i) {
      const f = getCustomFoods()[i];
      switchFoodModalTab('create');
      document.getElementById('cf-name').value = f.name;
      document.getElementById('cf-cal').value = f.cal;
      document.getElementById('cf-p').value = f.p;
      document.getElementById('cf-c').value = f.c;
      document.getElementById('cf-f').value = f.f;
      document.getElementById('cf-edit-id').textContent = i;
      document.getElementById('cf-save-btn').textContent = 'Update food';
      // Restore serving sizes
      cfServingCount = 0;
      document.getElementById('cf-servings-list').innerHTML = '';
      if (f.pieces && f.pieces.length) {
        f.pieces.forEach(ps => {
          addCFServing();
          const idx = cfServingCount - 1;
          document.getElementById('cf-sname-' + idx).value = ps.label;
          document.getElementById('cf-sg-' + idx).value = ps.g;
        });
      }
      updateCFPreview();
    }

    function addCFServing() {
      const idx = cfServingCount++;
      const row = document.createElement('div');
      row.id = 'cf-serving-row-' + idx;
      row.style.cssText = 'display:grid;grid-template-columns:1fr 80px 28px;gap:6px;align-items:center;';
      row.innerHTML = `
    <input class="form-input" id="cf-sname-${idx}" type="text" placeholder="e.g. 1 cup, 1 scoop" style="padding:10px 12px;font-size:13px;"/>
    <input class="form-input" id="cf-sg-${idx}" type="number" placeholder="g" min="1" style="padding:10px 12px;font-size:13px;text-align:center;"/>
    <button onclick="removeCFServing(${idx})" style="width:28px;height:28px;border-radius:50%;background:var(--red-bg);border:none;color:var(--red);cursor:pointer;font-size:16px;flex-shrink:0;">×</button>`;
      document.getElementById('cf-servings-list').appendChild(row);
    }

    function removeCFServing(idx) {
      const row = document.getElementById('cf-serving-row-' + idx);
      if (row) row.remove();
    }

    function updateCFPreview() {
      const cal = parseFloat(document.getElementById('cf-cal').value) || 0;
      const p = parseFloat(document.getElementById('cf-p').value) || 0;
      const carb = parseFloat(document.getElementById('cf-c').value) || 0;
      const fat = parseFloat(document.getElementById('cf-f').value) || 0;
      const prev = document.getElementById('cf-preview');
      if (!cal && !p && !carb && !fat) { prev.style.display = 'none'; return; }
      const calsFromMacros = (p * 4) + (carb * 4) + (fat * 9);
      const diff = Math.abs(cal - calsFromMacros);
      let msg = `Macros account for ${Math.round(calsFromMacros)} kcal`;
      if (diff > 15) msg += ` — <span style="color:var(--amber)">differs from entered calories by ${Math.round(diff)} kcal</span>`;
      else msg += ` <span style="color:var(--green)">✓ matches calories</span>`;
      prev.innerHTML = msg; prev.style.display = 'block';
    }

    function resetCFForm() {
      ['cf-name', 'cf-cal', 'cf-p', 'cf-c', 'cf-f'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      document.getElementById('cf-servings-list').innerHTML = '';
      document.getElementById('cf-preview').style.display = 'none';
      document.getElementById('cf-edit-id').textContent = '';
      document.getElementById('cf-save-btn').textContent = 'Save to My Foods';
      cfServingCount = 0;
    }

    function saveCustomFood() {
      const name = document.getElementById('cf-name').value.trim();
      const cal = parseFloat(document.getElementById('cf-cal').value);
      const p = parseFloat(document.getElementById('cf-p').value) || 0;
      const carb = parseFloat(document.getElementById('cf-c').value) || 0;
      const fat = parseFloat(document.getElementById('cf-f').value) || 0;
      if (!name) { showToast('Enter a food name'); return; }
      if (!cal || cal <= 0) { showToast('Enter calories'); return; }
      // Collect serving sizes
      const pieces = [];
      for (let i = 0; i < cfServingCount; i++) {
        const sn = document.getElementById('cf-sname-' + i);
        const sg = document.getElementById('cf-sg-' + i);
        if (!sn || !sg) continue;
        const label = sn.value.trim(); const g = parseFloat(sg.value);
        if (label && g > 0) pieces.push({ label, g });
      }
      const food = { name, cal, p, c: carb, f: fat, pieces: pieces.length ? pieces : undefined, isCustom: true };
      const arr = getCustomFoods();
      const editIdx = document.getElementById('cf-edit-id').textContent;
      if (editIdx !== '') {
        arr[parseInt(editIdx)] = food;
        saveCustomFoods(arr);
        showToast('Food updated');
      } else {
        // Check duplicate name
        if (arr.some(f => f.name.toLowerCase() === name.toLowerCase())) { showToast('A food with this name already exists'); return; }
        arr.push(food);
        saveCustomFoods(arr);
        showToast(name + ' saved to My Foods');
      }
      resetCFForm();
      switchFoodModalTab('myfoods');
    }

    function closeAddFood() {
      document.getElementById('food-modal').classList.remove('open');
      document.getElementById('fm-search').value = ''; document.getElementById('fm-results').style.display = 'none';
      document.getElementById('fm-selected-info').style.display = 'none'; document.getElementById('fm-add-btn').style.display = 'none';
      selFood = null; qtyMode = 'g'; pieceIdx = 0; setQtyMode('g');
      // Reset to search tab
      switchFoodModalTab('search');
    }
    function searchFood(q) {
      const r = document.getElementById('fm-results'); if (!q || q.length < 2) { r.style.display = 'none'; return; }
      const custom = getCustomFoods();
      const customMatches = custom.map((f, i) => ({ f, isCustom: true, idx: i })).filter(x => x.f.name.toLowerCase().includes(q.toLowerCase()));
      const builtinMatches = FOODS.map((f, i) => ({ f, isCustom: false, idx: i })).filter(x => x.f.name.toLowerCase().includes(q.toLowerCase()));
      const combined = [...customMatches, ...builtinMatches].slice(0, 12);
      r.style.display = 'block';
      if (!combined.length) {
        r.innerHTML = `
      <div style="padding:12px 14px;border-bottom:0.5px solid var(--border);">
        <div style="font-size:13px;color:var(--text2);margin-bottom:10px;">No results for "<strong>${q}</strong>"</div>
        <button onclick="askAIForFood()" style="width:100%;padding:10px;border-radius:var(--radius-sm);background:var(--sky-bg);border:1px solid rgba(58,143,168,0.25);color:var(--sky2);font-size:13px;font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;">
          <span style="font-size:16px;">🐝</span> Ask AI — look up nutrition for this
        </button>
      </div>`;
        return;
      }
      r.innerHTML = combined.map(({ f, isCustom, idx }) => {
        const badge = isCustom ? '<span class="cf-badge">custom</span>' : '';
        const onclick = isCustom ? `selCustomFood(${idx})` : `selFoodFn(${idx})`;
        return `<div class="search-item" onclick="${onclick}"><div><div class="search-item-name">${f.name} ${badge}</div><div class="search-item-detail">${f.pieces ? 'Grams or pieces' : 'Per 100g'} · P:${f.p}g C:${f.c}g F:${f.f}g</div></div><div class="search-item-cal">${f.cal}</div></div>`;
      }).join('') +
        `<div style="padding:10px 14px;border-top:0.5px solid var(--border);background:var(--bg3);border-radius:0 0 var(--radius-sm) var(--radius-sm);">
    <button onclick="askAIForFood()" style="width:100%;padding:8px;border-radius:var(--radius-sm);background:transparent;border:none;color:var(--sky2);font-size:12px;font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;">
      <span style="font-size:13px;">🐝</span> Not what you want? Ask AI
    </button>
  </div>`;
    }
    // ============================================================
    // AI FOOD LOOKUP — Claude API
    // ============================================================
    async function askAIForFood() {
      const query = document.getElementById('fm-search').value.trim();
      if (!query) return;
      const r = document.getElementById('fm-results');
      const meal = document.getElementById('fm-meal').value;

      // Show loading state
      r.style.display = 'block';
      r.innerHTML = `
    <div style="padding:20px 14px;text-align:center;">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:20px;animation:buddyBounce 1s ease-in-out infinite;display:inline-block;">🐝</span>
        <span style="font-size:13px;color:var(--text2);font-weight:500;">Looking up nutrition info...</span>
      </div>
      <div style="font-size:11px;color:var(--text3);">Asking AI for accurate macros</div>
    </div>`;

      const prompt = `You are a precise nutrition database. The user wants to log: "${query}"

Return ONLY a JSON object with these exact fields (no markdown, no explanation, just raw JSON):
{
  "name": "exact food name as the user described it",
  "qty_g": estimated grams if a quantity was mentioned (e.g. 40 for "40g"), otherwise 100,
  "per100g": {
    "cal": calories per 100g as a number,
    "p": protein grams per 100g,
    "c": carbohydrate grams per 100g,
    "f": fat grams per 100g
  },
  "confidence": "high" or "medium" or "low",
  "note": "one short sentence about data source or uncertainty if any"
}

Rules:
- For branded products (e.g. Alpino, MuscleBlaze, Quaker), use the actual label values if known
- For restaurant or home dishes, use best estimates from standard Indian nutrition data
- All numbers must be realistic and internally consistent (protein*4 + carbs*4 + fat*9 ≈ calories)
- qty_g is purely for pre-filling the quantity field, it does not affect the per100g values
- Return ONLY the JSON, nothing else`;

      try {
        const data = await aiFetch(prompt, 'groq', 600);
        const raw = data.content?.find(b => b.type === 'text')?.text || '';
        // Extract JSON robustly — handles markdown fences, leading text, trailing text
        let cleaned = raw;
        // Try to extract just the JSON object if there's surrounding text
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
        else cleaned = raw.replace(/```json|```/gi, '').trim();
        let result;
        try {
          result = JSON.parse(cleaned);
        } catch (parseErr) {
          // Show the raw response so we can diagnose
          throw new Error('Parse failed. Raw response was: ' + raw.slice(0, 300));
        }
        showAIFoodResult(result, query);
      } catch (e) {
        const noKey = e.message === 'NO_PROXY';
        console.error('AI food lookup error:', e);
        r.innerHTML = `
      <div style="padding:14px;">
        <div style="font-size:13px;color:var(--red);margin-bottom:8px;font-weight:600;">${noKey ? '🔑 API key not set' : '⚠️ Lookup failed'}</div>
        <div style="font-size:11px;color:var(--text3);line-height:1.6;margin-bottom:10px;">${noKey
            ? 'Find <code style="background:var(--bg4);padding:1px 4px;border-radius:3px;">PROXY_URL</code> near the top of the script and paste your Cloudflare Worker URL'
            : 'Error: ' + e.message
          }</div>
        ${!noKey ? `<button onclick="askAIForFood()" style="width:100%;padding:9px;border-radius:var(--radius-sm);background:var(--sky-bg);border:1px solid rgba(58,143,168,0.25);color:var(--sky2);font-size:13px;font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;">Try again</button>` : ''}
      </div>`;
      }
    }

    function showAIFoodResult(result, originalQuery) {
      const r = document.getElementById('fm-results');
      const { name, qty_g, per100g, confidence, note } = result;
      const { cal, p, c, f } = per100g;
      const confColor = confidence === 'high' ? 'var(--green)' : confidence === 'medium' ? 'var(--amber)' : 'var(--red)';
      const confIcon = confidence === 'high' ? '✓' : confidence === 'medium' ? '~' : '?';

      r.innerHTML = `
    <div style="padding:14px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;">
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--text);">${name}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px;">${note || ''}</div>
        </div>
        <span style="font-size:10px;font-weight:700;color:${confColor};background:${confColor}18;padding:3px 8px;border-radius:99px;white-space:nowrap;flex-shrink:0;">${confIcon} ${confidence} confidence</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;background:var(--bg3);border-radius:var(--radius-sm);padding:10px;">
        <div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">Cals</div><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace;color:var(--amber);">${cal}</div></div>
        <div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">Protein</div><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace;color:var(--blue);">${p}g</div></div>
        <div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">Carbs</div><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace;color:var(--orange);">${c}g</div></div>
        <div style="text-align:center;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">Fat</div><div style="font-size:14px;font-weight:700;font-family:'DM Mono',monospace;color:var(--red);">${f}g</div></div>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px;">Per 100g — adjust quantity below</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
        <input id="ai-qty" type="number" value="${qty_g || 100}" min="1" step="1"
          style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius-sm);padding:10px 12px;font-size:15px;color:var(--text);font-family:'Space Grotesk',sans-serif;outline:none;"
          oninput="updateAIPreview(${cal},${p},${c},${f})"/>
        <span style="font-size:13px;color:var(--text2);">g</span>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:10px;color:var(--text3);">Total cals</div>
          <div id="ai-cal-preview" style="font-size:18px;font-weight:700;font-family:'DM Mono',monospace;color:var(--amber);">${Math.round(cal * (qty_g || 100) / 100)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="logAIFood(${JSON.stringify(result).replace(/'/g, '&apos;').replace(/"/g, '&quot;')})" 
          style="flex:1;padding:10px;background:var(--sky);color:#faf7f3;border:none;border-radius:var(--radius-sm);font-size:13px;font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;">
          Log to ${document.getElementById('fm-meal').options[document.getElementById('fm-meal').selectedIndex].text}
        </button>
        <button onclick="saveAIFoodToMyFoods(${JSON.stringify(result).replace(/'/g, '&apos;').replace(/"/g, '&quot;')})"
          style="padding:10px 14px;background:var(--green-bg);border:1px solid rgba(46,125,79,0.2);color:var(--green2);border-radius:var(--radius-sm);font-size:12px;font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;white-space:nowrap;">
          + Save
        </button>
      </div>
    </div>`;
    }

    function updateAIPreview(cal100, p100, c100, f100) {
      const qty = parseFloat(document.getElementById('ai-qty').value) || 0;
      const prev = document.getElementById('ai-cal-preview');
      if (prev) prev.textContent = Math.round(cal100 * qty / 100);
    }

    function logAIFood(resultJson) {
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      const { name, per100g } = result;
      const { cal, p, c, f } = per100g;
      const qty = parseFloat(document.getElementById('ai-qty').value) || 100;
      const ratio = qty / 100;
      const meal = document.getElementById('fm-meal').value;
      const d = getTD();
      d.foodLog[meal].push({
        name, ql: qty + 'g',
        cal: cal * ratio, p: p * ratio, c: c * ratio, f: f * ratio
      });
      saveTD(d);
      closeAddFood(); renderFoodLog(); renderDashboard();
      showToast(name + ' logged');
    }

    function saveAIFoodToMyFoods(resultJson) {
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      const { name, per100g } = result;
      const { cal, p, c, f } = per100g;
      const arr = getCustomFoods();
      if (arr.some(x => x.name.toLowerCase() === name.toLowerCase())) {
        showToast('Already in My Foods'); return;
      }
      arr.push({ name, cal, p, c, f, isCustom: true });
      saveCustomFoods(arr);
      showToast(name + ' saved to My Foods');
      // Re-render the result with "saved" indicator
      const saveBtn = document.querySelector('[onclick^="saveAIFoodToMyFoods"]');
      if (saveBtn) { saveBtn.textContent = '✓ Saved'; saveBtn.disabled = true; saveBtn.style.opacity = '0.6'; }
    }

    function selFoodFn(idx) {
      selFood = FOODS[idx]; document.getElementById('fm-search').value = selFood.name; document.getElementById('fm-results').style.display = 'none';
      document.getElementById('fm-sel-name').textContent = selFood.name;
      document.getElementById('fm-sel-macro').textContent = `Per 100g: ${selFood.cal} kcal · P:${selFood.p}g · C:${selFood.c}g · F:${selFood.f}g`;
      document.getElementById('fm-selected-info').style.display = 'block'; document.getElementById('fm-add-btn').style.display = 'block';
      document.getElementById('qmode-p').style.display = selFood.pieces ? 'block' : 'none';
      setQtyMode('g'); document.getElementById('fm-qty-g').value = 100; updatePreview();
    }
    function setQtyMode(m) {
      qtyMode = m;
      document.getElementById('qmode-g').classList.toggle('active', m === 'g'); document.getElementById('qmode-p').classList.toggle('active', m === 'p');
      document.getElementById('qty-g-sec').style.display = m === 'g' ? 'block' : 'none'; document.getElementById('qty-p-sec').style.display = m === 'p' ? 'block' : 'none';
      if (m === 'p' && selFood && selFood.pieces) { pieceIdx = 0; renderPiecePicker(); } updatePreview();
    }
    function renderPiecePicker() {
      if (!selFood || !selFood.pieces) return;
      document.getElementById('piece-picker').innerHTML = selFood.pieces.map((ps, i) => `<div class="psz-btn ${i === pieceIdx ? 'active' : ''}" onclick="selPiece(${i})">${ps.label}<br><span style="font-size:10px;color:var(--text3);">${ps.g}g</span></div>`).join('');
    }
    function selPiece(i) { pieceIdx = i; renderPiecePicker(); updatePreview(); }
    function updatePreview() {
      if (!selFood) return;
      if (qtyMode === 'g') { const q = parseFloat(document.getElementById('fm-qty-g').value) || 0; document.getElementById('fm-cal-g').textContent = Math.round(selFood.cal * (q / 100)) + ' kcal'; }
      else { if (!selFood.pieces) return; const ps = selFood.pieces[pieceIdx]; const qty = parseFloat(document.getElementById('fm-qty-p').value) || 1; const tg = ps.g * qty; document.getElementById('fm-cal-p').textContent = Math.round(selFood.cal * (tg / 100)) + ' kcal'; document.getElementById('piece-note').textContent = '= ' + tg + 'g total'; }
    }
    function addFoodEntry() {
      if (!selFood) return; const meal = document.getElementById('fm-meal').value; let grams, ql;
      if (qtyMode === 'g') { grams = parseFloat(document.getElementById('fm-qty-g').value); if (!grams || grams <= 0) { showToast('Enter quantity'); return; } ql = grams + 'g'; }
      else { const ps = selFood.pieces[pieceIdx]; const qty = parseFloat(document.getElementById('fm-qty-p').value) || 1; grams = ps.g * qty; ql = qty + (qty === 1 ? ' piece' : ' pieces') + ' (' + ps.label + ', ' + grams + 'g)'; }
      const r = grams / 100; const d = getTD();
      d.foodLog[meal].push({ name: selFood.name, ql, cal: selFood.cal * r, p: selFood.p * r, c: selFood.c * r, f: selFood.f * r });
      saveTD(d); closeAddFood(); renderFoodLog(); renderDashboard(); showToast(selFood.name + ' added');
    }
    function removeFood(meal, idx) { const d = getTD(); d.foodLog[meal].splice(idx, 1); saveTD(d); renderFoodLog(); renderDashboard(); }

    // WORKOUT
    function openLogSheet() {
      document.getElementById('log-sheet').classList.add('open');
    }
    function addSetForExercise(exName) {
      // Open the log sheet, switch to strength, pre-fill exercise name
      openLogSheet();
      // Switch to strength tab
      const strengthBtn = document.querySelector('.wtype-btn:last-child');
      if (strengthBtn) setWType('strength', strengthBtn);
      // Pre-fill the exercise field after a tick (sheet needs to render)
      setTimeout(() => {
        const exInput = document.getElementById('wo-exercise');
        if (exInput) {
          exInput.value = exName;
          // Also update the muscle group filter to match if possible — just clear it
          const mgInput = document.getElementById('wo-muscle-group');
          if (mgInput) mgInput.value = '';
          filterExercises();
          // Focus the sets field so user can start typing immediately
          const setsInput = document.getElementById('wo-sets');
          if (setsInput) setsInput.focus();
        }
      }, 80);
    }

    function closeLogSheet() {
      document.getElementById('log-sheet').classList.remove('open');
      // Clear form fields
      document.getElementById('wo-duration').value = '';
      const hrEl = document.getElementById('wo-hr'); if (hrEl) hrEl.value = '';
      ['wo-exercise', 'wo-sets', 'wo-reps', 'wo-weight', 'wo-str-dur'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      document.getElementById('wo-burn-preview').textContent = '— kcal';
      // Uncheck dist fields
      const cb = document.getElementById('wo-use-dist'); if (cb) cb.checked = false;
      const df = document.getElementById('wo-dist-fields'); if (df) df.style.display = 'none';
      const wd = document.getElementById('wo-incline-dist'); if (wd) wd.style.display = 'none';
    }
    function setWType(type, el) {
      document.querySelectorAll('.wtype-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('wo-form-cardio').style.display = type !== 'strength' ? 'block' : 'none';
      document.getElementById('wo-form-strength').style.display = type === 'strength' ? 'block' : 'none';
    }

    // EXERCISE LIBRARY — muscle group filter
    const EXERCISES = {
      chest: ['Flat barbell bench press', 'Incline barbell bench press', 'Decline barbell bench press', 'Flat dumbbell bench press', 'Incline dumbbell bench press', 'Decline dumbbell bench press', 'Dumbbell chest fly', 'Cable chest fly (low-to-high)', 'Cable chest fly (high-to-low)', 'Pec deck machine fly', 'Push-up', 'Wide-grip push-up', 'Diamond push-up', 'Chest dip', 'Smith machine bench press', 'Landmine press'],
      back: ['Deadlift', 'Romanian deadlift', 'Sumo deadlift', 'Trap bar deadlift', 'Barbell row', 'Pendlay row', 'T-bar row', 'Seal row', 'Dumbbell row', 'Cable row (seated)', 'Cable row (single-arm)', 'Lat pulldown (wide grip)', 'Lat pulldown (close grip)', 'Lat pulldown (underhand)', 'Pull-up', 'Chin-up', 'Neutral grip pull-up', 'Assisted pull-up', 'Straight-arm pulldown', 'Hyperextension', 'Good morning'],
      shoulders: ['Overhead press (barbell)', 'Overhead press (dumbbell)', 'Seated dumbbell press', 'Arnold press', 'Lateral raise (dumbbell)', 'Lateral raise (cable)', 'Front raise (dumbbell)', 'Front raise (cable)', 'Face pull', 'Upright row (barbell)', 'Upright row (cable)', 'Shrug (barbell)', 'Shrug (dumbbell)', 'Rear delt fly (dumbbell)', 'Rear delt fly (cable)', 'Reverse pec deck', 'Landmine lateral raise'],
      legs: ['Back squat', 'Front squat', 'Goblet squat', 'Bulgarian split squat', 'Hack squat', 'Leg press', 'Smith machine squat', 'Box squat', 'Lunge (barbell)', 'Lunge (dumbbell)', 'Walking lunge', 'Reverse lunge', 'Leg curl (lying)', 'Leg curl (seated)', 'Leg extension', 'Hip thrust', 'Hip thrust (barbell)', 'Glute bridge', 'Sumo squat', 'Step-up', 'Calf raise (standing)', 'Calf raise (seated)', 'Donkey calf raise'],
      arms: ['Barbell curl', 'EZ bar curl', 'Dumbbell curl', 'Hammer curl', 'Incline dumbbell curl', 'Concentration curl', 'Preacher curl', 'Cable curl (straight bar)', 'Cable curl (rope)', 'Cable curl (single-arm)', 'Tricep pushdown (rope)', 'Tricep pushdown (straight bar)', 'Overhead tricep extension', 'Skull crusher (EZ bar)', 'Skull crusher (dumbbell)', 'Close-grip bench press', 'Tricep kickback', 'Tricep dip (bench)', 'Cable overhead tricep extension', 'Reverse curl', 'Wrist curl', 'Wrist extension'],
      core: ['Plank', 'Side plank', 'Ab wheel rollout', 'Cable crunch', 'Crunch', 'Decline crunch', 'Hanging leg raise', 'Hanging knee raise', 'Dragon flag', 'Hollow hold', 'Russian twist', 'Woodchop (cable)', 'Pallof press', 'Decline sit-up', 'V-up', 'Bicycle crunch'],
      compound: ['Power clean', 'Hang clean', 'Clean and press', 'Thruster', 'Farmers walk', 'Suitcase carry', 'Kettlebell swing', 'Kettlebell goblet squat', 'Box jump', 'Broad jump', 'Battle rope waves', 'Sled push', 'Sled pull', 'Tyre flip']
    };
    function filterExercises() {
      const mg = document.getElementById('wo-muscle-group').value;
      const dl = document.getElementById('ex-list');
      const exInput = document.getElementById('wo-exercise');
      exInput.value = '';
      if (!mg) {
        dl.innerHTML = Object.values(EXERCISES).flat().map(e => `<option value="${e}"/>`).join('');
      } else {
        dl.innerHTML = (EXERCISES[mg] || []).map(e => `<option value="${e}"/>`).join('');
      }
    }
    function onActivityChange() {
      const ak = document.getElementById('wo-activity').value;
      const isWalkRun = ['walking_slow', 'walking_mod', 'walking_fast', 'jogging', 'running_mod', 'running_fast'].includes(ak);
      document.getElementById('wo-incline-dist').style.display = isWalkRun ? 'block' : 'none';
      if (!isWalkRun) { const cb = document.getElementById('wo-use-dist'); if (cb) cb.checked = false; const df = document.getElementById('wo-dist-fields'); if (df) df.style.display = 'none'; }
      updateBurnPreview();
    }
    function toggleDistFields() {
      const checked = document.getElementById('wo-use-dist').checked;
      document.getElementById('wo-dist-fields').style.display = checked ? 'flex' : 'none';
      updateBurnPreview();
    }
    function calcCardioBurnFull(ak, dur, weight, dist, incline, hr) {
      // If HR provided, use Karvonen-derived formula (more accurate for aerobic)
      // kcal/min = (0.6309×HR + 0.1988×weight_lb + 0.2017×age - 55.0969) / 4.184
      // We use kg, so convert: weight_lb = weight*2.2046
      // Age from profile if available, default 30
      if (hr > 50 && dur > 0) {
        const age = (profile && profile.age) || 30;
        const wlb = weight * 2.2046;
        const kcalMin = (0.6309 * hr + 0.1988 * wlb + 0.2017 * age - 55.0969) / 4.184;
        return Math.max(1, Math.round(kcalMin * dur));
      }
      return calcCardioburn(ak, dur, weight, dist, incline);
    }
    function calcCardioburn(ak, dur, weight, dist, incline) {
      // Base MET-based burn
      let met = MET[ak] || 5;
      // For walk/run, if distance provided, use more accurate formula
      const isWalkRun = ['walking_slow', 'walking_mod', 'walking_fast', 'jogging', 'running_mod', 'running_fast'].includes(ak);
      if (isWalkRun && dist > 0) {
        // Speed in m/min
        const distM = dist * 1000;
        const speed = dur > 0 ? distM / dur : 0;
        // ACSM walking formula (VO2 ml/kg/min): 0.1*speed + 1.8*speed*grade + 3.5
        // Running formula: 0.2*speed + 0.9*speed*grade + 3.5
        const grade = (incline || 0) / 100;
        let vo2;
        if (ak.startsWith('walking')) { vo2 = 0.1 * speed + 1.8 * speed * grade + 3.5; }
        else { vo2 = 0.2 * speed + 0.9 * speed * grade + 3.5; }
        // kcal/min = VO2(L/min) * 5 = (vo2/1000)*weight*5
        return Math.round((vo2 / 1000) * weight * 5 * dur);
      }
      // Incline MET adjustment for walk/run without distance
      if (isWalkRun && (incline || 0) > 0) { met = met + (incline * 0.5); }
      return Math.round(met * weight / 60 * dur);
    }
    function updateBurnPreview() {
      const dur = parseFloat(document.getElementById('wo-duration').value) || 0;
      const ak = document.getElementById('wo-activity').value;
      const useDist = document.getElementById('wo-use-dist') && document.getElementById('wo-use-dist').checked;
      const dist = useDist ? (parseFloat(document.getElementById('wo-distance').value) || 0) : 0;
      const incline = useDist ? (parseFloat(document.getElementById('wo-incline').value) || 0) : 0;
      const hrEl = document.getElementById('wo-hr');
      const hr = hrEl ? (parseFloat(hrEl.value) || 0) : 0;
      const burn = calcCardioBurnFull(ak, dur, getLatestW(), dist, incline, hr);
      document.getElementById('wo-burn-preview').textContent = burn ? burn + ' kcal' : '— kcal';
    }
    function logCardio() {
      const dur = parseFloat(document.getElementById('wo-duration').value); if (!dur || dur <= 0) { showToast('Enter duration'); return; }
      const ak = document.getElementById('wo-activity').value;
      let al = document.getElementById('wo-activity').options[document.getElementById('wo-activity').selectedIndex].text;
      const useDist = document.getElementById('wo-use-dist') && document.getElementById('wo-use-dist').checked;
      const dist = useDist ? (parseFloat(document.getElementById('wo-distance').value) || 0) : 0;
      const incline = useDist ? (parseFloat(document.getElementById('wo-incline').value) || 0) : 0;
      const hrEl = document.getElementById('wo-hr'); const hr = hrEl ? (parseFloat(hrEl.value) || 0) : 0;
      const burned = calcCardioBurnFull(ak, dur, getLatestW(), dist, incline, hr);
      let detail = '';
      if (dist > 0) detail += ' · ' + dist + 'km';
      if (incline > 0) detail += ' · ' + incline + '% incline';
      const d = getTD(); d.workoutLog.push({ type: 'cardio', name: al + detail, duration: dur, burned, dist, incline }); saveTD(d);
      document.getElementById('wo-duration').value = '';
      if (hrEl) hrEl.value = '';
      if (useDist) { document.getElementById('wo-distance').value = ''; document.getElementById('wo-incline').value = ''; }
      closeLogSheet();
      renderWorkoutLog(); renderDashboard();
      showToast('Logged: ' + burned + ' kcal burned');
    }
    function logStrength() {
      const ex = document.getElementById('wo-exercise').value.trim(); const sets = parseInt(document.getElementById('wo-sets').value); const reps = parseInt(document.getElementById('wo-reps').value);
      const wt = parseFloat(document.getElementById('wo-weight').value); const dur = parseFloat(document.getElementById('wo-str-dur').value) || 45;
      if (!ex || !sets || !reps) { showToast('Fill in exercise details'); return; }
      // Strength calorie formula:
      // Active lifting time ≈ sets × reps × 3 seconds per rep
      // Rest of duration = rest periods (lower MET ~2.5)
      // Plus mechanical work component: sets × reps × weight(kg) × 0.0003
      const liftingSeconds = sets * reps * 3;
      const liftingMins = Math.min(liftingSeconds / 60, dur);
      const restMins = Math.max(0, dur - liftingMins);
      const activeBurn = Math.round(6.0 * getLatestW() / 60 * liftingMins);
      const restBurn = Math.round(2.5 * getLatestW() / 60 * restMins);
      const volumeBonus = wt > 0 ? Math.round(sets * reps * wt * 0.0003 * getLatestW()) : 0;
      const burned = activeBurn + restBurn + volumeBonus;
      const d = getTD();
      d.workoutLog.push({ type: 'strength', name: ex, sets, reps, weight: wt || 0, duration: dur, burned }); saveTD(d);
      if (wt > 0) { const prs = ls('v_prs', {}); if (!prs[ex] || wt > prs[ex].w || (wt === prs[ex].w && reps > prs[ex].r)) { prs[ex] = { w: wt, r: reps, s: sets, date: todayKey() }; ss('v_prs', prs); showToast('New PR! ' + ex + ' ' + wt + 'kg × ' + reps); } else showToast(ex + ' logged · ' + burned + ' kcal burned'); }
      else showToast(ex + ' logged');
      // Keep sheet open for strength — user may want to log another set
      // Only clear numeric fields, keep exercise name populated
      ['wo-sets', 'wo-reps', 'wo-weight', 'wo-str-dur'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      renderWorkoutLog(); renderDashboard();
      const logBtn = document.querySelector('#wo-form-strength .btn-primary');
      if (logBtn) { const orig = logBtn.textContent; logBtn.textContent = 'Set logged!'; logBtn.style.background = 'var(--green2)'; setTimeout(() => { logBtn.textContent = orig; logBtn.style.background = ''; }, 1200); }
    }
    function renderWorkoutLog() {
      updateDateNavUI();
      const isT = viewDate === todayKey();
      const d = getTD(); const list = document.getElementById('workout-log-list'); let tb = 0;
      const lbl = document.getElementById('wo-log-label');
      const vd = new Date(viewDate + 'T12:00:00');
      if (lbl) lbl.textContent = isT ? "Today's workouts" : vd.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' workouts';
      if (!d.workoutLog.length) {
        list.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px 0;">No workouts logged yet. Tap + to add.</div>';
        document.getElementById('wo-total-burn').textContent = '0'; return;
      }

      // Separate cardio and strength
      const cardios = []; const strengthGroups = {};
      d.workoutLog.forEach((w, i) => {
        tb += w.burned;
        if (w.type === 'cardio' || !w.type) { cardios.push({ w, i }); }
        else {
          const key = w.name;
          if (!strengthGroups[key]) strengthGroups[key] = [];
          strengthGroups[key].push({ w, i });
        }
      });

      let html = '';

      // Cardio entries — simple rows
      cardios.forEach(({ w, i }) => {
        html += `<div class="wo-group">
      <div class="wo-cardio-row">
        <div class="wo-cardio-icon">🏃</div>
        <div class="wo-cardio-info">
          <div class="wo-cardio-name">${w.name}</div>
          <div class="wo-cardio-detail">${w.duration} min${w.dist ? ` · ${w.dist}km` : ''}${w.incline ? ` · ${w.incline}% incline` : ''}</div>
        </div>
        <div style="font-size:13px;color:var(--sky);font-family:'DM Mono',monospace;font-weight:600;flex-shrink:0;margin-right:8px;">${w.burned} kcal</div>
        <button class="wo-set-del" onclick="removeWorkout(${i})">×</button>
      </div>
    </div>`;
      });

      // Strength groups
      Object.entries(strengthGroups).forEach(([exName, sets]) => {
        const groupTotal = sets.reduce((s, { w }) => s + w.burned, 0);
        const setRows = sets.map(({ w, i }, si) => `
      <div class="wo-set-row">
        <span class="wo-set-badge">Set ${si + 1}</span>
        <span class="wo-set-detail">${w.sets}×${w.reps}${w.weight ? ' @ ' + w.weight + 'kg' : ''} · ${w.duration}min</span>
        <span class="wo-set-cal">${w.burned} kcal</span>
        <div class="wo-set-actions">
          <button class="wo-set-edit" onclick="editWorkout(${i})">Edit</button>
          <button class="wo-set-del" onclick="removeWorkout(${i})">×</button>
        </div>
      </div>`).join('');
        const safeEx = exName.replace(/'/g, "\\'");
        html += `<div class="wo-group">
      <div class="wo-group-header">
        <span class="wo-group-name">${exName}</span>
        <span class="wo-group-total">${sets.length} set${sets.length > 1 ? 's' : ''} · ${groupTotal} kcal</span>
      </div>
      ${setRows}
      <div style="padding:8px 14px;">
        <button onclick="addSetForExercise('${safeEx}')" style="width:100%;padding:8px;border-radius:var(--radius-sm);background:transparent;border:1.5px dashed rgba(58,143,168,0.3);color:var(--sky2);font-size:12px;font-weight:600;cursor:pointer;font-family:'Space Grotesk',sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .15s;" onmouseover="this.style.background='var(--sky-bg)'" onmouseout="this.style.background='transparent'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add set
        </button>
      </div>
    </div>`;
      });

      list.innerHTML = html;
      document.getElementById('wo-total-burn').textContent = tb;
    }

    function editWorkout(idx) {
      const d = getTD(); const w = d.workoutLog[idx];
      if (!w || w.type !== 'strength') return;
      const overlay = document.createElement('div'); overlay.className = 'modal-overlay open'; overlay.id = 'edit-wo-overlay';
      overlay.innerHTML = `<div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Edit: ${w.name}</div>
    <div class="two-col">
      <div class="form-group"><div class="form-label">Sets</div><input class="edit-field" id="ew-sets" type="number" value="${w.sets}" min="1"/></div>
      <div class="form-group"><div class="form-label">Reps</div><input class="edit-field" id="ew-reps" type="number" value="${w.reps}" min="1"/></div>
    </div>
    <div class="two-col">
      <div class="form-group"><div class="form-label">Weight (kg)</div><input class="edit-field" id="ew-weight" type="number" value="${w.weight || ''}" step="0.5"/></div>
      <div class="form-group"><div class="form-label">Duration (min)</div><input class="edit-field" id="ew-dur" type="number" value="${w.duration || 45}" min="1"/></div>
    </div>
    <button class="btn btn-primary" onclick="saveEditWorkout(${idx})">Save changes</button>
    <button class="btn btn-secondary" onclick="document.getElementById('edit-wo-overlay').remove()">Cancel</button>
  </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) { if (e.target === this) this.remove(); });
    }
    function wipePRs() {
      if (!confirm('Clear all PR records? They will rebuild from your workout history when you next open the dashboard.')) return;
      ss('v_prs', {});
      rebuildPRs();
      renderDashboard();
      showToast('PR records cleared');
    }
    function rebuildPRs() {
      // Scan all stored days and recompute PRs from scratch
      const prs = {};
      for (let i = 0; i < 90; i++) {
        const dk = new Date(); dk.setDate(dk.getDate() - i);
        const key = dk.toISOString().slice(0, 10);
        const dd = ls('vd_' + key, null);
        if (!dd || (dd.workoutLog || []).length === 0) continue;
        for (const w of dd.workoutLog) {
          if (w.type !== 'strength' || !w.weight || w.weight <= 0) continue;
          const ex = w.name;
          if (!prs[ex] || w.weight > prs[ex].w || (w.weight === prs[ex].w && (w.reps || 0) > prs[ex].r)) {
            prs[ex] = { w: w.weight, r: w.reps || 0, s: w.sets || 0, date: key };
          }
        }
      }
      ss('v_prs', prs);
      return prs;
    }

    function saveEditWorkout(idx) {
      const d = getTD(); const w = d.workoutLog[idx];
      const sets = parseInt(document.getElementById('ew-sets').value) || w.sets;
      const reps = parseInt(document.getElementById('ew-reps').value) || w.reps;
      const weight = parseFloat(document.getElementById('ew-weight').value) || w.weight;
      const dur = parseFloat(document.getElementById('ew-dur').value) || w.duration;
      const liftingSecsE = sets * reps * 3;
      const liftingMinsE = Math.min(liftingSecsE / 60, dur);
      const restMinsE = Math.max(0, dur - liftingMinsE);
      const burned = Math.round(6.0 * getLatestW() / 60 * liftingMinsE)
        + Math.round(2.5 * getLatestW() / 60 * restMinsE)
        + (weight > 0 ? Math.round(sets * reps * weight * 0.0003 * getLatestW()) : 0);
      d.workoutLog[idx] = { ...w, sets, reps, weight, duration: dur, burned };
      saveTD(d);
      // Rebuild all PRs from history so edits/downgrades are reflected correctly
      const oldPR = ls('v_prs', {})[w.name];
      rebuildPRs();
      const newPR = ls('v_prs', {})[w.name];
      document.getElementById('edit-wo-overlay').remove();
      renderWorkoutLog(); renderDashboard();
      if (newPR && oldPR && newPR.w > oldPR.w) showToast('New PR! ' + w.name + ' ' + newPR.w + 'kg');
      else showToast('Set updated');
    }
    function removeWorkout(idx) { const d = getTD(); d.workoutLog.splice(idx, 1); saveTD(d); rebuildPRs(); renderWorkoutLog(); renderDashboard(); showToast('Workout removed'); }

    // PROFILE
    function renderProfile() {
      if (!profile) return;
      const tdee = calcTDEE(profile); const goal = getDailyBudget(); const def = tdee - goal;
      document.getElementById('tdee-display').textContent = tdee + ' kcal/day';
      document.getElementById('tdee-breakdown').textContent = `BMR: ${Math.round(calcBMR(profile))} × ${profile.actMult} = ${tdee} TDEE · Goal: ${goal} kcal/day (${def} kcal deficit)`;
      const ov = ls('v_cal_override', null); if (ov) document.getElementById('cal-override').value = ov;
      document.getElementById('edit-weight').value = profile.weight; document.getElementById('edit-target').value = profile.targetWeight; document.getElementById('edit-pace').value = profile.pace;
      document.getElementById('profile-stats').innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="metric-tile"><div class="lbl">Name</div><div style="font-size:16px;font-weight:500;">${profile.name}</div></div><div class="metric-tile"><div class="lbl">Age</div><div class="val">${profile.age}</div></div><div class="metric-tile"><div class="lbl">Height</div><div class="val">${profile.height}<span> cm</span></div></div><div class="metric-tile"><div class="lbl">Start weight</div><div class="val">${profile.weight}<span> kg</span></div></div><div class="metric-tile"><div class="lbl">Target weight</div><div class="val" style="color:var(--green)">${profile.targetWeight}<span> kg</span></div></div><div class="metric-tile"><div class="lbl">Pace</div><div style="font-size:15px;font-weight:500;">${profile.pace} kg/wk</div></div></div>`;
    }
    function saveCalOverride() { const val = parseFloat(document.getElementById('cal-override').value); if (!val) { ss('v_cal_override', null); showToast('Using TDEE goal'); } else { ss('v_cal_override', Math.round(val)); showToast('Goal set to ' + Math.round(val) + ' kcal'); } renderDashboard(); }
    function saveProfileEdits() {
      profile.weight = parseFloat(document.getElementById('edit-weight').value) || profile.weight;
      profile.targetWeight = parseFloat(document.getElementById('edit-target').value) || profile.targetWeight;
      profile.pace = parseFloat(document.getElementById('edit-pace').value) || profile.pace;
      ss('v_profile', profile); renderProfile(); renderDashboard(); showToast('Profile updated');
    }
    function resetApp() { if (!confirm('Reset all data?')) return; localStorage.clear(); location.reload(); }

    // NAV
    const TAB_ORDER = ['dash', 'weight', 'food', 'workout', 'profile'];
    let _lastTab = 'dash';
    function switchTab(tab, el, keepDate) {
      const fromIdx = TAB_ORDER.indexOf(_lastTab); const toIdx = TAB_ORDER.indexOf(tab);
      const goLeft = toIdx < fromIdx;
      document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active', 'slide-left'); });
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const scr = document.getElementById('screen-' + tab);
      scr.classList.add('active');
      if (goLeft) scr.classList.add('slide-left');
      el.classList.add('active');
      _lastTab = tab;
      if (!keepDate && tab !== 'dash') viewDate = todayKey();
      if (tab === 'dash') { viewDate = todayKey(); renderDashboard(); }
      if (tab === 'weight') renderWeightHistory();
      if (tab === 'food') { updateDateNavUI(); renderFoodLog(); }
      if (tab === 'workout') { updateDateNavUI(); renderWorkoutLog(); }
      if (tab === 'profile') renderProfile();
    }

    // TOAST
    // ============================================================
    // ANIMATIONS
    // ============================================================
    function addRipple(e) {
      const btn = e.currentTarget;
      const r = document.createElement('span'); r.className = 'ripple-effect';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;`;
      btn.appendChild(r); setTimeout(() => r.remove(), 500);
    }
    document.addEventListener('click', e => { const b = e.target.closest('.btn'); if (b) addRipple({ currentTarget: b, clientX: e.clientX, clientY: e.clientY }); });

    function animateCount(el, from, to, dur = 600, suffix = '') {
      const start = performance.now();
      const update = now => {
        const pct = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - pct, 3);
        const val = Math.round(from + (to - from) * ease);
        el.textContent = val + suffix;
        if (pct < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }

    function animateCalRing(pct, color) {
      const ring = document.getElementById('cal-ring'); if (!ring) return;
      const target = 251.2 * (1 - Math.min(1, pct));
      ring.style.strokeDashoffset = 251.2; ring.style.stroke = color;
      const start = performance.now();
      const anim = now => {
        const t = Math.min((now - start) / 700, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        ring.style.strokeDashoffset = 251.2 + (target - 251.2) * ease;
        if (t < 1) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }

    function animateCalCells() {
      const cells = document.querySelectorAll('.cal-cell:not(.future)');
      cells.forEach((cell, i) => {
        cell.classList.remove('cal-animate');
        setTimeout(() => cell.classList.add('cal-animate'), i * 18);
      });
    }

    // BUDDY MOODS
    const BUDDY_MOODS = {
      // Bee face: eyes at (23.5,12) and (32.5,12), mouth base at y≈16.5, brows at y≈8.5
      motivated: {
        mouth: 'M24.5 16.5 Q28 19.5 31.5 16.5',
        browL: 'M21 8.5 Q23.5 7.2 26 8.5',
        browR: 'M30 8.5 Q32.5 7.2 35 8.5',
        label: 'Your coach says', eyeScale: 1
      },
      celebrating: {
        mouth: 'M23 16 Q28 21 33 16',
        browL: 'M21 7.5 Q23.5 5.8 26 7.5',
        browR: 'M30 7.5 Q32.5 5.8 35 7.5',
        label: 'Smashing it!', eyeScale: 1.15
      },
      cautious: {
        mouth: 'M24.5 18 Q28 16.5 31.5 18',
        browL: 'M21 9.5 Q23.5 8.5 26 9',
        browR: 'M30 9 Q32.5 8.5 35 9.5',
        label: 'Heads up', eyeScale: 0.9
      },
      warning: {
        mouth: 'M24.5 18.5 Q28 17 31.5 18.5',
        browL: 'M21 10 Q23.5 8 26 9.5',
        browR: 'M30 9.5 Q32.5 8 35 10',
        label: 'Watch out', eyeScale: 0.85
      },
    };

    function getMoodFromInsight(text) {
      if (!text || text.includes('shimmer')) return 'motivated';
      const t = text.toLowerCase();
      if (t.includes('pr') || t.includes('streak') || t.includes('smashing') || t.includes('great') || t.includes('on track')) return 'celebrating';
      if (t.includes('over budget') || t.includes('watch') || t.includes('careful')) return 'warning';
      if (t.includes('try') || t.includes('aim') || t.includes('heads') || t.includes('consider')) return 'cautious';
      return 'motivated';
    }

    function setBuddyMood(mood) {
      const m = BUDDY_MOODS[mood] || BUDDY_MOODS.motivated;
      const mouth = document.getElementById('buddy-mouth');
      const browL = document.getElementById('buddy-brow-l');
      const browR = document.getElementById('buddy-brow-r');
      const lbl = document.getElementById('buddy-mood-label');
      const eyeL = document.getElementById('buddy-eye-l');
      const eyeR = document.getElementById('buddy-eye-r');
      if (mouth) mouth.setAttribute('d', m.mouth);
      if (browL) browL.setAttribute('d', m.browL);
      if (browR) browR.setAttribute('d', m.browR);
      if (lbl) lbl.textContent = m.label;
      if (eyeL) { eyeL.setAttribute('r', (2.5 * m.eyeScale).toFixed(1)); }
      if (eyeR) { eyeR.setAttribute('r', (2.5 * m.eyeScale).toFixed(1)); }
    }

    function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); }

    // EVENTS
    document.getElementById('wo-duration').addEventListener('input', updateBurnPreview);
    document.getElementById('food-modal').addEventListener('click', function (e) { if (e.target === this) closeAddFood(); });
    window.addEventListener('load', initApp);