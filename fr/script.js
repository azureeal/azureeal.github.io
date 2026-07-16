/* ── Détection tactile ──────────────────────────────────── */
const isTouch = window.matchMedia('(pointer: coarse)').matches;

/* ── Losange cursor ─────────────────────────────────────── */
if (!isTouch) {
    const diamond = document.createElement('div');
    const outer   = document.createElement('div');
    diamond.className = 'cursor-diamond';
    outer.className   = 'cursor-outer';
    document.body.append(diamond, outer);

    let mx = 0, my = 0, ox = 0, oy = 0;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        diamond.style.left = mx + 'px';
        diamond.style.top  = my + 'px';
    });

    (function animOuter() {
        ox += (mx - ox) * 0.1;
        oy += (my - oy) * 0.1;
        outer.style.left = ox + 'px';
        outer.style.top  = oy + 'px';
        requestAnimationFrame(animOuter);
    })();
}

/* ── Grille hexagonale canvas ───────────────────────────── */
const canvas = document.getElementById('hex-canvas');
const ctx    = canvas.getContext('2d');

let W, H, hexes = [];
const HEX_SIZE = 38;
const HEX_GAP  = 4;

let mouseX = -9999, mouseY = -9999;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildHexes();
}

function hexPoly(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
}

function buildHexes() {
    hexes = [];
    const r = HEX_SIZE;
    const w = r * 2;
    const h = Math.sqrt(3) * r;
    const cols = Math.ceil(W / (w * 0.75)) + 2;
    const rows = Math.ceil(H / h) + 2;

    for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
            const offset = (col % 2) * (h / 2);
            hexes.push({
                x: col * w * 0.75,
                y: row * h + offset,
                phase: Math.random() * Math.PI * 2,
                speed: 0.003 + Math.random() * 0.004,
                pulse: 0
            });
        }
    }
}

function animHex() {
    ctx.clearRect(0, 0, W, H);
    const now = Date.now();

    hexes.forEach(h => {
        const dx = h.x - mouseX;
        const dy = h.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 180;
        const proximity = dist < maxDist ? 1 - dist / maxDist : 0;

        const breathe = (Math.sin(now * h.speed + h.phase) + 1) / 2;
        const alpha = 0.025 + breathe * 0.018 + proximity * 0.14;

        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.lineWidth = proximity > 0.3 ? 0.8 : 0.4;
        hexPoly(h.x, h.y, HEX_SIZE - HEX_GAP);
        ctx.stroke();

        if (proximity > 0.5) {
            ctx.fillStyle = `rgba(168, 85, 247, ${proximity * 0.04})`;
            ctx.fill();
        }
    });

    requestAnimationFrame(animHex);
}

window.addEventListener('resize', resize);
resize();
animHex();

/* ── Nav scrolled ───────────────────────────────────────── */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
    updateActiveDot();
});

/* ── Floating nav dots ──────────────────────────────────── */
const sections = ['about', 'skills', 'projects', 'contact'];
const labels   = ['À propos', 'Compétences', 'Projets', 'Contact'];

const dotsContainer = document.createElement('nav');
dotsContainer.className = 'nav-dots';
dotsContainer.setAttribute('aria-label', 'Navigation sections');

sections.forEach((id, i) => {
    const a = document.createElement('a');
    a.className = 'nav-dot';
    a.href = `#${id}`;
    a.innerHTML = `<span class="nav-dot-label">${labels[i]}</span><span class="nav-dot-pip"></span>`;
    dotsContainer.appendChild(a);
});

document.body.appendChild(dotsContainer);

function updateActiveDot() {
    const scrollY = window.scrollY + window.innerHeight / 2;
    let active = 0;
    sections.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) active = i;
    });
    document.querySelectorAll('.nav-dot').forEach((d, i) => d.classList.toggle('active', i === active));
}

updateActiveDot();

/* ── Intersection observer ──────────────────────────────── */
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.section, .project-card').forEach(el => observer.observe(el));

