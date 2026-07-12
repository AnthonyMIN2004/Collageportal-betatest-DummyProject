// ── COLLEGIATE PORTAL | ORB.JS ──
// Glass orb mascot rendering (canvas eyes) and modal control

function makeEyes(canvasId, size) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  const S = size, cx = size / 2, cy = size / 2, R = size * 0.464;
  let t = 0, blinkT = 0, nextBlink = 3 + Math.random() * 4;

  function pill(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function draw(ts) {
    t = ts / 1000;
    ctx.clearRect(0, 0, S, S);

    // blink
    blinkT += 1 / 60;
    let sy = 1;
    if (blinkT > nextBlink) {
      const bp = blinkT - nextBlink;
      if (bp < 0.09) sy = 1 - bp / 0.09;
      else if (bp < 0.15) sy = 0.04;
      else if (bp < 0.25) sy = (bp - 0.15) / 0.1;
      else {
        sy = 1;
        if (bp > 0.35) {
          blinkT = 0;
          nextBlink = 2 + Math.random() * 5;
        }
      }
    }

    const ew = R * 0.135, eh = R * 0.36, gap = R * 0.36;
    const ey = cy - R * 0.05;
    const wb = Math.sin(t * 0.85) * R * 0.013;

    [-1, 1].forEach(side => {
      const ex = cx + (side * gap) / 2;
      ctx.save();
      ctx.translate(ex, ey + wb);
      ctx.scale(1, sy);

      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      pill(-ew / 2, -eh / 2, ew, eh, ew / 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      const shine = ctx.createRadialGradient(
        -ew * 0.1,
        -eh * 0.3,
        0,
        -ew * 0.08,
        -eh * 0.18,
        ew * 0.42
      );
      shine.addColorStop(0, 'rgba(255,255,255,1)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine;
      pill(-ew / 2, -eh / 2, ew, eh * 0.42, ew / 2);
      ctx.fill();

      ctx.restore();
    });

    // blush
    const ba = 0.15 + Math.sin(t * 0.4) * 0.04;
    [-1, 1].forEach(side => {
      const bx = cx + side * (gap / 2 + ew * 1.1);
      const by = ey + eh * 0.52;
      ctx.save();
      ctx.globalAlpha = ba;
      const bg = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.14);
      bg.addColorStop(0, 'rgba(255,145,175,1)');
      bg.addColorStop(1, 'rgba(255,100,140,0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(bx, by, R * 0.14, R * 0.084, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// Init all canvas orbs
function initOrbs() {
  makeEyes('banner-eyes', 80);
  makeEyes('float-eyes', 56);
}

// Init gate orb (called separately since gate is visible before login)
function initGateOrb() {
  makeEyes('gate-eyes', 110);
}

// Modal open/close — init modal canvas lazily on first open
let modalOrbStarted = false;
function openOrbModal() {
  const overlay = document.getElementById('orb-modal');
  overlay.classList.remove('opacity-0', 'pointer-events-none');
  overlay.classList.add('opacity-100');
  // sync speech text from banner to modal
  const speech = document.getElementById('mascot-speech-lbl')?.textContent;
  document.getElementById('modal-mascot-speech').textContent = speech || '...';
  if (!modalOrbStarted) {
    makeEyes('modal-eyes', 280);
    modalOrbStarted = true;
  }
}

function closeOrbModal() {
  const overlay = document.getElementById('orb-modal');
  overlay.classList.add('opacity-0', 'pointer-events-none');
  overlay.classList.remove('opacity-100');
}

// Initialize gate orb on page load (visible before login)
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initGateOrb === 'function') {
    initGateOrb();
  }
});

// Close modal on overlay click (not inner card)
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('orb-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeOrbModal();
    });
  }
});
