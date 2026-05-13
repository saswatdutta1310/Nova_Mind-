// Hide system cursor and enable custom cursor
document.body.style.cursor = 'none';
const interactiveElements = 'a, button, input, textarea, .pub-item, .service-card, .team-card';
document.querySelectorAll(interactiveElements).forEach(el => el.style.cursor = 'none');

const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx - 6 + 'px';
  cursor.style.top = my - 6 + 'px';
});
function animateTrail() {
  tx += (mx - tx) * 0.18;
  ty += (my - ty) * 0.18;
  trail.style.left = tx - 18 + 'px';
  trail.style.top = ty - 18 + 'px';
  requestAnimationFrame(animateTrail);
}
animateTrail();
document.addEventListener('mousedown', () => cursor.style.transform = 'scale(2)');
document.addEventListener('mouseup', () => cursor.style.transform = 'scale(1)');

// Nav scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

// Counter animation
function animateCount(el, target, prefix = '') {
  let current = 0;
  const step = target / 60;
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = prefix + Math.round(current);
    if (current >= target) clearInterval(interval);
  }, 16);
}
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('[data-target]').forEach(el => {
        animateCount(el, +el.dataset.target, el.dataset.prefix || '');
        if (el.dataset.prefix === '$') {
          const orig = setInterval(() => {}, 0);
          clearInterval(orig);
          // append M after
          setTimeout(() => { el.textContent = el.textContent + 'M'; }, 1100);
        }
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });
const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

// 3D Hero Canvas — neural particle system
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

const NODES = 120;
const nodes = Array.from({length: NODES}, () => ({
  x: Math.random() * W, y: Math.random() * H,
  z: Math.random() * 1000,
  vx: (Math.random() - 0.5) * 0.4,
  vy: (Math.random() - 0.5) * 0.4,
  vz: (Math.random() - 0.5) * 0.3,
  r: Math.random() * 2.5 + 0.5,
  col: Math.random() > 0.7 ? '#7b5ea7' : Math.random() > 0.5 ? '#00f5c8' : '#00a8ff',
  pulse: Math.random() * Math.PI * 2
}));

let mouseX = W / 2, mouseY = H / 2;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

function project(x, y, z) {
  const fov = 600;
  const scale = fov / (fov + z);
  return {
    px: W / 2 + (x - W / 2) * scale,
    py: H / 2 + (y - H / 2) * scale,
    scale
  };
}

let frame = 0;
function draw3D() {
  frame++;
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
  bg.addColorStop(0, 'rgba(12,18,40,0.95)');
  bg.addColorStop(1, 'rgba(3,7,18,0.98)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle mouse glow
  const mglow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 300);
  mglow.addColorStop(0, 'rgba(0,245,200,0.04)');
  mglow.addColorStop(1, 'transparent');
  ctx.fillStyle = mglow;
  ctx.fillRect(0, 0, W, H);

  // Update nodes
  nodes.forEach(n => {
    n.x += n.vx + (mouseX - W/2) * 0.00008;
    n.y += n.vy + (mouseY - H/2) * 0.00008;
    n.z += n.vz;
    n.pulse += 0.02;
    if (n.x < 0 || n.x > W) n.vx *= -1;
    if (n.y < 0 || n.y > H) n.vy *= -1;
    if (n.z < 0 || n.z > 1000) n.vz *= -1;
  });

  // Draw connections
  for (let i = 0; i < NODES; i++) {
    const a = nodes[i];
    const pa = project(a.x, a.y, a.z);
    for (let j = i + 1; j < NODES; j++) {
      const b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < 180) {
        const pb = project(b.x, b.y, b.z);
        const alpha = (1 - dist / 180) * 0.25 * pa.scale;
        ctx.beginPath();
        ctx.moveTo(pa.px, pa.py);
        ctx.lineTo(pb.px, pb.py);
        ctx.strokeStyle = `rgba(0,245,200,${alpha})`;
        ctx.lineWidth = pa.scale * 0.5;
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  nodes.forEach(n => {
    const p = project(n.x, n.y, n.z);
    const radius = n.r * p.scale * (1 + 0.3 * Math.sin(n.pulse));
    ctx.beginPath();
    ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
    ctx.fillStyle = n.col;
    ctx.globalAlpha = 0.7 * p.scale;
    ctx.fill();

    // Glow ring on some nodes
    if (n.r > 2) {
      ctx.beginPath();
      ctx.arc(p.px, p.py, radius * 3, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, radius * 3);
      grad.addColorStop(0, 'rgba(0,245,200,0.15)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = p.scale;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  requestAnimationFrame(draw3D);
}
draw3D();

// Parallax on scroll
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.querySelectorAll('.parallax-layer').forEach(el => {
    const speed = parseFloat(el.dataset.speed || 0.5);
    el.style.transform = `translateY(${y * speed}px)`;
  });
  const pbg = document.getElementById('parallax-bg');
  if (pbg) {
    const rect = document.getElementById('research').getBoundingClientRect();
    const progress = -rect.top / window.innerHeight;
    pbg.style.transform = `translateY(${progress * 80}px) scale(1.1)`;
  }
});

// Floating particles
function createParticle() {
  const p = document.createElement('div');
  p.classList.add('particle');
  p.style.left = Math.random() * 100 + 'vw';
  p.style.animationDuration = (Math.random() * 15 + 10) + 's';
  p.style.animationDelay = (Math.random() * 5) + 's';
  p.style.opacity = '0';
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 25000);
}
setInterval(createParticle, 800);

// Form submit
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.textContent = 'SENDING…';
  setTimeout(() => {
    btn.textContent = '✓ MESSAGE SENT';
    btn.style.background = '#00f5c8';
  }, 1500);
}


// Mobile menu
function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  if (links) {
    links.classList.toggle('nav-active');
  }
}

// Scroll progress bar
const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  if (scrollProgress) scrollProgress.style.width = scrolled + '%';
});

// Newsletter submission
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const input = e.target.querySelector('input');
  btn.textContent = 'JOINING…';
  setTimeout(() => {
    btn.textContent = '✓ WELCOME';
    btn.style.background = '#00f5c8';
    input.value = '';
    input.placeholder = 'Registration complete.';
    input.disabled = true;
  }, 1500);
}
