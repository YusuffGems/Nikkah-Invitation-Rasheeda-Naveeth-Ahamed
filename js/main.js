/* =========================================================
   Nikkah E-Invitation — interactions & animation
   ========================================================= */
(function () {
  'use strict';

  const EVENT_START = new Date('2026-11-15T18:00:00+05:30');
  const EVENT_END   = new Date('2026-11-15T21:00:00+05:30');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Build the gold petal ring on the medallion ---------- */
  const ring = document.getElementById('petalRing');
  if (ring) {
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 16; i++) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M100 100 C 88 70, 92 42, 100 26 C 108 42, 112 70, 100 100 Z');
      p.setAttribute('fill', i % 2 ? '#f6e9c6' : '#fffaf2');
      p.setAttribute('stroke', 'url(#gold)');
      p.setAttribute('stroke-width', '1.6');
      p.setAttribute('transform', `rotate(${i * 22.5} 100 100)`);
      ring.appendChild(p);
    }
  }

  /* ---------- Open the gate ---------- */
  const gate = document.getElementById('gate');
  const content = document.getElementById('content');
  const openBtn = document.getElementById('openBtn');

  function openGate() {
    if (gate.classList.contains('open')) return;
    gate.classList.add('open');
    document.body.classList.remove('locked');
    content.setAttribute('aria-hidden', 'false');
    burst();
    chime();
    setTimeout(() => { gate.classList.add('gone'); }, reduceMotion ? 50 : 2500);
  }
  openBtn.addEventListener('click', openGate);
  gate.addEventListener('keydown', (e) => { if (e.key === 'Enter') openGate(); });

  /* Soft chime on opening (Web Audio, no file needed) */
  function chime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        const t = ctx.currentTime + i * 0.18;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + 1.7);
      });
    } catch (_) { /* audio is optional */ }
  }

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      if (el.classList.contains('names-grid')) {
        el.querySelectorAll('li').forEach((li, i) => { li.style.transitionDelay = `${i * 70}ms`; });
      }
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    io.observe(el);
  });

  /* ---------- Countdown ---------- */
  const cd = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs'),
  };
  const pad = (n) => String(n).padStart(2, '0');
  function setVal(el, v) {
    if (el.textContent !== v) {
      el.textContent = v;
      el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    }
  }
  function updateCountdown() {
    let diff = EVENT_START - new Date();
    if (diff <= 0) {
      document.getElementById('countdown').hidden = true;
      document.getElementById('cdDone').hidden = false;
      return false;
    }
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    setVal(cd.days, pad(d)); setVal(cd.hours, pad(h));
    setVal(cd.mins, pad(m)); setVal(cd.secs, pad(s));
    return true;
  }
  if (updateCountdown()) {
    const timer = setInterval(() => { if (!updateCountdown()) clearInterval(timer); }, 1000);
  }

  /* ---------- Add to Calendar (.ics) ---------- */
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  document.getElementById('calBtn').addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nikkah Invitation//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:nikkah-rasheeda-naveeth-20261115@invite',
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(EVENT_START),
      'DTEND:' + fmt(EVENT_END),
      'SUMMARY:Nikkah – M.A. Alkaviun Rasheeda & J. Naveeth Ahamed',
      'DESCRIPTION:Nikkah between 6.00 and 7.00 p.m. (5th Jamada Al-Akhir\\, Hijri 1448). Insha Allah.',
      'LOCATION:M.S. Mahal\\, O.No.41\\, N.No.48\\, Chella Pillayar Koil Street\\, Royapettah\\, Chennai - 600 014',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Nikkah tomorrow', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Nikkah-Rasheeda-Naveeth.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Calendar file downloaded');
  });

  /* ---------- Share ---------- */
  document.getElementById('shareBtn').addEventListener('click', async () => {
    const text = 'Assalamu Alaikum! You are cordially invited to the Nikkah of M.A. Alkaviun Rasheeda with J. Naveeth Ahamed — Sunday, 15th November 2026, 6.00–7.00 p.m. at M.S. Mahal, Royapettah, Chennai.';
    const url = location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Nikkah Invitation', text, url }); } catch (_) {}
      return;
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
  });

  /* ---------- Toast ---------- */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* =========================================================
     Falling petals + gold sparkles (canvas)
     ========================================================= */
  const canvas = document.getElementById('petals');
  const ctx = canvas.getContext('2d');
  let W, H, DPR, particles = [];
  const COLORS = ['#f2b8bf', '#ecd3cc', '#f5dcb5', '#d9aea4', '#ffffff', '#e9a6b2'];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  addEventListener('resize', resize);
  resize();

  function makePetal(fromBurst) {
    const size = (6 + Math.random() * 9) * DPR;
    return {
      kind: Math.random() < 0.18 ? 'spark' : 'petal',
      x: fromBurst ? W / 2 + (Math.random() - 0.5) * 80 * DPR : Math.random() * W,
      y: fromBurst ? H / 2 : -20 * DPR,
      vx: fromBurst ? (Math.random() - 0.5) * 9 * DPR : (Math.random() - 0.5) * 0.6 * DPR,
      vy: fromBurst ? (-Math.random() * 8 - 2) * DPR : (0.6 + Math.random() * 1.1) * DPR,
      size,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.06,
      sway: Math.random() * Math.PI * 2,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: 1,
      burst: !!fromBurst,
    };
  }

  function burst() {
    if (reduceMotion) return;
    for (let i = 0; i < 90; i++) particles.push(makePetal(true));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = 0.85 * p.life;
    if (p.kind === 'spark') {
      ctx.fillStyle = '#e8c766';
      ctx.shadowColor = '#f1dc9c';
      ctx.shadowBlur = 8 * DPR;
      const s = p.size * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(0, 0); ctx.lineTo(s * 0.25, s * 0.25); ctx.lineTo(0, s); ctx.lineTo(-s * 0.25, s * 0.25);
      }
      ctx.fill();
    } else {
      const s = p.size;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.6, 0, s);
      ctx.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.6, 0, -s);
      ctx.fill();
      ctx.strokeStyle = 'rgba(155,27,71,.18)';
      ctx.lineWidth = 0.6 * DPR;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.8); ctx.stroke();
    }
    ctx.restore();
  }

  let last = 0;
  function loop(t) {
    const dt = Math.min((t - last) / 16.67, 3) || 1;
    last = t;
    ctx.clearRect(0, 0, W, H);

    const target = innerWidth < 640 ? 22 : 38;
    const ambient = particles.filter((p) => !p.burst).length;
    if (ambient < target && Math.random() < 0.15) particles.push(makePetal(false));

    particles = particles.filter((p) => {
      p.sway += 0.02 * dt;
      if (p.burst) {
        p.vy += 0.18 * DPR * dt;
        p.vx *= 0.985;
        p.life -= 0.006 * dt;
      }
      p.x += (p.vx + Math.sin(p.sway) * 0.5 * DPR) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      drawPetal(p);
      return p.y < H + 30 * DPR && p.life > 0;
    });
    requestAnimationFrame(loop);
  }
  if (!reduceMotion) requestAnimationFrame(loop);
})();
