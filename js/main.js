// ======================================
// ELEMENTS AND VARIABLES
// ======================================

const bombButton = document.getElementById("bombButton");
const countdown = document.getElementById("countdown");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const explosionScene = document.getElementById("explosionScene");

let width;
let height;

let countdownStarted = false;
let explosionStartedAt = null;

const fragments = [];
const fireParticles = [];
const smokeParticles = [];
const stars = [];

let earthTextureLoaded = false;

const earthTexture = new Image();
earthTexture.src = "./assets/earth.jpg";

earthTexture.onload = () => {
    earthTextureLoaded = true;
};

earthTexture.onerror = () => {
    console.error("Could not load Earth texture.");
};

bombButton.addEventListener("click", startCountdown);

// ======================================
// CANVAS AND STARS
// ======================================

function createStars() {
    stars.length = 0;

    for (let i = 0; i < 250; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.8,
            alpha: Math.random()
        });
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    width = canvas.width;
    height = canvas.height;

    createStars();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ======================================
// SPACE BACKGROUND
// ======================================

function drawSpace() {
    ctx.fillStyle = "#02040b";
    ctx.fillRect(0, 0, width, height);

    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
    });
}

// ======================================
// COUNTDOWN
// ======================================

function startCountdown() {
    if (countdownStarted) return;

    countdownStarted = true;

    bombButton.disabled = true;
    bombButton.style.opacity = "0.3";

    countdown.style.display = "flex";

    let number = 3;
    countdown.textContent = number;

    const timer = setInterval(() => {
        number--;

        if (number > 0) {
            countdown.textContent = number;
            return;
        }

        clearInterval(timer);
        countdown.textContent = "!";

        setTimeout(() => {
            countdown.style.display = "none";
            triggerExplosion();
        }, 500);

    }, 1000);
}

// ======================================
// CREATE EXPLOSION
// ======================================

function createExplosion() {
    const x = width / 2;
    const y = height / 2;
    const radius = Math.min(width, height) * 0.24;

    const fragmentColors = [
        "#e7a65d",
        "#c56e38",
        "#426d9a",
        "#244d75",
        "#d9b17b",
        "#172c4a"
    ];

    // Earth fragments
    for (let i = 0; i < 180; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * radius;

        fragments.push({
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,

            vx: Math.cos(angle) * (2 + Math.random() * 9),
            vy: Math.sin(angle) * (2 + Math.random() * 9),

            size: 2 + Math.random() * 9,

            color: fragmentColors[
                Math.floor(Math.random() * fragmentColors.length)
            ],

            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.15
        });
    }

    // Fire particles
    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;

        fireParticles.push({
            x,
            y,

            vx: Math.cos(angle) * (1 + Math.random() * 8),
            vy: Math.sin(angle) * (1 + Math.random() * 8),

            size: 2 + Math.random() * 8,
            life: 1
        });
    }
}

// ======================================
// CREATE SMOKE
// ======================================

function createSmoke() {
    const x = width / 2;
    const y = height / 2;
    const radius = Math.min(width, height) * 0.24;

    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;

        smokeParticles.push({
            x: x + Math.cos(angle) * radius * 0.7,
            y: y + Math.sin(angle) * radius * 0.7,

            vx: Math.cos(angle) * (1 + Math.random() * 3),
            vy: Math.sin(angle) * (1 + Math.random() * 3),

            size: 20 + Math.random() * 55,
            life: 1,
            growth: 0.5 + Math.random() * 1.5
        });
    }
}

// ======================================
// EXPLOSION SOUND
// ======================================

