/* ============================================================
   AI Certificate in 28 Days — progress tracking
   All state lives in localStorage under aiCertProgress.
   ============================================================ */

(function () {
  const KEY = 'aiCertProgress';
  const NAME_KEY = 'aiCertLearnerName';
  const TOTAL_DAYS = 28;

  function loadProgress() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return typeof obj === 'object' && obj !== null ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(obj) {
    localStorage.setItem(KEY, JSON.stringify(obj));
  }

  function completedCount() {
    const p = loadProgress();
    return Object.keys(p).filter(k => p[k] === true).length;
  }

  function isComplete(day) {
    const p = loadProgress();
    return !!p[String(day)];
  }

  function markComplete(day, completedFlag) {
    const p = loadProgress();
    if (completedFlag) p[String(day)] = true;
    else delete p[String(day)];
    saveProgress(p);
  }

  function learnerName() {
    return localStorage.getItem(NAME_KEY) || '';
  }

  function saveLearnerName(name) {
    localStorage.setItem(NAME_KEY, name);
  }

  /* ---- Landing page: render progress summary + dots ---- */

  function renderProgressSummary() {
    const done = completedCount();
    const pct = Math.round((done / TOTAL_DAYS) * 100);

    const barInner = document.querySelector('.progress-bar-inner');
    const statsLeft = document.querySelector('.progress-stats .stats-left');
    const statsRight = document.querySelector('.progress-stats .stats-right');
    if (barInner) barInner.style.width = pct + '%';
    if (statsLeft) statsLeft.textContent = done + ' of ' + TOTAL_DAYS + ' days complete';
    if (statsRight) statsRight.textContent = pct + '%';

    document.querySelectorAll('.day-card[data-day]').forEach(card => {
      const day = parseInt(card.getAttribute('data-day'), 10);
      if (isComplete(day)) card.classList.add('done');
      else card.classList.remove('done');
    });

    const reminder = document.querySelector('[data-welcome-reminder]');
    if (reminder) {
      if (done === 0) reminder.textContent = "You haven't started yet — Day 1 is waiting.";
      else if (done < TOTAL_DAYS) reminder.textContent = 'Welcome back. ' + (TOTAL_DAYS - done) + ' days to go.';
      else reminder.textContent = 'You finished all 28 days. Your certificate is ready on Day 28.';
    }
  }

  /* ---- Day page: mark complete button ---- */

  function wireMarkComplete() {
    const wrap = document.querySelector('.mark-complete-wrap');
    if (!wrap) return;
    const day = parseInt(wrap.getAttribute('data-day'), 10);
    const btn = wrap.querySelector('.mark-complete-btn');
    const status = wrap.querySelector('.mark-complete-status');

    function refresh() {
      const done = isComplete(day);
      wrap.classList.toggle('done', done);
      btn.classList.toggle('done', done);
      btn.textContent = done ? 'Completed' : 'Mark Day ' + day + ' as complete';
      if (status) {
        status.textContent = done
          ? 'Nice work. Progress: ' + completedCount() + ' of ' + TOTAL_DAYS + ' days.'
          : 'Tap when you have finished the exercise.';
      }
    }
    refresh();

    btn.addEventListener('click', () => {
      markComplete(day, !isComplete(day));
      refresh();
    });
  }

  /* ---- Certificate page ---- */

  function wireCertificate() {
    const gate = document.getElementById('cert-gate');
    if (!gate) return;
    const done = completedCount();
    const remaining = TOTAL_DAYS - done;

    const lockedView = document.getElementById('cert-locked');
    const unlockedView = document.getElementById('cert-unlocked');
    const progressNote = document.getElementById('cert-progress');

    if (progressNote) {
      progressNote.textContent = done + ' of ' + TOTAL_DAYS + ' days complete';
    }

    if (remaining > 0) {
      if (lockedView) {
        lockedView.style.display = 'block';
        const remText = lockedView.querySelector('#cert-remaining');
        if (remText) {
          remText.textContent = remaining + ' day' + (remaining === 1 ? '' : 's') + ' remaining';
        }
      }
      if (unlockedView) unlockedView.style.display = 'none';
    } else {
      if (lockedView) lockedView.style.display = 'none';
      if (unlockedView) {
        unlockedView.style.display = 'block';
        const nameInput = unlockedView.querySelector('.name-input');
        if (nameInput) {
          nameInput.value = learnerName();
          nameInput.addEventListener('input', () => saveLearnerName(nameInput.value.trim()));
        }
      }
    }
  }

  /* ---- Init ---- */

  document.addEventListener('DOMContentLoaded', () => {
    renderProgressSummary();
    wireMarkComplete();
    wireCertificate();
  });

  // expose a tiny API so the cert generator can read state
  window.AICert = {
    totalDays: TOTAL_DAYS,
    completedCount,
    learnerName,
    isComplete,
  };
})();