/* ── Carousels ──────────────────────────────────────────── */
document.querySelectorAll('.card-carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const dots  = carousel.querySelectorAll('.dot');
    const imgs  = carousel.querySelectorAll('img');
    if (!imgs.length) return;
    let cur = 0;

    function goTo(i) {
        cur = (i + imgs.length) % imgs.length;
        track.style.transform = `translateX(-${cur * 100}%)`;
        dots.forEach((d, j) => d.classList.toggle('active', j === cur));
    }

    carousel.querySelector('.prev')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); goTo(cur - 1); });
    carousel.querySelector('.next')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); goTo(cur + 1); });
    dots.forEach((d, i) => d.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); goTo(i); }));

    let sx = 0;
    carousel.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
        const diff = sx - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goTo(diff > 0 ? cur + 1 : cur - 1);
    });
});

/* ── Preview panel (Option C) ───────────────────────────── */
(function initPreview() {
    const rows        = document.querySelectorAll('.project-row');
    const panel       = document.querySelector('.preview-frame');
    const placeholder = document.getElementById('preview-placeholder');
    const navTitle    = document.getElementById('preview-nav-title');

    // Generate preview dots dynamically
    const dotsContainer = document.getElementById('preview-dots');
    const maxImgs = 3;
    for (let i = 0; i < maxImgs; i++) {
        const d = document.createElement('div');
        d.className = 'preview-dot';
        d.dataset.idx = i;
        dotsContainer?.appendChild(d);
    }
    const previewDots = document.querySelectorAll('.preview-dot');
    const prevBtn     = document.getElementById('preview-prev');
    const nextBtn     = document.getElementById('preview-next');

    if (!rows.length || !panel) return;

    let currentProject = -1;
    let currentImg     = 0;

    function showProject(projIdx) {
        currentProject = projIdx;
        currentImg     = 0;

        // Rows active state
        rows.forEach((r, i) => r.classList.toggle('active', i === projIdx));

        // Hide placeholder
        if (placeholder) placeholder.classList.add('hidden');
        panel.classList.add('lit');

        // Hide all slides & concept
        document.querySelectorAll('.preview-slide, .preview-concept').forEach(el => el.classList.remove('active'));

        // Show first image of this project
        showImg(projIdx, 0);

        // Nav title
        const title = rows[projIdx]?.querySelector('.row-title')?.textContent || '';
        if (navTitle) navTitle.textContent = title;

        // Update preview dots
        const slides = document.querySelectorAll(`.preview-slide[data-project="${projIdx}"]`);
        previewDots.forEach((d, i) => {
            d.style.display = i < slides.length ? 'block' : 'none';
            d.classList.toggle('active', i === 0);
        });
    }

    function showImg(projIdx, imgIdx) {
        document.querySelectorAll('.preview-slide, .preview-concept').forEach(el => el.classList.remove('active'));
        const target = document.querySelector(`.preview-slide[data-project="${projIdx}"][data-img="${imgIdx}"]`)
                    || document.querySelector(`.preview-concept[data-project="${projIdx}"]`);
        if (target) target.classList.add('active');

        currentImg = imgIdx;
        previewDots.forEach((d, i) => d.classList.toggle('active', i === imgIdx));
    }

    function getImgCount(projIdx) {
        return document.querySelectorAll(`.preview-slide[data-project="${projIdx}"]`).length;
    }

    // Row hover / click
    rows.forEach((row, i) => {
        row.addEventListener('mouseenter', () => showProject(i));
        row.addEventListener('click',      () => showProject(i));
    });

    // Prev / Next buttons
    prevBtn?.addEventListener('click', () => {
        if (currentProject < 0) return;
        const count = getImgCount(currentProject);
        if (!count) return;
        showImg(currentProject, (currentImg - 1 + count) % count);
    });

    nextBtn?.addEventListener('click', () => {
        if (currentProject < 0) return;
        const count = getImgCount(currentProject);
        if (!count) return;
        showImg(currentProject, (currentImg + 1) % count);
    });

    // Dot clicks
    previewDots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            if (currentProject < 0) return;
            showImg(currentProject, i);
        });
    });
})();

/* ── Language switcher ──────────────────────────────────── */
document.addEventListener("DOMContentLoaded", function() {
    const btn      = document.getElementById("lang-btn");
    const dropdown = document.getElementById("lang-dropdown");
    if (!btn || !dropdown) return;

    btn.addEventListener("click", function(e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle("open");
        btn.classList.toggle("open", isOpen);
    });

    document.addEventListener("click", function() {
        dropdown.classList.remove("open");
        btn.classList.remove("open");
    });
});