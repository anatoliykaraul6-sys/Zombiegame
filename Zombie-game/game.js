const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= PLAYER =================
const player = {
    x: canvas.width / 2,
    y: canvas.height - 70,
    size: 30,
    speed: 7
};

let score = 0;
let wave = 1;
let weapon = "ak";

let zombies = [];
let bullets = [];
let allyBullets = [];
let keys = {};

// ================= ALLY =================
let ally = {
    active: false,
    x: 0,
    y: 0
};

// ================= WEAPONS =================
const weapons = {
    ak: { dmg: 2, fireRate: 500, bullets: 1, size: 5 },
    sniper: { dmg: 20, fireRate: 1200, bullets: 1, size: 8 },
    shotgun: { dmg: 5, fireRate: 900, bullets: 5, size: 6 },
    minigun: { dmg: 100, fireRate: 100, bullets: 1, size: 12 }
};

// ================= CONTROLS =================
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ================= SHOP =================
function openShop() {
    document.getElementById("shop").style.display = "block";
}

function closeShop() {
    document.getElementById("shop").style.display = "none";
}

function buyWeapon(w) {
    if (w === "sniper" && score >= 200) score -= 200;
    if (w === "shotgun" && score >= 300) score -= 300;
    if (w === "minigun" && score >= 1000) score -= 1000;

    weapon = w;
    document.getElementById("weapon").innerText = w;

    updateFireRate();
    closeShop();
}

function buyAlly() {
    if (score >= 67 && !ally.active) {
        score -= 67;
        ally.active = true;
        document.getElementById("score").innerText = score;
        closeShop();
    }
}

// ================= ZOMBIES =================
function spawnZombie(isBoss = false) {
    zombies.push({
        x: Math.random() * (canvas.width - 60),
        y: -60,
        size: isBoss ? 90 : 30,
        hp: isBoss ? 10 : 2,
        maxHp: isBoss ? 10 : 2,
        speed: isBoss ? 1 : 1.5 + wave * 0.1,
        boss: isBoss,
        phase: 1
    });
}

// ================= WAVES =================
function nextWave() {
    wave++;
    document.getElementById("wave").innerText = wave;

    for (let i = 0; i < 5; i++) spawnZombie(false);

    if (wave % 5 === 0) spawnZombie(true);
}

// ================= PLAYER SHOOT =================
function shoot() {
    const w = weapons[weapon];

    for (let i = 0; i < w.bullets; i++) {
        bullets.push({
            x: player.x + player.size / 2,
            y: player.y,
            speed: 10,
            dmg: w.dmg,
            size: w.size,
            spread: (Math.random() - 0.5) * 8
        });
    }
}

// auto shoot
let shootLoop = setInterval(shoot, 500);

function updateFireRate() {
    clearInterval(shootLoop);
    shootLoop = setInterval(shoot, weapons[weapon].fireRate);
}

// ================= ALLY SHOOT =================
function allyShoot() {
    if (!ally.active) return;

    zombies.forEach(z => {
        if (Math.random() < 0.08 && Math.abs(z.x - ally.x) < 350) {
            allyBullets.push({
                x: ally.x + 15,
                y: ally.y,
                target: z,
                speed: 6,
                size: 4
            });
        }
    });
}

setInterval(allyShoot, 500);

// ================= COLLISIONS =================
function checkHits() {
    bullets.forEach((b, bi) => {
        zombies.forEach(z => {
            if (
                b.x < z.x + z.size &&
                b.x + b.size > z.x &&
                b.y < z.y + z.size &&
                b.y + b.size > z.y
            ) {
                z.hp -= b.dmg;
                bullets.splice(bi, 1);
            }
        });
    });

    zombies = zombies.filter(z => {
        if (z.hp <= 0) {
            score += z.boss ? 10 : 5;
            document.getElementById("score").innerText = score;

            if (score % 10 === 0) openShop();
            return false;
        }
        return true;
    });
}

// ================= UPDATE =================
function update() {

    // movement
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));

    // player bullets
    bullets.forEach(b => {
        b.y -= b.speed;
        b.x += b.spread * 0.01;
    });

    bullets = bullets.filter(b => b.y > 0);

    // ally bullets
    allyBullets.forEach(b => {
        if (b.target) {
            let dx = b.target.x - b.x;
            let dy = b.target.y - b.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            b.x += (dx / dist) * b.speed;
            b.y += (dy / dist) * b.speed;

            if (
                b.x < b.target.x + b.target.size &&
                b.x + b.size > b.target.x &&
                b.y < b.target.y + b.target.size &&
                b.y + b.size > b.target.y
            ) {
                b.target.hp -= 1;
                b.target = null;
            }
        }
    });

    allyBullets = allyBullets.filter(b => b.target);

    // zombies
    zombies.forEach(z => z.y += z.speed);

    zombies = zombies.filter(z => z.y < canvas.height + 50);

    checkHits();

    if (zombies.length === 0) nextWave();

    draw();
    requestAnimationFrame(update);
}

// ================= DRAW =================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // player
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // gun
    ctx.fillStyle = "white";
    ctx.fillRect(player.x + 10, player.y - 10, 10, 15);

    // ally
    if (ally.active) {
        ally.x = player.x + 50;
        ally.y = player.y;

        ctx.fillStyle = "orange";
        ctx.fillRect(ally.x, ally.y, 25, 25);

        // gun
        ctx.fillStyle = "black";
        ctx.fillRect(ally.x + 18, ally.y + 8, 20, 5);
        ctx.fillStyle = "gray";
        ctx.fillRect(ally.x + 35, ally.y + 9, 10, 3);

        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.fillText("ALLY", ally.x, ally.y - 10);
    }

    // player bullets
    bullets.forEach(b => {
        ctx.fillStyle = "yellow";
        ctx.fillRect(b.x, b.y, b.size, b.size);
    });

    // ally bullets
    allyBullets.forEach(b => {
        ctx.fillStyle = "orange";
        ctx.fillRect(b.x, b.y, b.size, b.size);
    });

    // zombies
    zombies.forEach(z => {
        ctx.fillStyle = z.boss ? "red" : "green";
        ctx.fillRect(z.x, z.y, z.size, z.size);

        if (z.boss) {
            ctx.fillStyle = "white";
            ctx.font = "18px Arial";
            ctx.textAlign = "center";
            ctx.fillText("ANATOLII", z.x + z.size / 2, z.y - 20);

            let ratio = z.hp / z.maxHp;
            ctx.fillStyle = "black";
            ctx.fillRect(z.x, z.y - 15, 80, 8);
            ctx.fillStyle = "lime";
            ctx.fillRect(z.x, z.y - 15, 80 * ratio, 8);
        }
    });
}

// START
nextWave();
updateFireRate();
update();