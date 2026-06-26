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

const stars = Array.from({ length: 135 }, () => ({
  x: Math.random(),
  y: Math.random() * 0.78,
  r: Math.random() * 1.35 + 0.25,
  alpha: Math.random() * 0.42 + 0.08,
  speed: Math.random() * 0.12 + 0.035,
  phase: Math.random() * Math.PI * 2,
  gold: Math.random() > 0.78
}));

function drawStars(t) {
  for (const s of stars) {
    const x = s.x * width + Math.sin(t * s.speed + s.phase) * 8;
    const y = s.y * height + Math.cos(t * s.speed + s.phase) * 5;
    const twinkle = s.alpha + Math.sin(t * 1.3 + s.phase) * 0.08;

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
  const startX = width * 0.48;
  const endX = width * 0.91;
  const x = startX + (endX - startX) * progress;

  const baseY = height * 0.38;
  const arc = Math.sin(progress * Math.PI) * -45;
  const wobble = Math.sin(progress * Math.PI * 2) * 7;

  return { x, y: baseY + arc + wobble };
}

function drawTree(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(1, 1, 1, 0.98)";
  ctx.shadowColor = "rgba(216, 189, 112, 0.22)";
  ctx.shadowBlur = 18;

  ctx.beginPath();
  ctx.arc(0, -55, 42, 0, Math.PI * 2);
  ctx.arc(-34, -42, 30, 0, Math.PI * 2);
  ctx.arc(34, -42, 30, 0, Math.PI * 2);
  ctx.arc(-18, -75, 28, 0, Math.PI * 2);
  ctx.arc(22, -78, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillRect(-6, -44, 12, 62);

  ctx.strokeStyle = "rgba(216, 189, 112, 0.13)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-95, 20);
  ctx.quadraticCurveTo(0, 3, 120, 18);
  ctx.stroke();

  ctx.restore();
}

function drawHeroMotion(elapsed) {
  const delay = 0.45;
  const duration = 3.2;
  const local = Math.max(0, elapsed - delay);
  const raw = Math.min(local / duration, 1);
  const progress = easeInOutCubic(raw);

  const treeX = width * 0.66;
  const treeY = height * 0.47;
  const treeScale = Math.min(width, height) / 950;

  const point = motionPosition(progress);

  ctx.lineWidth = 1;

  let prev = motionPosition(0);
  for (let i = 1; i <= 80; i++) {
    const p = i / 80;
    const curr = motionPosition(p);

    const isFuture = p > progress;
    const alpha = isFuture ? 0.13 : 0.26;

    ctx.setLineDash(isFuture ? [2, 8] : []);
    ctx.strokeStyle = `rgba(246, 242, 234, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.stroke();

    prev = curr;
  }

  ctx.setLineDash([]);

  drawTree(treeX, treeY, treeScale);

  const treeBlock =
    point.x > treeX - 70 * treeScale &&
    point.x < treeX + 58 * treeScale &&
    point.y > treeY - 110 * treeScale &&
    point.y < treeY + 20 * treeScale;

  const dotAlpha = treeBlock ? 0.04 : 1;

  ctx.beginPath();
  ctx.arc(point.x, point.y, 5.3, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(246, 242, 234, ${dotAlpha})`;
  ctx.shadowColor = `rgba(246, 242, 234, ${dotAlpha})`;
  ctx.shadowBlur = 22;
  ctx.fill();
  ctx.shadowBlur = 0;

  if (treeBlock) {
    const predicted = motionPosition(Math.min(progress + 0.14, 1));
    ctx.beginPath();
    ctx.arc(predicted.x, predicted.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(216, 189, 112, 0.28)";
    ctx.setLineDash([2, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(predicted.x, predicted.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(216, 189, 112, 0.55)";
    ctx.fill();
  }

  if (raw === 1) {
    const loop = ((elapsed - delay - duration) % 9) / 9;
    const ghost = motionPosition(easeInOutCubic(loop));

    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(216, 189, 112, 0.28)";
    ctx.fill();
  }
}

function animate(now) {
  const elapsed = (now - startTime) / 1000;

  ctx.clearRect(0, 0, width, height);
  drawStars(elapsed);
  drawHeroMotion(elapsed);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
