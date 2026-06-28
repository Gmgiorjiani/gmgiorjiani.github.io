const backCanvas = document.getElementById("orbit-back");
const frontCanvas = document.getElementById("orbit-front");

const backCtx = backCanvas.getContext("2d");
const frontCtx = frontCanvas.getContext("2d");

let width = 0;
let height = 0;
let dpr = 1;

function resizeCanvas(canvas, ctx) {
  dpr = window.devicePixelRatio || 1;
  width = canvas.clientWidth || 800;
  height = canvas.clientHeight || 500;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resizeAll() {
  resizeCanvas(backCanvas, backCtx);
  resizeCanvas(frontCanvas, frontCtx);
}

window.addEventListener("resize", resizeAll);
resizeAll();

const startTime = performance.now();

const stars = Array.from({ length: 85 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.1 + 0.25,
  alpha: Math.random() * 0.35 + 0.06,
  speed: Math.random() * 0.08 + 0.02,
  phase: Math.random() * Math.PI * 2,
  gold: Math.random() > 0.84
}));

function drawStars(ctx, t) {
  for (const s of stars) {
    const x = s.x * width + Math.sin(t * s.speed + s.phase) * 6;
    const y = s.y * height + Math.cos(t * s.speed + s.phase) * 4;
    const alpha = Math.max(0.03, s.alpha + Math.sin(t * 1.2 + s.phase) * 0.07);

    ctx.beginPath();
    ctx.fillStyle = s.gold
      ? `rgba(216, 189, 112, ${alpha})`
      : `rgba(246, 242, 234, ${alpha})`;
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function orbitPosition(angle) {
  const cx = width * 0.52;
  const cy = height * 0.50;

  const rx = Math.min(width, height) * 0.43;
  const ry = Math.min(width, height) * 0.22;

  const tilt = -0.22;

  const x0 = Math.cos(angle) * rx;
  const y0 = Math.sin(angle) * ry;

  return {
    x: cx + x0 * Math.cos(tilt) - y0 * Math.sin(tilt),
    y: cy + x0 * Math.sin(tilt) + y0 * Math.cos(tilt)
  };
}

function normalizeAngle(angle) {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

/*
  Back half = behind the brain.
  Front half = visible in front of the brain.

  Adjust these if you want the hidden part elsewhere.
*/
function isBehindBrain(angle) {
  const a = normalizeAngle(angle);
  return a > Math.PI * 0.08 && a < Math.PI * 1.08;
}

function drawOrbitSegment(ctx, behind) {
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 5]);

  for (let i = 0; i < 420; i++) {
    const a1 = (i / 420) * Math.PI * 2;
    const a2 = ((i + 1) / 420) * Math.PI * 2;
    const mid = (a1 + a2) / 2;

    if (isBehindBrain(mid) !== behind) continue;

    const p1 = orbitPosition(a1);
    const p2 = orbitPosition(a2);

    ctx.strokeStyle = behind
      ? "rgba(216, 189, 112, 0.22)"
      : "rgba(216, 189, 112, 0.82)";

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawTarget(ctx, angle, hidden) {
  const p = orbitPosition(angle);

  if (hidden) return;

  ctx.beginPath();
  ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(246, 242, 234, 1)";
  ctx.shadowColor = "rgba(246, 242, 234, 0.95)";
  ctx.shadowBlur = 22;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(216, 189, 112, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;
}

function animate(now) {
  const elapsed = (now - startTime) / 1000;
  const angle = -Math.PI * 0.15 + elapsed * 0.72;

  backCtx.clearRect(0, 0, width, height);
  frontCtx.clearRect(0, 0, width, height);

  drawStars(backCtx, elapsed);

  drawOrbitSegment(backCtx, true);
  drawOrbitSegment(frontCtx, false);

  const behind = isBehindBrain(angle);

  if (behind) {
    drawTarget(backCtx, angle, true);
  } else {
    drawTarget(frontCtx, angle, false);
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
