/* ============================================================
   AI for Creators & Researchers — progress tracking
   Separate localStorage namespace from Course 1.
   ============================================================ */
(function () {
  const KEY = 'aiCRProgress';
  const NAME_KEY = 'aiCRLearnerName';
  const TOTAL_DAYS = 30;

  function load() {
    try { const r = localStorage.getItem(KEY); return r ? (JSON.parse(r) || {}) : {}; } catch { return {}; }
  }
  function save(obj) { localStorage.setItem(KEY, JSON.stringify(obj)); }
  function count() { const p = load(); return Object.keys(p).filter(k => p[k] === true).length; }
  function done(d) { return !!load()[String(d)]; }
  function mark(d, v) { const p = load(); if (v) p[String(d)] = true; else delete p[String(d)]; save(p); }
  function name() { return localStorage.getItem(NAME_KEY) || ''; }
  function saveName(n) { localStorage.setItem(NAME_KEY, n); }

  function renderLanding() {
    const c = count();
    const pct = Math.round((c / TOTAL_DAYS) * 100);
    const inner = document.querySelector('.progress-inner');
    const l = document.querySelector('.progress-labels .left');
    const r = document.querySelector('.progress-labels .right');
    if (inner) inner.style.width = pct + '%';
    if (l) l.textContent = c + ' of ' + TOTAL_DAYS + ' days complete';
    if (r) r.textContent = pct + '%';

    document.querySelectorAll('.day-card[data-day]').forEach(card => {
      const d = parseInt(card.getAttribute('data-day'), 10);
      card.classList.toggle('done', done(d));
    });

    const welcome = document.querySelector('[data-welcome]');
    if (welcome) {
      if (c === 0) welcome.textContent = 'You have not started yet — Day 1 is ready for you.';
      else if (c < TOTAL_DAYS) welcome.textContent = 'Welcome back. ' + (TOTAL_DAYS - c) + ' days to go.';
      else welcome.textContent = 'All 30 days complete. Your certificate is waiting on Day 30.';
    }
  }

  function wireComplete() {
    const wrap = document.querySelector('.complete-box');
    if (!wrap) return;
    const d = parseInt(wrap.getAttribute('data-day'), 10);
    const btn = wrap.querySelector('.complete-btn');
    const status = wrap.querySelector('.complete-status');

    function refresh() {
      const isDone = done(d);
      wrap.classList.toggle('done', isDone);
      btn.classList.toggle('done', isDone);
      btn.textContent = isDone ? 'Completed' : 'Mark Day ' + d + ' as complete';
      if (status) {
        status.textContent = isDone
          ? 'Saved locally. Progress: ' + count() + ' of ' + TOTAL_DAYS + ' days.'
          : 'Click after you have finished the Advanced Exercise.';
      }
    }
    refresh();
    btn.addEventListener('click', () => { mark(d, !done(d)); refresh(); });
  }

  function wireCert() {
    const gate = document.getElementById('cert-gate');
    if (!gate) return;
    const c = count();
    const remaining = TOTAL_DAYS - c;
    const locked = document.getElementById('cert-locked');
    const unlocked = document.getElementById('cert-unlocked');
    const progressNote = document.getElementById('cert-progress');
    if (progressNote) progressNote.textContent = c + ' of ' + TOTAL_DAYS + ' days complete';

    if (remaining > 0) {
      if (locked) {
        locked.style.display = 'block';
        const remText = locked.querySelector('#cert-remaining');
        if (remText) remText.textContent = remaining + ' day' + (remaining === 1 ? '' : 's') + ' remaining';
      }
      if (unlocked) unlocked.style.display = 'none';
    } else {
      if (locked) locked.style.display = 'none';
      if (unlocked) {
        unlocked.style.display = 'block';
        const input = unlocked.querySelector('.name-input-large');
        if (input) {
          input.value = name();
          input.addEventListener('input', () => saveName(input.value.trim()));
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderLanding();
    wireComplete();
    wireCert();
  });

  window.AICR = { totalDays: TOTAL_DAYS, count, done, name };
})();
