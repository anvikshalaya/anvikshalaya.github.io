// Anvikshalaya: living station layer (v3). Progressive enhancement: the page works without it.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FLAPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // Live IST clock
  var ist = document.querySelector('.clock .ist');
  function tick() {
    if (!ist) return;
    var t = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).split(':');
    ist.querySelector('.hh').textContent = t[0];
    ist.querySelector('.mm').textContent = t[1];
  }
  tick(); setInterval(tick, 15000);

  // Split-flap departure board
  function flap(el, tiles, delay) {
    var text = el.textContent;
    el.setAttribute('aria-label', text.trim());
    el.textContent = '';
    var cells = [];
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = tiles ? 'flap' : 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = text[i];
      el.appendChild(s);
      cells.push({ el: s, ch: text[i] });
    }
    if (reduce) return;
    cells.forEach(function (c, i) {
      if (c.ch === ' ') return;
      var spins = 6 + i * 2, n = 0;
      c.el.classList.add('spin');
      setTimeout(function step() {
        if (n++ < spins) {
          c.el.textContent = FLAPS[Math.floor(Math.random() * FLAPS.length)];
          setTimeout(step, 55);
        } else { c.el.textContent = c.ch; c.el.classList.remove('spin'); }
      }, delay);
    });
  }
  var board = document.querySelector('.board');
  function runBoard() {
    document.querySelectorAll('.departure strong').forEach(function (el, i) { flap(el, true, 250 + i * 450); });
    document.querySelectorAll('.departure .status').forEach(function (el, i) { el.classList.add('flip-text'); flap(el, false, 900 + i * 450); });
  }
  if (board && 'IntersectionObserver' in window) {
    var bo = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { bo.disconnect(); runBoard(); } }, { threshold: .35 });
    bo.observe(board);
  } else { runBoard(); }

  // Living lantern: embers + tap to dim and relight
  var hero = document.querySelector('.hero');
  var btn = document.querySelector('.lantern-btn');
  var embers = document.querySelector('.embers');
  if (embers && !reduce) {
    for (var e = 0; e < 9; e++) {
      var i = document.createElement('i');
      i.style.left = (40 + Math.random() * 20) + '%';
      i.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
      i.style.animationDelay = (Math.random() * 6) + 's';
      i.style.animationDuration = (5 + Math.random() * 3) + 's';
      embers.appendChild(i);
    }
  }
  var hint = document.querySelector('.lamp-hint');
  if (btn && hero) {
    btn.addEventListener('click', function () {
      var dark = hero.classList.toggle('dark-lamp');
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Light the lantern' : 'Dim the lantern');
      if (hint) hint.textContent = dark ? 'TAP TO LIGHT IT AGAIN' : 'TAP THE LANTERN';
    });
  }

  // Train along the platform line
  var line = document.querySelector('.platform-line');
  var train = document.querySelector('.train');
  if (line && train && !reduce && 'IntersectionObserver' in window) {
    var running = false;
    function run() {
      if (running) return; running = true;
      train.style.setProperty('--track', line.getBoundingClientRect().width + 'px');
      train.classList.remove('run'); void train.offsetWidth; train.classList.add('run');
      setTimeout(function () { running = false; }, 12000);
    }
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) setTimeout(run, 600); }, { threshold: 1 }).observe(line);
  }

  // Origin sky
  var sky = document.querySelector('.sky');
  if (sky) {
    for (var s = 0; s < 46; s++) {
      var st = document.createElement('i');
      st.style.left = Math.random() * 100 + '%';
      st.style.top = Math.random() * 100 + '%';
      st.style.animationDelay = (Math.random() * 5) + 's';
      if (Math.random() < .15) { st.style.width = st.style.height = '3px'; }
      sky.appendChild(st);
    }
  }

  // Scroll reveal
  if (!reduce && 'IntersectionObserver' in window) {
    var els = document.querySelectorAll('.journeyhead, .journey, .quiet-promise, .origin-mark, .origin .eyebrow, .origin blockquote, .origin p, .origin small, .studio-note > *');
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave visible
      el.classList.add('reveal');
      el.style.transitionDelay = (el.classList.contains('night') ? .15 : 0) + 's';
      ro.observe(el);
    });
  }
})();

// Station notices from notices.json (edit that file to change the ticker).
// Each line is plain text; wrap words in **double stars** to make them bright.
// If the file is missing or broken, the notices already in index.html stay.
(function () {
  var track = document.querySelector('.notices-track');
  if (!track || !window.fetch) return;
  function esc(t) { return t.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  fetch('notices.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (list) {
      if (!Array.isArray(list)) return;
      list = list.filter(function (x) { return typeof x === 'string' && x.trim(); }).slice(0, 12);
      if (!list.length) return;
      var html = list.map(function (t) { return '<span>' + fmt(t) + '</span>'; }).join('');
      var copy = list.map(function (t) { return '<span aria-hidden="true">' + fmt(t) + '</span>'; }).join('');
      track.innerHTML = html + copy;
      track.style.animationDuration = Math.max(24, list.length * 9.5) + 's';
    })
    .catch(function () {});
})();
