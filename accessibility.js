/**
 * Accessibility Toolbar — sdabagh.github.io
 * Dark mode, font size, dyslexia font, reading mode
 * Preferences saved to localStorage
 */
(function () {
  const KEYS = {
    dark: 'a11y-dark',
    fontSize: 'a11y-fontsize',
    dyslexia: 'a11y-dyslexia',
    reading: 'a11y-reading',
    ruler: 'a11y-ruler'
  };

  function get(key) { return localStorage.getItem(key); }
  function set(key, val) { localStorage.setItem(key, val); }

  function applyAll() {
    const b = document.body;
    b.classList.toggle('dark-mode', get(KEYS.dark) === 'true');
    b.classList.remove('font-large', 'font-xl');
    const fs = get(KEYS.fontSize);
    if (fs && fs !== 'normal') b.classList.add('font-' + fs);
    b.classList.toggle('dyslexia-font', get(KEYS.dyslexia) === 'true');
    b.classList.toggle('reading-mode', get(KEYS.reading) === 'true');
    b.classList.toggle('reading-ruler', get(KEYS.ruler) === 'true');
  }

  // "Skip to content" link for keyboard and screen-reader users, plus the reading ruler element.
  function addSkipLinkAndRuler() {
    const main = document.querySelector('main');
    if (main && !document.querySelector('.skip-link')) {
      if (!main.id) main.id = 'main-content';
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#' + main.id;
      skip.textContent = 'Skip to content';
      skip.addEventListener('click', function () { main.setAttribute('tabindex', '-1'); main.focus(); });
      document.body.insertBefore(skip, document.body.firstChild);
    }
    if (!document.getElementById('a11y-ruler')) {
      const ruler = document.createElement('div');
      ruler.id = 'a11y-ruler';
      ruler.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ruler);
      let y = window.innerHeight / 2;
      const place = function () { ruler.style.top = Math.max(0, y - ruler.offsetHeight / 2) + 'px'; };
      document.addEventListener('mousemove', function (e) { if (document.body.classList.contains('reading-ruler')) { y = e.clientY; place(); } });
      document.addEventListener('touchmove', function (e) { if (document.body.classList.contains('reading-ruler') && e.touches[0]) { y = e.touches[0].clientY; place(); } }, { passive: true });
      place();
    }
  }

  function createToolbar() {
    // Trigger button
    const trigger = document.createElement('button');
    trigger.id = 'a11y-trigger';
    trigger.setAttribute('aria-label', 'Accessibility Options');
    trigger.setAttribute('title', 'Accessibility Options');
    trigger.innerHTML = '&#9707;';
    document.body.appendChild(trigger);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Accessibility Options');
    panel.innerHTML = `
      <h3>Accessibility</h3> <div class="a11y-row"> <span> Dark Mode</span> <button class="a11y-toggle ${get(KEYS.dark) === 'true' ? 'on' : ''}"
                id="a11y-dark-btn" aria-pressed="${get(KEYS.dark) === 'true'}"
                aria-label="Toggle dark mode"></button></div> <div class="a11y-row"> <span> Font Size</span> <div class="a11y-btn-group"> <button class="a11y-btn ${!get(KEYS.fontSize) || get(KEYS.fontSize) === 'normal' ? 'active' : ''}"
                  data-font="normal" aria-label="Normal font size">A</button> <button class="a11y-btn ${get(KEYS.fontSize) === 'large' ? 'active' : ''}"
                  data-font="large" aria-label="Large font size">A+</button> <button class="a11y-btn ${get(KEYS.fontSize) === 'xl' ? 'active' : ''}"
                  data-font="xl" aria-label="Extra large font size">A++</button></div></div> <div class="a11y-row"> <span> Dyslexia Font</span> <button class="a11y-toggle ${get(KEYS.dyslexia) === 'true' ? 'on' : ''}"
                id="a11y-dyslexia-btn" aria-pressed="${get(KEYS.dyslexia) === 'true'}"
                aria-label="Toggle dyslexia-friendly font"></button></div> <div class="a11y-row"> <span> Reading Mode</span> <button class="a11y-toggle ${get(KEYS.reading) === 'true' ? 'on' : ''}"
                id="a11y-reading-btn" aria-pressed="${get(KEYS.reading) === 'true'}"
                aria-label="Toggle reading mode"></button></div> <div class="a11y-row"> <span> Reading Ruler</span> <button class="a11y-toggle ${get(KEYS.ruler) === 'true' ? 'on' : ''}"
                id="a11y-ruler-btn" aria-pressed="${get(KEYS.ruler) === 'true'}"
                aria-label="Toggle reading ruler that follows the pointer"></button></div> <div class="a11y-row"> <span> Read Aloud</span> <button class="a11y-btn" id="a11y-speak-btn" type="button"
                aria-label="Read the selected text, or the whole page, aloud">&#9654; Play</button></div> <button class="a11y-reset" id="a11y-reset-btn">Reset to defaults</button> `;
    document.body.appendChild(panel);

    // Toggle panel open/close
    let open = false;
    trigger.addEventListener('click', function () {
      open = !open;
      panel.style.display = open ? 'block' : 'none';
      trigger.innerHTML = open ? '&times;' : '&#9707;';
    });

    // Dark mode toggle
    document.getElementById('a11y-dark-btn').addEventListener('click', function () {
      const val = get(KEYS.dark) !== 'true';
      set(KEYS.dark, val);
      this.classList.toggle('on', val);
      this.setAttribute('aria-pressed', val);
      document.body.classList.toggle('dark-mode', val);
    });

    // Font size buttons
    panel.querySelectorAll('[data-font]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const size = this.dataset.font;
        set(KEYS.fontSize, size);
        document.body.classList.remove('font-large', 'font-xl');
        if (size !== 'normal') document.body.classList.add('font-' + size);
        panel.querySelectorAll('[data-font]').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // Dyslexia font toggle
    document.getElementById('a11y-dyslexia-btn').addEventListener('click', function () {
      const val = get(KEYS.dyslexia) !== 'true';
      set(KEYS.dyslexia, val);
      this.classList.toggle('on', val);
      this.setAttribute('aria-pressed', val);
      document.body.classList.toggle('dyslexia-font', val);
    });

    // Reading mode toggle
    document.getElementById('a11y-reading-btn').addEventListener('click', function () {
      const val = get(KEYS.reading) !== 'true';
      set(KEYS.reading, val);
      this.classList.toggle('on', val);
      this.setAttribute('aria-pressed', val);
      document.body.classList.toggle('reading-mode', val);
    });

    // Reading ruler
    document.getElementById('a11y-ruler-btn').addEventListener('click', function () {
      const val = get(KEYS.ruler) !== 'true';
      set(KEYS.ruler, val);
      this.classList.toggle('on', val);
      this.setAttribute('aria-pressed', val);
      document.body.classList.toggle('reading-ruler', val);
    });

    // Read aloud (browser speech synthesis): reads the selection if there is one, otherwise the main content.
    const speakBtn = document.getElementById('a11y-speak-btn');
    if (!('speechSynthesis' in window)) {
      speakBtn.disabled = true; speakBtn.textContent = 'Not supported';
    } else {
      speakBtn.addEventListener('click', function () {
        const synth = window.speechSynthesis;
        if (synth.speaking) { synth.cancel(); speakBtn.innerHTML = '&#9654; Play'; return; }
        const sel = String(window.getSelection && window.getSelection()).trim();
        const main = document.querySelector('main') || document.body;
        const text = sel || main.innerText;
        if (!text) return;
        const u = new SpeechSynthesisUtterance(text.slice(0, 20000));
        u.lang = document.documentElement.lang || 'en';
        u.rate = 0.95;
        u.onend = u.onerror = function () { speakBtn.innerHTML = '&#9654; Play'; };
        speakBtn.innerHTML = '&#9632; Stop';
        synth.speak(u);
      });
      window.addEventListener('pagehide', function () { window.speechSynthesis.cancel(); });
    }

    // Reset
    document.getElementById('a11y-reset-btn').addEventListener('click', function () {
      Object.values(KEYS).forEach(function (k) { localStorage.removeItem(k); });
      document.body.classList.remove('dark-mode', 'font-large', 'font-xl', 'dyslexia-font', 'reading-mode', 'reading-ruler');
      panel.querySelectorAll('.a11y-toggle').forEach(function (t) {
        t.classList.remove('on');
        t.setAttribute('aria-pressed', 'false');
      });
      panel.querySelectorAll('[data-font]').forEach(function (b) { b.classList.remove('active'); });
      panel.querySelector('[data-font="normal"]').classList.add('active');
    });
  }

  // Apply preferences immediately (before DOM ready) to prevent flash
  if (get(KEYS.dark) === 'true') {
    document.documentElement.style.background = '#1a1a2e';
    document.documentElement.style.color = '#e8e8e8';
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyAll();
    addSkipLinkAndRuler();
    createToolbar();
  });
})();