function playExplosionSound() {
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    const audioContext = new AudioContextClass();
    const now = audioContext.currentTime;

    // Deep impact
    const thud = audioContext.createOscillator();
    const thudGain = audioContext.createGain();

    thud.type = "sine";

    thud.frequency.setValueAtTime(65, now);
    thud.frequency.exponentialRampToValueAtTime(22, now + 1.2);

    thudGain.gain.setValueAtTime(1, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    thud.connect(thudGain);
    thudGain.connect(audioContext.destination);

    thud.start(now);
    thud.stop(now + 1.5);

    // Explosive noise
    const bufferSize = audioContext.sampleRate * 3;

    const buffer = audioContext.createBuffer(
        1,
        bufferSize,
        audioContext.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(35, now + 2.5);

    const boomGain = audioContext.createGain();

    boomGain.gain.setValueAtTime(0.9, now + 0.1);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

    noise.connect(filter);
    filter.connect(boomGain);
    boomGain.connect(audioContext.destination);

    noise.start(now + 0.1);
    noise.stop(now + 3.1);
}

// ======================================
// TRIGGER EXPLOSION
// ======================================

function triggerExplosion() {
    explosionScene.style.display = "block";
    bombButton.style.display = "none";

    explosionStartedAt = performance.now();

    createExplosion();
    createSmoke();
    playExplosionSound();
}

// ======================================
// DRAW EARTH
// ======================================

function drawEarth() {
    const elapsed = explosionStartedAt === null
        ? 0
        : (performance.now() - explosionStartedAt) / 1000;

    const x = width / 2;
    const y = height / 2;
    const radius = Math.min(width, height) * 0.45;

    const shake = elapsed > 0.5 && elapsed < 3
        ? (Math.random() - 0.5) * 8
        : 0;

    const scale = elapsed > 3
        ? Math.max(0, 1 - (elapsed - 3) * 0.25)
        : 1;

    ctx.save();

    ctx.translate(x + shake, y);
    ctx.scale(scale, scale);

    if (earthTextureLoaded) {
        ctx.drawImage(
            earthTexture,
            -radius,
            -radius,
            radius * 2,
            radius * 2
        );
    } else {
        ctx.fillStyle = "#14518b";

        ctx.fillRect(
            -radius,
            -radius,
            radius * 2,
            radius * 2
        );
    }

    ctx.restore();
}

// ======================================
// SHOCKWAVE
// ======================================

function drawShockwave() {
    if (explosionStartedAt === null) return;

    const elapsed = (performance.now() - explosionStartedAt) / 1000;

    const x = width / 2;
    const y = height / 2;

    const baseRadius = Math.min(width, height) * 0.24;

    for (let i = 0; i < 3; i++) {
        const progress = Math.max(0, elapsed - i * 0.35) / 3;

        if (progress > 1) continue;

        const radius =
            baseRadius + progress * Math.max(width, height) * 0.9;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        ctx.strokeStyle =
            `rgba(255, ${100 - i * 20}, 25, ${0.65 * (1 - progress)})`;

        ctx.lineWidth = 18 * (1 - progress) + 2;
        ctx.stroke();
    }
}

// ======================================
// EARTH FRAGMENTS
// ======================================

function drawFragments() {
    fragments.forEach(fragment => {
        fragment.x += fragment.vx;
        fragment.y += fragment.vy;

        fragment.vx *= 0.994;
        fragment.vy *= 0.994;

        fragment.rotation += fragment.rotationSpeed;

        ctx.save();

        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(fragment.rotation);

        ctx.fillStyle = fragment.color;

        ctx.fillRect(
            -fragment.size / 2,
            -fragment.size / 2,
            fragment.size,
            fragment.size * 0.7
        );

        ctx.restore();
    });
}

// ======================================
// FIRE PARTICLES
// ======================================

function drawFireParticles() {
    fireParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.vx *= 0.985;
        particle.vy *= 0.985;

        particle.life -= 0.004;

        if (particle.life <= 0) return;

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size * particle.life,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(255, ${Math.floor(100 + 100 * particle.life)}, 20, ${particle.life})`;

        ctx.fill();
    });

    // Remove expired particles
    for (let i = fireParticles.length - 1; i >= 0; i--) {
        if (fireParticles[i].life <= 0) {
            fireParticles.splice(i, 1);
        }
    }
}

// ======================================
// SMOKE PARTICLES
// ======================================

function drawSmoke() {
    smokeParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.vx *= 0.995;
        particle.vy *= 0.995;

        particle.size += particle.growth;
        particle.life -= 0.0025;

        if (particle.life <= 0) return;

        const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size
        );

        gradient.addColorStop(
            0,
            `rgba(35, 29, 27, ${particle.life * 0.7})`
        );

        gradient.addColorStop(
            0.6,
            `rgba(65, 43, 34, ${particle.life * 0.4})`
        );

        gradient.addColorStop(
            1,
            "rgba(25, 20, 20, 0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    // Remove expired particles
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        if (smokeParticles[i].life <= 0) {
            smokeParticles.splice(i, 1);
        }
    }
}

// ======================================
// MAIN ANIMATION LOOP
// ======================================

function animate() {
    drawSpace();

    drawShockwave();
    drawEarth();

    drawFragments();
    drawFireParticles();
    drawSmoke();

    requestAnimationFrame(animate);
}

animate();