const canvas = document.getElementById("motion-canvas");
const ctx = canvas.getContext("2d");

let width;
let height;
let dpr;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const startTime = performance.now();

const stars = Array.from({ length: 155 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.8,
  r: Math.random() * 1.35 + 0.25,
  alpha: Math.random() * 0.42 + 0.07,
  speed: Math.random() * 0.1 + 0.025,
  phase: Math.random() * Math.PI * 2,
  gold: Math.random() > 0.82
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

function easeInOutCubic(x) {
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function motionPosition(progress) {
  const startX = width * 0.47;
  const endX = width * 0.91;
  const x = startX + (endX - startX) * progress;

  const baseY = height * 0.38;
  const arc = Math.sin(progress * Math.PI) * -34;
  const wobble = Math.sin(progress * Math.PI * 2) * 5;

  return { x, y: baseY + arc + wobble };
}

function drawHeroOccluder(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(2, 2, 2, 0.94)";
  ctx.strokeStyle = "rgba(246, 242, 234, 0.22)";
  ctx.lineWidth = 1;

  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
  ctx.shadowBlur = 30;

  ctx.beginPath();
  ctx.rect(-13, -72, 26, 144);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(216, 189, 112, 0.18)";
  ctx.lineWidth = 1;

  for (let i = -68; i < 72; i += 10) {
    ctx.beginPath();
    ctx.moveTo(-13, i);
    ctx.lineTo(13, i - 26);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHeroMotion(elapsed) {
  const delay = 0.45;
  const duration = 3.2;
  const local = Math.max(0, elapsed - delay);
  const raw = Math.min(local / duration, 1);
  const progress = easeInOutCubic(raw);

  const occX = width * 0.64;
  const occY = height * 0.38;
  const occScale = Math.min(width, height) / 720;

  const point = motionPosition(progress);

  ctx.lineWidth = 1;

  let prev = motionPosition(0);
  for (let i = 1; i <= 90; i++) {
    const p = i / 90;
    const curr = motionPosition(p);

    const isFuture = p > progress;
    ctx.setLineDash(isFuture ? [2, 8] : []);
    ctx.strokeStyle = isFuture
      ? "rgba(216, 189, 112, 0.20)"
      : "rgba(246, 242, 234, 0.32)";

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();

    prev = curr;
  }

  ctx.setLineDash([]);

  drawHeroOccluder(occX, occY, occScale);

  const blockHalfWidth = 18 * occScale;
  const blockHalfHeight = 80 * occScale;

  const isBlocked =
    point.x > occX - blockHalfWidth &&
    point.x < occX + blockHalfWidth &&
    point.y > occY - blockHalfHeight &&
    point.y < occY + blockHalfHeight;

  const dotAlpha = isBlocked ? 0.035 : 1;

  ctx.beginPath();
  ctx.arc(point.x, point.y, 5.2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(246, 242, 234, ${dotAlpha})`;
  ctx.shadowColor = `rgba(246, 242, 234, ${dotAlpha})`;
  ctx.shadowBlur = 22;
  ctx.fill();
  ctx.shadowBlur = 0;

  if (isBlocked) {
    const predicted = motionPosition(Math.min(progress + 0.15, 1));

    ctx.beginPath();
    ctx.arc(predicted.x, predicted.y, 19, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(216, 189, 112, 0.34)";
    ctx.setLineDash([2, 7]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(predicted.x, predicted.y, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(216, 189, 112, 0.62)";
    ctx.shadowColor = "rgba(216, 189, 112, 0.55)";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (raw === 1) {
    const loop = ((elapsed - delay - duration) % 9) / 9;
    const ghost = motionPosition(easeInOutCubic(loop));

    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(216, 189, 112, 0.28)";
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(216, 189, 112, 0.12)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(width * 0.38, height * 0.56);
  ctx.quadraticCurveTo(width * 0.68, height * 0.48, width * 0.98, height * 0.56);
  ctx.stroke();
}

function animate(now) {
  const elapsed = (now - startTime) / 1000;

  ctx.clearRect(0, 0, width, height);

  drawStars(elapsed);
  drawHeroMotion(elapsed);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
