/**
 * Utility functions for Sharir Shilpi
 */

export const PROXY_URL = 'https://sharir-shilpi-proxy.srikar-3101.workers.dev';

export async function anthropicFetch(prompt, maxTokens = 600) {
  if (!PROXY_URL || PROXY_URL.trim() === '') {
    throw new Error('NO_PROXY');
  }
  const resp = await fetch(PROXY_URL.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.error?.message || 'HTTP ' + resp.status;
    throw new Error(msg);
  }
  if (data.text !== undefined) {
    return { content: [{ type: 'text', text: data.text }] };
  }
  return data;
}

export function ls(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
}

export function ss(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}

export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function animateCount(el, from, to, dur = 600, suffix = '') {
  const start = performance.now();
  const update = (now) => {
    const pct = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - pct, 3);
    const val = Math.round(from + (to - from) * ease);
    el.textContent = val + suffix;
    if (pct < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

export function addRipple(e) {
  const btn = e.currentTarget;
  const ripple = document.createElement('span');
  ripple.className = 'ripple-wave';
  
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  btn.appendChild(ripple);
  
  // Cleanup after animation
  setTimeout(() => ripple.remove(), 800);
}
