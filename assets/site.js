(function () {
  'use strict';

  /* ---- THEME TOGGLE ---- */
  function initTheme() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---- PAGE TRANSITION (fade to black + loading bar) ---- */
  var PAGE_TITLES = {
    'index.html':              'Coming back home...',
    'finance.html':             'Entering the trading floor...',
    'tech.html':                'Booting up the stack...',
    'hackathon-projects.html':  'Rewinding the hackathon clock...',
    'loop.html':                'Want some nice music ?',
    'bs-pricing.html':          'Solving the PDE...',
    'delta-hedging.html':       'Rebalancing the delta...',
    'sofr-cap.html':            'Bootstrapping the curve...',
    'worst-of-basket.html':     'Adding non-correlated stocks...',
    'image-processing.html':    'Reading pixel by pixel...',
    'market-data-fetcher.html': 'Getting the tickers...',
    'tipe.html':                'Counting the sequences...'
  };

  function initTransitions() {
    var overlay = document.getElementById('page-transition');
    if (!overlay) return;

    if (!document.getElementById('pt-label')) {
      overlay.innerHTML = '<div id="pt-label"></div><div id="pt-bar"><div id="pt-bar-fill"></div></div>';
    }
    var label = document.getElementById('pt-label');

    function reveal() {
      overlay.classList.remove('active');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          overlay.classList.add('hidden');
        });
      });
    }
    reveal();

    // Back/forward restores the page from bfcache without re-running this
    // script's initial load path — without this the overlay (and its
    // mid-transition state) can stay stuck on screen.
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) reveal();
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (a.target && a.target !== '' && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      var url;
      try { url = new URL(href, window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.href === window.location.href) return;

      e.preventDefault();
      var file = url.pathname.split('/').pop() || 'index.html';
      label.textContent = PAGE_TITLES[file] || ('Heading to ' + file.replace('.html', '').replace(/-/g, ' '));
      overlay.classList.remove('hidden');
      overlay.classList.add('active');
      setTimeout(function () {
        window.location.href = url.href;
      }, 920);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initTransitions();
  });
})();
