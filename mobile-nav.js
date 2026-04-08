/* ===================================
   Learn Without Walls - Mobile Navigation
   Injects hamburger menu on screens < 768px
   =================================== */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    var header = document.querySelector('header');
    var nav = document.querySelector('header nav');
    if (!header || !nav) return;

    // Create hamburger button
    var btn = document.createElement('button');
    btn.className = 'mobile-nav-toggle';
    btn.setAttribute('aria-label', 'Toggle navigation menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="hamburger-icon"></span>';

    // Insert before nav
    header.insertBefore(btn, nav);

    // Toggle menu
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = nav.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btn.classList.toggle('active', isOpen);
    });

    // Close when clicking a link
    nav.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('active');
      }
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!header.contains(e.target)) {
        nav.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('active');
      }
    });
  });
})();
