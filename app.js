/* Amparo prototype. All content is SAMPLE.
   No backend, no cookies, no analytics, no third-party requests.
   Only thing ever stored: one yes/no "tour seen" value on this device (Quick Exit deletes it). */
(function () {
  'use strict';

  /* ---------- Settings you may want to change ---------- */
  var QUICK_EXIT_URL = 'https://www.google.com'; // where Quick Exit sends the person
  var TOUR_KEY = 'k';                             // neutral name for the "tour seen" value

  /* The logo file. The logo is icons/abp-logo.png (a better SVG from TABP can replace it: change this line). If it is missing,
     the name "The Angel Band Project" shows as text instead. */
  var LOGO_SRC = 'icons/abp-logo.png';
  var LOGO_ALT = 'The Angel Band Project';

  var THEMES = [
    { id: 'angel', name: 'The Angel Band Project', desc: 'Slate blue and gold, from the TABP website.', meta: '#FFFFFF' },
    { id: 'calming', name: 'Calming', desc: 'Cool, quiet blues.', meta: '#F1F5F8' },
    { id: 'relaxing', name: 'Relaxing', desc: 'Soft lavender and warm grey.', meta: '#F5F2F8' },
    { id: 'upbeat', name: 'Upbeat', desc: 'Warm and a little brighter.', meta: '#FFF6E8' }
  ];

  var SAMPLE = "Sample. Real audio comes from TABP's music therapists.";

  var main = document.getElementById('main');
  var soundBtn = document.getElementById('sound');
  var footCrisis = document.getElementById('foot-crisis');
  var $ = function (s) { return main.querySelector(s); };

  /* ---------- The one stored value ---------- */
  var tour = {
    seen: function () { try { return localStorage.getItem(TOUR_KEY) === '1'; } catch (e) { return false; } },
    set: function () { try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {} },
    clear: function () { try { localStorage.removeItem(TOUR_KEY); } catch (e) {} }
  };

  /* ---------- State (memory only) ---------- */
  var state = { theme: 'angel', prev: 'need', screen: 'landing', need: null, chip: null, sound: false, tourStep: 0, item: null, card: 0, rated: null };
  var timers = { card: null };

  /* ---------- Content ---------- */
  var SHELVES = {
    calm: { name: 'Feel calmer', ids: ['breathing', 'grounding', 'slow'] },
    release: { name: 'Release some energy', ids: ['drum', 'tap', 'hum'] },
    express: { name: 'Express something', ids: ['reflect', 'sound'] },
    listen: { name: 'Just listen', ids: ['listen'] }
  };
  var ITEMS = {
    breathing: { title: 'Rhythmic breathing', len: '2 min', tier: 1, tag: 'Gentle', kind: 'breathing', desc: 'Follow a circle that grows and shrinks at a steady pace.' },
    grounding: { title: 'Grounding: five things you can hear', len: '3 min', tier: 1, tag: 'Gentle', kind: 'activity', desc: 'Notice five things you can hear around you. Take your time. There is nothing to get right.' },
    slow: { title: 'Slow release for shoulders and jaw, with soft music', len: '4 min', tier: 2, tag: 'Gentle', kind: 'activity', desc: 'Soft music while you let your shoulders and jaw loosen, if that feels okay.' },
    drum: { title: 'Steady drum-along', len: '3 min', tier: 2, tag: 'Rhythmic', kind: 'activity', desc: 'A steady pulse to drum along with, as softly or as firmly as you like.' },
    tap: { title: 'Tap along to a beat', len: '2 min', tier: 2, tag: 'Rhythmic', kind: 'activity', desc: 'Tap along to a simple beat with your fingers, on a table or your lap.' },
    hum: { title: 'Gentle humming warm-up', len: '2 min', tier: 2, tag: 'Gentle', kind: 'activity', desc: 'A soft hum on one easy note, as quietly as you like.' },
    reflect: { title: 'Reflection cards', len: '1 min', tier: 2, tag: 'May stir feelings', kind: 'reflect', desc: 'Three short cards you answer with a tap. Nothing is typed or saved.' },
    sound: { title: 'Pick a sound that fits right now', len: '2 min', tier: 2, tag: 'May stir feelings', kind: 'activity', desc: 'Listen to a few short sounds and notice which one fits right now.' },
    listen: { title: 'Calm listening', len: '5 min', tier: 1, tag: 'Gentle', kind: 'activity', options: true, desc: 'Choose a sound and a pace, then just listen.' }
  };

  var TOUR = [
    { t: 'Pick what you need today.', svg: '<rect x="14" y="14" width="40" height="40" rx="9"/><rect x="66" y="14" width="40" height="40" rx="9"/><rect x="14" y="66" width="40" height="40" rx="9"/><rect x="66" y="66" width="40" height="40" rx="9"/>' },
    { t: 'Nothing is saved. Not your choices, not your name.', svg: '<rect x="26" y="12" width="68" height="96" rx="8" stroke-dasharray="7 6"/>' },
    { t: 'Leave any time. Quick Exit is always in the same place.', svg: '<rect x="12" y="20" width="96" height="80" rx="8"/><rect x="74" y="28" width="26" height="22" rx="5"/><path d="M82 34l10 10M92 34l-10 10"/>' }
  ];

  var CARDS = [
    { q: 'Pick a word for how it felt', choices: ['Calmer', 'About the same', 'A bit restless', 'Tired', 'Not sure'] },
    { q: 'Pick a colour that fits right now', swatches: [['Deep teal', 'sw-1'], ['Soft teal', 'sw-2'], ['Sand', 'sw-3'], ['Lavender', 'sw-4'], ['Sage', 'sw-5'], ['Rose', 'sw-6']] },
    { q: 'What might help next?', choices: ['More of the same', 'Something gentler', 'Something with more energy', 'A quiet moment', 'Information about talking to someone'] }
  ];

  var TIER3 = ['trauma', 'memory', 'memories', 'remember', 'flashback', 'write a song', 'songwriting', 'record', 'what happened'];
  var DANGER = ['hurt myself', 'hurting myself', 'suicide', 'suicidal', 'kill myself', 'in danger', 'end my life', 'want to die', 'self-harm', 'self harm'];

  /* ---------- Quick Exit ---------- */
  function quickExit() {
    tour.clear();
    try { sessionStorage.clear(); } catch (e) {}
    document.documentElement.style.display = 'none'; // hide everything right away
    location.replace(QUICK_EXIT_URL);                // replaces this page, so Back does not return here
  }
  var escTimes = [];
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.repeat) return;
    var now = Date.now();
    escTimes = escTimes.filter(function (t) { return now - t < 2000; });
    escTimes.push(now);
    if (escTimes.length >= 3) quickExit();
  });

  /* ---------- Sound (off until someone turns it on) ---------- */
  var ctx = null;
  function audio() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, vol, type) {
    var c = audio(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + start;
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.4, dur / 3));
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function playSample(opts) {
    if (!state.sound) return false;
    opts = opts || {};
    var gap = { Gentle: 0.9, Medium: 0.6, Lively: 0.42 }[opts.intensity || 'Gentle'];
    gap *= { Slower: 1.3, Steady: 1, Quicker: 0.75 }[opts.tempo || 'Steady'];
    var wave = { Piano: 'triangle', Strings: 'sine', 'Acoustic guitar': 'triangle' }[opts.genre || 'Piano'] || 'sine';
    var notes = [261.63, 329.63, 392, 440, 392, 329.63];
    notes.forEach(function (f, i) { tone(f, i * gap, gap * 1.6, 0.05, wave); });
    return true;
  }
  function setSound(on) {
    state.sound = on;
    soundBtn.textContent = on ? 'Sound on' : 'Sound off';
    if (on) audio(); else if (ctx) ctx.suspend();
  }

  /* ---------- Small helpers ---------- */
  function radios(name, opts, def) {
    return opts.map(function (o) {
      return '<label class="chip"><input type="radio" name="' + name + '" value="' + o + '"' + (o === def ? ' checked' : '') + '><span>' + o + '</span></label>';
    }).join('');
  }
  function checked(name) {
    var el = main.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : undefined;
  }
  var isPhone = function () { return window.matchMedia && window.matchMedia('(pointer: coarse)').matches; };
  function tel(num, shown) {
    return isPhone() ? '<a class="btn small" href="tel:' + num + '">' + shown + '</a>' : '<span class="num">' + shown + '</span>';
  }
  function sms(short, body, shown) {
    var href = 'sms:' + short + (body ? '?&body=' + encodeURIComponent(body) : '');
    return isPhone() ? '<a class="btn small" href="' + href + '">' + shown + '</a>' : '<span class="num">' + shown + '</span>';
  }
  function ext(url, label) {
    return '<a class="btn small" href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '<span class="sr"> (opens in a new tab)</span></a>';
  }
  function crisisList(tag) {
    tag = tag || 'h2';
    function head(t) { return '<' + tag + ' class="rname">' + t + '</' + tag + '>'; }
    return '<ul class="crisis-list">' +
      '<li>' + head('Emergency, 911') + '<div class="row">' + tel('911', 'Call 911') + '</div></li>' +
      '<li>' + head('988 Suicide &amp; Crisis Lifeline') + '<div class="row">' + tel('988', 'Call 988') + sms('988', '', 'Text 988') + ext('https://988lifeline.org', 'Chat at 988lifeline.org') + '</div></li>' +
      '<li>' + head('National Sexual Assault Hotline (RAINN)') + '<div class="row">' + tel('+18006564673', 'Call 800.656.HOPE (4673)') + sms('64673', 'HOPE', 'Text HOPE to 64673') + ext('https://hotline.rainn.org', 'Chat at hotline.rainn.org') + '</div></li>' +
      '<li>' + head('National Domestic Violence Hotline') + '<div class="row">' + tel('+18007997233', 'Call 800.799.SAFE (7233)') + sms('88788', 'START', 'Text START to 88788') + ext('https://www.thehotline.org', 'Live chat at thehotline.org') + '</div></li>' +
      '<li>' + head('Crisis Text Line') + '<div class="row">' + sms('741741', 'HELLO', 'Text HELLO to 741741') + '</div></li>' + /* confirm before launch */
      '<li>' + head('TABP programs and providers') + '<div class="row"><button class="btn small" type="button" data-go="providers">See TABP programs and providers</button></div></li>' +
      '</ul>';
  }

  /* ---------- Themes (memory only: never stored, resets each visit) ---------- */
  function applyTheme(id) {
    var th = THEMES.filter(function (t) { return t.id === id; })[0] || THEMES[0];
    state.theme = th.id;
    document.documentElement.setAttribute('data-theme', th.id);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', th.meta);
  }
  function partner(label) {
    return '<p class="partner"><span>' + label + '</span><img class="logo" src="' + LOGO_SRC + '" alt="' + LOGO_ALT + '"></p>';
  }
  // If the logo file is missing, show the name as text instead of a broken image.
  main.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'IMG' && el.classList.contains('logo')) {
      var sp = document.createElement('span');
      sp.className = 'logo-fallback'; sp.textContent = LOGO_ALT;
      el.replaceWith(sp);
    }
  }, true);

  /* ---------- Navigation: in-page state only, history.replaceState only ---------- */
  function go(name) {
    stopBreathing();
    if (timers.card) { clearTimeout(timers.card); timers.card = null; }
    if (name === 'theme' && state.screen !== 'theme') state.prev = state.screen;
    if (name === 'tour') state.tourStep = 0;
    if (name === 'between') state.card = 0;
    if (name === 'after') state.rated = null;
    state.screen = name;
    render();
  }

  function render() {
    var s = SCREENS[state.screen]();
    main.innerHTML = s.html;
    document.title = 'Amparo';
    footCrisis.hidden = state.screen === 'crisis';
    main.classList.remove('fade'); void main.offsetWidth; main.classList.add('fade');
    window.scrollTo(0, 0);
    var f = main.querySelector('[data-focus]') || main.querySelector('h1');
    if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (s.after) s.after();
  }

  /* ---------- Screens ---------- */
  var SCREENS = {};

  SCREENS.landing = function () {
    var tourBtn = tour.seen()
      ? '<button class="linkbtn" type="button" data-go="tour">Quick tour</button>'
      : '<button class="btn" type="button" data-go="tour">Take a 30-second tour</button>';
    return { html:
      '<h1>A quiet place to steady yourself with music.</h1>' +
      '<p class="lead">Nothing here is saved. Take what helps and leave whenever you like.</p>' +
      '<div class="stack"><button class="btn primary" type="button" data-go="need">Continue</button>' + tourBtn + '</div>' +
      '<p class="small">A self-care tool informed by music therapy, not a replacement for therapy. <button class="linkbtn" type="button" data-go="learn">Learn more</button></p>' +
      '<p>Need urgent help? <button class="linkbtn" type="button" data-go="crisis">Crisis resources</button></p>' +
      partner('Built with') +
      '<p class="small">Prototype. All content is sample.</p>' };
  };

  SCREENS.tour = function () {
    var i = state.tourStep, p = TOUR[i], last = i === TOUR.length - 1;
    return { html:
      '<h1>Quick tour</h1>' +
      '<p class="small">' + (i + 1) + ' of ' + TOUR.length + '</p>' +
      '<div class="panel"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true" focusable="false">' + p.svg + '</svg>' +
      '<p class="panel-text" data-focus>' + p.t + '</p></div>' +
      '<div class="row"><button class="btn primary" type="button" data-act="tour-next">' + (last ? 'Done' : 'Next') + '</button>' +
      '<button class="btn" type="button" data-act="tour-skip">Skip</button></div>' };
  };

  SCREENS.need = function () {
    return { html:
      '<h1>What do you need today?</h1>' +
      '<p class="lead">Choose what feels right. You can change your mind at any time.</p>' +
      '<div class="tiles">' +
      '<button class="tile tile-calm" type="button" data-act="pick" data-need="calm">I want to feel calmer</button>' +
      '<button class="tile tile-release" type="button" data-act="pick" data-need="release">I want to release some energy</button>' +
      '<button class="tile tile-express" type="button" data-act="pick" data-need="express">I want to express something</button>' +
      '<button class="tile tile-listen" type="button" data-act="pick" data-need="listen">I just want to listen</button>' +
      '</div>' +
      '<fieldset><legend>Where are you right now? (optional)</legend><div class="chips">' +
      chip('starting', 'Just starting out') + chip('waiting', 'Waiting for support') + chip('sessions', 'In sessions') +
      '<button class="chipbtn" type="button" data-act="chip" data-chip="skip">Skip</button></div></fieldset>' +
      '<p><button class="linkbtn" type="button" data-go="tour">Quick tour</button></p>' };
    function chip(k, label) {
      return '<button class="chipbtn" type="button" data-act="chip" data-chip="' + k + '" aria-pressed="' + (state.chip === k) + '">' + label + '</button>';
    }
  };

  function shelfOrder() {
    var base = ['calm', 'release', 'express', 'listen'];
    var pref = state.chip === 'starting' ? ['calm', 'listen'] : state.chip === 'waiting' ? ['calm'] : [];
    var order = [];
    [state.need].concat(pref, base).forEach(function (k) { if (k && order.indexOf(k) < 0) order.push(k); });
    return order;
  }

  function itemCard(id) {
    var it = ITEMS[id];
    return '<article class="card" aria-labelledby="t-' + id + '">' +
      '<h3 id="t-' + id + '">' + it.title + '</h3>' +
      '<p class="meta"><span>' + it.len + '</span><span class="tag">' + it.tag + '</span></p>' +
      '<p class="sample">' + SAMPLE + '</p>' +
      '<div class="row"><button class="btn small" type="button" data-act="preview" data-id="' + id + '" aria-expanded="false" aria-controls="pv-' + id + '">Preview</button></div>' +
      '<div class="preview" id="pv-' + id + '" hidden><p>' + it.desc + '</p><p class="hint"></p></div>' +
      '<fieldset><legend>Intensity</legend><div class="chips">' + radios('int-' + id, ['Gentle', 'Medium', 'Lively'], 'Gentle') + '</div></fieldset>' +
      '<button class="btn primary" type="button" data-act="start" data-id="' + id + '">Start</button>' +
      '</article>';
  }

  SCREENS.shelves = function () {
    var html = '<h1>A few things you might try</h1><p class="lead">Take your time. Everything here can be skipped.</p>';
    if (state.chip === 'sessions') {
      html += '<article class="card"><h2>For between sessions</h2><p>Short prompts you answer with a tap.</p><button class="btn primary" type="button" data-go="between">Open</button></article>';
    }
    if (state.chip === 'waiting') {
      html += '<article class="card"><h2>TABP programs and providers</h2><p>Support from people, not an app.</p><button class="btn primary" type="button" data-go="providers">Find TABP programs and providers</button></article>';
    }
    html += '<div class="searchbox"><label for="search">Looking for something specific?</label>' +
      '<input id="search" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"><div id="search-out" aria-live="polite"></div></div>';
    shelfOrder().forEach(function (k) {
      html += '<section class="shelf" aria-labelledby="sh-' + k + '"><h2 id="sh-' + k + '">' + SHELVES[k].name + '</h2>' +
        SHELVES[k].ids.map(itemCard).join('') + '</section>';
    });
    return { html: html, after: bindSearch };
  };

  /* Tier 3 redirect demo: text is watched locally and never sent or stored */
  function redirectBlock() {
    return '<blockquote class="redirect"><p>That sounds important, and it deserves more support than an app can give. Amparo is for steadying and calming. A music therapist or counsellor can help with this, and we can show you where to find one.</p></blockquote>' +
      '<div class="row"><button class="btn primary" type="button" data-go="providers">Find TABP programs and providers</button>' +
      '<button class="btn" type="button" data-act="try-calm">Try something calming instead</button></div>';
  }
  function bindSearch() {
    var input = $('#search'), out = $('#search-out');
    input.addEventListener('input', function () {
      var v = input.value.toLowerCase();
      var danger = DANGER.some(function (w) { return v.indexOf(w) > -1; });
      var t3 = TIER3.some(function (w) { return v.indexOf(w) > -1; });
      if (danger) out.innerHTML = '<p class="lead"><strong>If you would like to talk to someone right now:</strong></p>' + crisisList('p') + redirectBlock();
      else if (t3) out.innerHTML = redirectBlock();
      else out.innerHTML = v.trim() ? '<p class="hint">This is a sample search. Try one of the cards below.</p>' : '';
    });
  }

  SCREENS.notice = function () {
    return { html:
      '<h1>Before you start</h1>' +
      '<p class="lead">This one can bring up feelings. You can pause or leave at any time.</p>' +
      '<div class="row"><button class="btn primary" type="button" data-act="notice-continue">Continue</button>' +
      '<button class="btn" type="button" data-go="shelves">Choose something else</button></div>' };
  };

  SCREENS.activity = function () {
    var it = ITEMS[state.item];
    var opts = it.options
      ? '<fieldset><legend>Sound</legend><div class="chips">' + radios('genre', ['Piano', 'Strings', 'Acoustic guitar'], 'Piano') + '</div></fieldset>' +
        '<fieldset><legend>Pace</legend><div class="chips">' + radios('pace', ['Slower', 'Steady', 'Quicker'], 'Steady') + '</div></fieldset>'
      : '';
    return { html:
      '<h1>' + it.title + '</h1>' +
      '<p class="sample">' + SAMPLE + '</p>' +
      '<p class="lead">' + it.desc + '</p>' + opts +
      '<div class="row"><button class="btn" type="button" data-act="play">Play a short sample</button></div>' +
      '<p class="hint" id="ahint" aria-live="polite"></p>' +
      '<div class="row"><button class="btn primary" type="button" data-go="after">Finish</button>' +
      '<button class="btn" type="button" data-go="shelves">Choose something else</button></div>' };
  };

  /* ---------- Rhythmic breathing ---------- */
  // Placeholder timing, to be set by TABP's MT-BC: Steady 4 s, Slower 5 s, Quicker 3 s.
  var br = null;
  var TEMPOS = { Slower: 5, Steady: 4, Quicker: 3 };
  function fmt(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2) + ' left'; }

  SCREENS.breathing = function () {
    var canVibrate = typeof navigator.vibrate === 'function';
    var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return { html:
      '<h1>Rhythmic breathing</h1>' +
      '<p class="lead">2 minutes. Gentle. Follow the circle at your own pace.</p>' +
      '<div class="pacer"><div class="ring"><div class="circle in' + (rm ? ' reduce' : '') + '" id="circle" aria-hidden="true"></div></div>' +
      '<p class="phase" id="phase" aria-live="polite">Breathe in</p><p class="time" id="time">2:00 left</p></div>' +
      '<fieldset><legend>Tempo</legend><div class="chips">' +
      ['Slower', 'Steady', 'Quicker'].map(function (t) {
        return '<button class="chipbtn" type="button" data-act="tempo" data-tempo="' + t + '" aria-pressed="' + (t === 'Steady') + '">' + t + '</button>';
      }).join('') + '</div></fieldset>' +
      '<div class="row"><button class="btn" type="button" id="pause" data-act="pause">Pause</button>' +
      '<button class="btn primary" type="button" data-act="finish">Finish</button></div>' +
      (canVibrate ? '<label class="check"><input type="checkbox" id="vib" checked> Vibration</label>' : '') +
      '<label class="check"><input type="checkbox" id="rm"' + (rm ? ' checked' : '') + '> Reduce motion</label>' +
      '<p class="hint">Sound is off unless you turn it on at the top.</p>',
      after: startBreathing };
  };

  function startBreathing() {
    var circle = $('#circle'), phaseEl = $('#phase'), timeEl = $('#time'), vib = $('#vib'), rmBox = $('#rm');
    br = { tempo: 4, left: 120, phaseMs: 0, phase: 0, paused: false, last: Date.now(), timer: null, circle: circle };
    circle.style.setProperty('--cycle', (br.tempo * 2) + 's');

    function apply(signal) {
      var inhale = br.phase === 0;
      phaseEl.textContent = inhale ? 'Breathe in' : 'Breathe out';
      circle.classList.toggle('in', inhale); circle.classList.toggle('out', !inhale);
      if (signal) {
        if (state.sound) tone(inhale ? 261.63 : 196, 0, 1.2, 0.05, 'sine');
        if (vib && vib.checked && navigator.vibrate) navigator.vibrate(40);
      }
    }
    function restartAnim() {
      circle.style.animation = 'none'; void circle.offsetWidth; circle.style.animation = '';
    }
    br.setTempo = function (t) {
      br.tempo = TEMPOS[t]; br.phaseMs = 0; br.phase = 0;
      circle.style.setProperty('--cycle', (br.tempo * 2) + 's');
      restartAnim(); apply(false);
    };
    br.togglePause = function (btn) {
      br.paused = !br.paused; br.last = Date.now();
      circle.classList.toggle('paused', br.paused);
      btn.textContent = br.paused ? 'Resume' : 'Pause';
    };
    rmBox.addEventListener('change', function () {
      circle.classList.toggle('reduce', rmBox.checked);
      if (!rmBox.checked) restartAnim();
      br.phaseMs = 0; br.phase = 0; apply(false);
    });
    br.timer = setInterval(function () {
      var now = Date.now(), dt = Math.min(now - br.last, 500); br.last = now;
      if (br.paused) return;
      br.left -= dt / 1000; br.phaseMs += dt;
      var p = Math.floor(br.phaseMs / (br.tempo * 1000)) % 2;
      if (p !== br.phase) { br.phase = p; apply(true); }
      timeEl.textContent = fmt(br.left);
      if (br.left <= 0) go('after');
    }, 100);
  }
  function stopBreathing() { if (br && br.timer) clearInterval(br.timer); br = null; }

  /* ---------- After the activity ---------- */
  SCREENS.after = function () {
    var r = state.rated;
    function rb(k, label) { return '<button class="chipbtn" type="button" data-act="rate" data-rate="' + k + '" aria-pressed="' + (r === k) + '">' + label + '</button>'; }
    return { html:
      '<h1>Thank you for taking that time.</h1>' +
      '<p class="lead">Did that help? One tap is enough. This is optional and anonymous.</p>' +
      '<div class="chips">' + rb('yes', 'Yes') + rb('little', 'A little') + rb('not', 'Not really') + '</div>' +
      '<p class="rated small" id="rated" aria-live="polite">' + (r ? 'Thank you.' : '') + '</p>' +
      '<div class="stack">' +
      '<button class="btn primary" type="button" data-act="another">Another gentle option</button>' +
      '<button class="btn" type="button" data-go="need">Back to "What do you need today?"</button>' +
      '<button class="btn" type="button" data-go="providers">Find TABP programs and providers</button></div>' +
      '<p><button class="linkbtn" type="button" data-go="crisis">Crisis resources</button> &nbsp; <button class="linkbtn" type="button" data-go="done">I\'m done for now</button></p>' };
  };

  /* ---------- For between sessions ---------- */
  SCREENS.between = function () {
    var i = state.card;
    var head = '<h1>For between sessions</h1><p class="lead">Short prompts you can answer with a tap. Nothing is typed or saved.</p>';
    if (i >= CARDS.length) {
      return { html: head + '<section class="card"><h2 data-focus>That\'s all for now.</h2><p>Nothing from these cards was saved.</p>' +
        '<div class="stack"><button class="btn primary" type="button" data-go="need">Back to "What do you need today?"</button>' +
        '<button class="btn" type="button" data-go="providers">Find TABP programs and providers</button>' +
        '<button class="btn" type="button" data-go="done">I\'m done for now</button></div></section>' };
    }
    var c = CARDS[i], choices;
    if (c.swatches) {
      choices = c.swatches.map(function (s) { return '<button class="chipbtn" type="button" data-act="choose" aria-pressed="false"><span class="sw ' + s[1] + '" aria-hidden="true"></span>' + s[0] + '</button>'; }).join('');
    } else {
      choices = c.choices.map(function (s) { return '<button class="chipbtn" type="button" data-act="choose" aria-pressed="false">' + s + '</button>'; }).join('');
    }
    return { html: head + '<section class="card" aria-labelledby="q"><h2 id="q"' + (i > 0 ? ' data-focus' : '') + '>' + c.q + '</h2>' +
      '<div class="choices">' + choices + '</div>' +
      '<button class="btn" type="button" data-act="skip-card">Skip</button>' +
      '<p class="small note">These aren\'t saved. They\'re only for you, right now.</p></section>' };
  };
  function nextCard() { timers.card = null; if (state.screen !== 'between') return; state.card++; render(); }

  /* ---------- Crisis, providers, learn more, done ---------- */
  SCREENS.crisis = function () {
    return { html:
      '<h1>If you\'d like to talk to someone.</h1>' +
      '<p class="lead">Amparo isn\'t monitored. No one here sees that you opened this page, and no one will contact you. If you are in danger right now, call 911. These services are separate from Amparo and have their own privacy practices.</p>' +
      '<p>If you think someone may be watching this device, calling from a different phone is the safest way to reach a hotline.</p>' +
      crisisList('h2') +
      '<p class="small">Phone and text options show as buttons on a phone and as numbers on a laptop.</p>' };
  };

  SCREENS.providers = function () {
    return { html:
      '<h1>TABP programs and providers</h1>' + partner('Programs from') +
      '<p class="lead">The Angel Band Project offers free, trauma-informed music therapy for survivors, in small groups at partner agencies.</p>' +
      '<p class="small">Sample list. TABP will supply the final contacts and links.</p>' +
      '<ul class="crisis-list">' +
      '<li><span class="rname">The Angel Band Project (TABP)</span><div class="row">' + ext('https://angelbandproject.org', 'Visit TABP (placeholder link)') + '</div></li>' +
      '<li><span class="rname">RAINN</span><div class="row">' + ext('https://rainn.org', 'Visit rainn.org') + '</div></li>' +
      '<li><span class="rname">National Domestic Violence Hotline</span><div class="row">' + ext('https://www.thehotline.org', 'Visit thehotline.org') + '</div></li>' +
      '</ul>' +
      '<p>Need to talk to someone now? <button class="linkbtn" type="button" data-go="crisis">Crisis resources</button></p>' };
  };

  SCREENS.learn = function () {
    return { html:
      '<h1>About Amparo</h1>' + partner('Built with') +
      '<p class="small">Draft; TABP to review. This is a prototype and all content is sample.</p>' +
      '<h2>What Amparo is</h2>' +
      '<p>Amparo is a self-care tool informed by music therapy. It is not therapy. It is not monitored, and nothing you do here is saved.</p>' +
      '<h2>How Quick Exit works</h2>' +
      '<p>Quick Exit is always in the top-right corner. It replaces this page with a neutral site, so the Back button does not bring you back here. On a laptop, pressing Esc three times does the same.</p>' +
      '<p>A website cannot erase your browser history. If someone else can see or control this device, private browsing and clearing history may not be enough. A device they cannot reach is safest.</p>' +
      '<h2>Add Amparo to your home screen</h2>' +
      '<ul><li><strong>iPhone:</strong> tap Share, then Add to Home Screen. iPhones do not show an install prompt.</li>' +
      '<li><strong>Android:</strong> open the browser menu, then choose Install app or Add to Home screen.</li>' +
      '<li><strong>Laptop (Chrome or Edge):</strong> use the install icon in the address bar, or the browser menu.</li></ul>' +
      '<div class="row"><button class="btn primary" type="button" data-go="landing">Back to start</button></div>' };
  };

  SCREENS.theme = function () {
    var cards = THEMES.map(function (t) {
      return '<label class="themecard" data-theme-preview="' + t.id + '"><input type="radio" name="theme" value="' + t.id + '"' + (t.id === state.theme ? ' checked' : '') + '>' +
        '<span class="tc-body"><strong>' + t.name + '</strong><span class="tc-desc">' + t.desc + '</span>' +
        '<span class="tc-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span></label>';
    }).join('');
    return { html:
      '<h1>Choose a look</h1>' +
      '<p class="lead">Pick the colours that feel best to you. This only lasts for this visit and is not saved.</p>' +
      '<fieldset><legend class="sr">Colour theme</legend><div class="themes">' + cards + '</div></fieldset>' +
      '<div class="row"><button class="btn primary" type="button" data-act="theme-done">Done</button></div>',
      after: function () {
        main.querySelectorAll('input[name="theme"]').forEach(function (i) {
          i.addEventListener('change', function () { applyTheme(i.value); });
        });
      } };
  };

  SCREENS.done = function () {
    return { html:
      '<h1>Take care of yourself.</h1>' +
      '<p class="lead">Nothing from this visit was saved.</p>' +
      '<div class="row"><button class="btn primary" type="button" data-act="exit">Leave this page</button></div>' };
  };

  /* ---------- Click handling ---------- */
  var ACTIONS = {
    exit: quickExit,
    'theme-done': function () {
      var back = ['breathing', 'activity', 'notice', 'theme'].indexOf(state.prev) > -1 ? 'need' : state.prev;
      go(back);
    },
    sound: function () { setSound(!state.sound); },
    'tour-next': function () { if (state.tourStep < TOUR.length - 1) { state.tourStep++; render(); } else { tour.set(); go('need'); } },
    'tour-skip': function () { tour.set(); go('need'); },
    pick: function (t) { state.need = t.dataset.need; go('shelves'); },
    chip: function (t) {
      var k = t.dataset.chip; state.chip = k === 'skip' ? null : k;
      main.querySelectorAll('[data-chip]').forEach(function (b) {
        if (b.dataset.chip !== 'skip') b.setAttribute('aria-pressed', String(b.dataset.chip === state.chip));
      });
    },
    preview: function (t) {
      var id = t.dataset.id, box = document.getElementById('pv-' + id), open = box.hidden;
      box.hidden = !open; t.setAttribute('aria-expanded', String(open));
      if (open) {
        var played = playSample({ intensity: checked('int-' + id) });
        box.querySelector('.hint').textContent = played ? '' : 'Sound is off. Turn it on at the top to hear a sample.';
      }
    },
    start: function (t) {
      var id = t.dataset.id; state.item = id;
      if (ITEMS[id].tier >= 2) go('notice'); else begin(id);
    },
    'notice-continue': function () { begin(state.item); },
    play: function () {
      var it = ITEMS[state.item];
      var ok = playSample(it.options ? { genre: checked('genre'), tempo: checked('pace') } : {});
      $('#ahint').textContent = ok ? '' : 'Sound is off. Turn it on at the top to hear a sample.';
    },
    'try-calm': function () { state.need = 'calm'; go('shelves'); },
    tempo: function (t) {
      main.querySelectorAll('[data-tempo]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      if (br) br.setTempo(t.dataset.tempo);
    },
    pause: function (t) { if (br) br.togglePause(t); },
    finish: function () { go('after'); },
    rate: function (t) {
      state.rated = t.dataset.rate; // shown only, never sent or saved
      main.querySelectorAll('[data-rate]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      $('#rated').textContent = 'Thank you.';
    },
    another: function () { state.need = 'calm'; go('shelves'); },
    choose: function (t) {
      if (timers.card) return;
      main.querySelectorAll('.choices .chipbtn').forEach(function (b) { b.disabled = true; });
      t.classList.add('picked'); t.setAttribute('aria-pressed', 'true');
      timers.card = setTimeout(nextCard, 700);
    },
    'skip-card': function () { if (timers.card) { clearTimeout(timers.card); timers.card = null; } state.card++; render(); }
  };

  function begin(id) {
    var k = ITEMS[id].kind;
    if (k === 'breathing') go('breathing');
    else if (k === 'reflect') go('between');
    else go('activity');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go],[data-act]');
    if (!t || t.disabled) return;
    if (t.dataset.go) { go(t.dataset.go); return; }
    var fn = ACTIONS[t.dataset.act];
    if (fn) fn(t, e);
  });

  applyTheme(state.theme);
  render();
})();
