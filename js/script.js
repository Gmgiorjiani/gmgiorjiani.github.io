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

const particles = Array.from({ length: 90 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.2 + 0.25,
  alpha: Math.random() * 0.18 + 0.03,
  drift: Math.random() * 0.15 + 0.04
}));

function drawNoiseField(t) {
  for (const p of particles) {
    const x = p.x * width + Math.sin(t * p.drift + p.y * 10) * 8;
    const y = p.y * height + Math.cos(t * p.drift + p.x * 10) * 8;

    ctx.beginPath();
    ctx.fillStyle = `rgba(247, 244, 236, ${p.alpha})`;
    ctx.arc(x, y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function easeInOutCubic(x) {
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function getDotPosition(progress) {
  const cx = width * 0.58;
  const cy = height * 0.45;
  const radius = Math.min(width, height) * 0.22;

  const startAngle = Math.PI * 1.16;
  const endAngle = Math.PI * 2.05;
  const angle = startAngle + (endAngle - startAngle) * progress;

  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

function drawPredictionSequence(elapsed) {
  const delay = 0.45;
  const duration = 3.0;
  const local = Math.max(0, elapsed - delay);
  const rawProgress = Math.min(local / duration, 1);
  const progress = easeInOutCubic(rawProgress);

  const occluder = {
    x: width * 0.60,
    y: height * 0.42,
    r: Math.min(width, height) * 0.095
  };

  const point = getDotPosition(progress);

  const trail = [];
  for (let i = 0; i < 72; i++) {
    const p = Math.max(0, progress - i * 0.006);
    trail.push(getDotPosition(p));
  }

  ctx.lineWidth = 1;

  for (let i = 0; i < trail.length - 1; i++) {
    const alpha = Math.max(0, 0.18 - i * 0.0027);
    ctx.strokeStyle = `rgba(247, 244, 236, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(trail[i].x, trail[i].y);
    ctx.lineTo(trail[i + 1].x, trail[i + 1].y);
    ctx.stroke();
  }

  const distToOccluder = Math.hypot(point.x - occluder.x, point.y - occluder.y);
  const isBehindOccluder = distToOccluder < occluder.r * 0.92;

  if (local > 1.2 && local < 2.45) {
    ctx.beginPath();
    ctx.arc(occluder.x, occluder.y, occluder.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(3, 3, 3, 0.68)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(occluder.x, occluder.y, occluder.r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(247, 244, 236, 0.045)";
    ctx.stroke();
  }

  const dotAlpha = isBehindOccluder ? 0.08 : 1;

  ctx.beginPath();
  ctx.arc(point.x, point.y, 5.2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(247, 244, 236, ${dotAlpha})`;
  ctx.shadowColor = `rgba(247, 244, 236, ${dotAlpha})`;
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;

  if (isBehindOccluder) {
    const predicted = getDotPosition(Math.min(progress + 0.08, 1));

    ctx.beginPath();
    ctx.arc(predicted.x, predicted.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(214, 180, 92, 0.22)";
    ctx.fill();
  }

  if (rawProgress === 1) {
    const loopProgress = ((elapsed - delay - duration) % 11) / 11;
    if (loopProgress > 0) {
      const p = easeInOutCubic(loopProgress);
      const ghost = getDotPosition(p);

      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(247, 244, 236, 0.18)";
      ctx.fill();
    }
  }
}

function animate(now) {
  const elapsed = (now - startTime) / 1000;

  ctx.clearRect(0, 0, width, height);

  drawNoiseField(elapsed);
  drawPredictionSequence(elapsed);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
