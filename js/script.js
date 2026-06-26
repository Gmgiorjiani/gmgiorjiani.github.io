const canvas = document.getElementById("motion-canvas");
const ctx = canvas.getContext("2d");

let width;
let height;
let dpr;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  width = canvas.clientWidth;
  height = canvas.clientHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const startTime = performance.now();

const stars = Array.from({ length: 90 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.25 + 0.25,
  alpha: Math.random() * 0.42 + 0.07,
  speed: Math.random() * 0.1 + 0.025,
  phase: Math.random() * Math.PI * 2,
  gold: Math.random() > 0.84
}));

function drawStars(t) {
  for (const s of stars) {
    const x = s.x * width + Math.sin(t * s.speed + s.phase) * 6;
    const y = s.y * height + Math.cos(t * s.speed + s.phase) * 4;
    const twinkle = s.alpha + Math.sin(t * 1.2 + s.phase) * 0.08;

    ctx.beginPath();
    ctx.fillStyle = s.gold
      ? `rgba(216, 189, 112, ${Math.max(0.03, twinkle)})`
      : `rgba(246, 242, 234, ${Math.max(0.03, twinkle)})`;
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getOrbit() {
  return {
    cx: width * 0.52,
    cy: height * 0.50,
    r: Math.min(width, height) * 0.32
  };
}

function orbitPosition(angle) {
  const orbit = getOrbit();

  return {
    x: orbit.cx + Math.cos(angle) * orbit.r,
    y: orbit.cy + Math.sin(angle) * orbit.r
  };
}

function normalizeAngle(angle) {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function isOccluded(angle) {
  const a = normalizeAngle(angle);

  return a > Math.PI * 0.72 && a < Math.PI * 1.50;
}

function drawOrbit() {
  ctx.lineWidth = 1;

  for (let i = 0; i < 260; i++) {
    const a1 = (i / 260) * Math.PI * 2;
    const a2 = ((i + 1) / 260) * Math.PI * 2;

    const p1 = orbitPosition(a1);
    const p2 = orbitPosition(a2);

    const hidden = isOccluded((a1 + a2) / 2);

    ctx.strokeStyle = hidden
      ? "rgba(216, 189, 112, 0.055)"
      : "rgba(246, 242, 234, 0.16)";

    ctx.setLineDash(hidden ? [2, 8] : []);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawOccluder() {
  const orbit = getOrbit();

  const x = orbit.cx;
  const y = orbit.cy + orbit.r * 0.68;
  const w = orbit.r * 2.25;
  const h = orbit.r * 0.82;

  const gradient = ctx.createRadialGradient(x, y, h * 0.15, x, y, w * 0.55);
  gradient.addColorStop(0, "rgba(2, 2, 2, 0.96)");
  gradient.addColorStop(0.65, "rgba(2, 2, 2, 0.72)");
  gradient.addColorStop(1, "rgba(2, 2, 2, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.55, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawDot(angle) {
  const p = orbitPosition(angle);
  const hidden = isOccluded(angle);

  if (hidden) {
    const predicted = orbitPosition(angle + 0.42);

    ctx.beginPath();
    ctx.arc(predicted.x, predicted.y, 17, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(216, 189, 112, 0.18)";
    ctx.setLineDash([2, 7]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(predicted.x, predicted.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(216, 189, 112, 0.35)";
    ctx.shadowColor = "rgba(216, 189, 112, 0.45)";
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    return;
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, 5.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(246, 242, 234, 1)";
  ctx.shadowColor = "rgba(246, 242, 234, 0.95)";
  ctx.shadowBlur = 22;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawHeroMotion(elapsed) {
  const introDelay = 0.6;
  const speed = 0.72;

  const t = Math.max(0, elapsed - introDelay);
  const angle = -Math.PI * 0.15 + t * speed;

  drawOrbit();
  drawDot(angle);
  drawOccluder();
}

function animate(now) {
  const elapsed = (now - startTime) / 1000;

  resizeCanvas();
  ctx.clearRect(0, 0, width, height);

  drawStars(elapsed);
  drawHeroMotion(elapsed);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
