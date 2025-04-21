const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const characterImages = [];
const characterHitImages = [];
const numberOfCharacters = 19;
const characterSpeed = 1;
const characterHeight = 50;
const safeBottomMargin = canvas.height * 0.1;

const eggImage = new Image();
const weapon2Image = new Image();
eggImage.src = 'images/egg.png';
weapon2Image.src = 'images/weapon2.png';
const eggThrowerImage = new Image();
eggThrowerImage.src = 'images/eggthrower.png';
const weapon1Image = new Image();
weapon1Image.src = 'images/weapon1.png';
const weapon3Images = [];
for (let i = 1; i <= 5; i++) {
    const img = new Image();
    img.src = `images/weapons/weapon3-${i}.png`;
    weapon3Images.push(img);
}
const eggThrowerWidth = 50;
const eggThrowerHeight = 50;
const eggThrowerX = canvas.width / 2 - eggThrowerWidth / 2;
const eggThrowerY = canvas.height - safeBottomMargin - eggThrowerHeight;
const eggSpeed = 5;
const eggs = [];
let eggCooldownDuration = 1000;
const weapon1CooldownMultiplier = 1;
let lastEggTime = 0;

const characters = [];
let spawnInterval = 1000;
let lastSpawnTime = 0;

// Scoring and Leveling
let score = 0;
let level = 1;
const scoreDisplayX = 120;
const scoreDisplayY = canvas.height - 50;
const levelDisplayX = 120;
const levelDisplayY = canvas.height - 30;
const levelUpThreshold = 10;
let hitCountForLevel = 0;

const characterWinImages = [];
let survivedEnemies = 0;
const survivedDisplayX = 20;
const survivedDisplayY = 30;

// Weapons
const weaponSlotsDiv = document.getElementById('weaponSlots');
const weapon1Element = document.getElementById('weapon1');
const weapon2Element = document.getElementById('weapon2');
const weapon3Element = document.getElementById('weapon3');
const weaponUnlockLevels = {
    weapon1: 10,
    weapon2: 20,
    weapon3: 30
};
let currentWeapon = 'egg';

// Weapon 2 variables
let weapon2Active = false;
let weapon2ActiveEgg = null;
let weapon2CooldownTimer = 0;
const weapon2Duration = 30000;
const weapon2Cooldown = 120000;
let lastWeapon2UseTime = 0;

// Weapon 3 variables
const weapon3Count = 10;
let weapon3Active = false;
let weapon3CooldownTimer = 0;
const weapon3CooldownDuration = 20000;
let lastWeapon3UseTime = 0;

// Booster variables
const boosterElement = document.getElementById('booster');
const boosterImages = ['images/booster1.png', 'images/booster2.png'];
let boosterActive = false;
let currentBoosterImageIndex = 0;
const boosterSound = new Audio('pumpaj.mp3');

// Load background image
const backgroundImage = new Image();
backgroundImage.src = 'images/bg.png';

// Load character images
for (let i = 1; i <= numberOfCharacters; i++) {
    const img = new Image();
    img.src = `images/caci${i}.png`;
    characterImages.push(img);
}

// Load character hit images
for (let i = 1; i <= numberOfCharacters; i++) {
    const img = new Image();
    img.src = `images/caci${i}hit.png`;
    characterHitImages.push(img);
}

for (let i = 1; i <= numberOfCharacters; i++) {
    const img = new Image();
    img.src = `images/caci${i}pass.png`;
    characterWinImages.push(img);
}

class Character {
    constructor(x, y, imageIndex) {
        this.x = x;
        this.y = y;
        this.imageIndex = imageIndex;
        this.image = characterImages[imageIndex];
        this.width = this.image.width/7;
        this.height = this.image.height/7;
        this.isHit = false;
        this.hasSurvived = false;
        this.hitTimer = 0;
        this.disappearTime = 3000;
    }

    draw() {
        let currentImage = this.image;
        if (this.isHit && this.hitTimer < this.disappearTime) {
            currentImage = characterHitImages[this.imageIndex];
        } else if (this.hasSurvived) {
            currentImage = characterWinImages[this.imageIndex];
        }
        ctx.drawImage(currentImage, this.x, this.y, this.width, this.height);
    }

    update(deltaTime) {
        if (!this.isHit) {
            this.x += characterSpeed;
            if (!this.hasSurvived && this.x + this.width > canvas.width * 0.8) {
                this.hasSurvived = true;
                survivedEnemies++;
                this.hitTimer = 0;
            }
            if (this.hasSurvived) {
                this.hitTimer += deltaTime;
            }
        } else {
            this.hitTimer += deltaTime;
        }
    }
}

class Egg {
    constructor(x, y, targetX, targetY, angleOffset = 0) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.angleOffset = angleOffset;
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.velocityX = (dx / distance) * eggSpeed;
        this.velocityY = (dy / distance) * eggSpeed;
        this.width = 20;
        this.height = 20;
    }

    draw() {
        ctx.drawImage(eggImage, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
}

class WanderingWeapon {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.width = 70;
        this.height = 70;
        this.velocityX = (Math.random() - 0.5) * 15;
        this.velocityY = (Math.random() - 0.5) * 15;
        this.durationTimer = 0;
        this.directionChangeChance = 0.01;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Random chance to change direction
        if (Math.random() < this.directionChangeChance) {
            this.velocityX = (Math.random() - 0.5) * 15;
            this.velocityY = (Math.random() - 0.5) * 15;
        }

        // Keep within screen bounds
        if (this.x < 0 || this.x > canvas.width*0.8) {
            this.velocityX *= -1;
        }
        if (this.y < 0 || this.y > canvas.height - this.height) {
            this.velocityY *= -1;
        }

        this.durationTimer += deltaTime;
    }
}


function spawnCharacter() {
    const y = Math.random() * (canvas.height - safeBottomMargin - characterHeight);
    const imageIndex = Math.floor(Math.random() * numberOfCharacters);
    characters.push(new Character(0 - characterImages[imageIndex].width, y, imageIndex));
}

function drawEggThrower() {
    const throwerImage = level >= weaponUnlockLevels.weapon1 ? weapon1Image : eggThrowerImage;
    ctx.drawImage(throwerImage, eggThrowerX, eggThrowerY, eggThrowerWidth, eggThrowerHeight);
}

function handleEggThrow(event) {
    const currentTime = new Date().getTime();
    let currentCooldown = eggCooldownDuration;
    if (level >= weaponUnlockLevels.weapon1) {
        currentCooldown *= weapon1CooldownMultiplier;
    }

    if (currentTime - lastEggTime >= currentCooldown) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const startX = eggThrowerX + eggThrowerWidth / 2;
        const startY = eggThrowerY;

        if (level >= weaponUnlockLevels.weapon1) {
            // Weapon 1 (Triple Shot)
            const angleIncrement = Math.PI / 18;
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(clickY - startY, clickX - startX) + i * angleIncrement;
                const targetXOffset = startX + 100 * Math.cos(angle);
                const targetYOffset = startY + 100 * Math.sin(angle);
                eggs.push(new Egg(startX, startY, targetXOffset, targetYOffset));
            }
        } else {
            // Default Egg
            eggs.push(new Egg(startX, startY, clickX, clickY));
        }

        lastEggTime = currentTime;
    }
}

function checkCollisions() {
    for (let i = 0; i < eggs.length; i++) {
        const egg = eggs[i];
        for (let j = 0; j < characters.length; j++) {
            const character = characters[j];

            if (!character.isHit &&
                egg.x < character.x + character.width &&
                egg.x + egg.width > character.x &&
                egg.y < character.y + character.height &&
                egg.y + egg.height > character.y) {
                // Collision detected
                eggs.splice(i, 1);
                character.isHit = true;
                score += 1;
                hitCountForLevel++;
                if (hitCountForLevel >= levelUpThreshold) {
                    level++;
                    hitCountForLevel = 0;
                    updateWeaponAvailability();
                }
                break;
            }
        }
    }

    if (weapon2ActiveEgg) {
        for (let i = characters.length - 1; i >= 0; i--) {
            const character = characters[i];
            if (!character.isHit &&
                weapon2ActiveEgg.x < character.x + character.width &&
                weapon2ActiveEgg.x + weapon2ActiveEgg.width > character.x &&
                weapon2ActiveEgg.y < character.y + character.height &&
                weapon2ActiveEgg.y + weapon2ActiveEgg.height > character.y) {
                character.isHit = true;
                score += 1;
                hitCountForLevel++;
                if (hitCountForLevel >= levelUpThreshold) {
                    level++;
                    hitCountForLevel = 0;
                    updateWeaponAvailability();
                }
            }
        }
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 10;
    ctx.font = '24px Arial Black';
    ctx.textAlign = 'left';
    const bottomPadding = 50;
    const scoreYWithPadding = canvas.height - bottomPadding - 30;

    const text = score === 1 ? `${score} ćaci je otišao kući plačući` : `${score} ćacija je otišlo kući plačući`;

    ctx.strokeText(text, scoreDisplayX, scoreYWithPadding);
    ctx.fillText(text, scoreDisplayX, scoreYWithPadding);
}

function drawLevel() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial Black';
    ctx.textAlign = 'left';
    const text = `Nivo: ${level}`
    ctx.strokeText(text, levelDisplayX, levelDisplayY);
    ctx.fillText(text, levelDisplayX, levelDisplayY);
}

function updateWeaponAvailability() {
    if (level >= weaponUnlockLevels.weapon1) {
        weapon1Element.style.display = 'none';
    } else {
        weapon1Element.style.display = 'block';
        weapon1Element.addEventListener('click', selectWeapon1);
        weapon1Element.addEventListener('mouseover', showWeaponUnlockInfo.bind(null, weapon1Element, weaponUnlockLevels.weapon1));
        weapon1Element.addEventListener('mouseout', hideWeaponUnlockInfo.bind(null, weapon1Element));
    }

    if (level >= weaponUnlockLevels.weapon2) {
        weapon2Element.classList.add('unlocked');
        weapon2Element.addEventListener('click', toggleWeapon2);
        weapon2Element.addEventListener('mouseover', showWeaponUnlockInfo.bind(null, weapon2Element, weaponUnlockLevels.weapon2));
        weapon2Element.addEventListener('mouseout', hideWeaponUnlockInfo.bind(null, weapon2Element));
        if (weapon2CooldownTimer > 0) {
            weapon2Element.classList.remove('unlocked');
            weapon2Element.removeEventListener('click', toggleWeapon2);
            weapon2Element.style.opacity = 1;
            weapon2Element.style.filter = "grayscale(1)"
        } else {
            weapon2Element.style.opacity = 1;
            weapon2Element.style.filter = "grayscale(0)"
            weapon2Element.style.cursor = 'pointer';
        }
    } else {
        weapon2Element.classList.remove('unlocked');
        weapon2Element.removeEventListener('click', toggleWeapon2);
        weapon2Element.addEventListener('mouseover', showWeaponUnlockInfo.bind(null, weapon2Element, weaponUnlockLevels.weapon2));
        weapon2Element.addEventListener('mouseout', hideWeaponUnlockInfo.bind(null, weapon2Element));
        weapon2Element.style.opacity = 1;
    }

    if (level >= weaponUnlockLevels.weapon3) {
        weapon3Element.classList.add('unlocked');
        weapon3Element.addEventListener('click', toggleWeapon3);
        weapon3Element.addEventListener('mouseover', showWeaponUnlockInfo.bind(null, weapon3Element, weaponUnlockLevels.weapon3));
        weapon3Element.addEventListener('mouseout', hideWeaponUnlockInfo.bind(null, weapon3Element));
        if (weapon3CooldownTimer > 0) {
            weapon3Element.classList.remove('unlocked');
            weapon3Element.removeEventListener('click', toggleWeapon3);
            weapon3Element.style.opacity = 1;
            weapon3Element.style.filter = "grayscale(1)"
        } else {
            weapon3Element.style.opacity = 1;
            weapon3Element.style.filter = "grayscale(0)"
            weapon3Element.style.cursor = 'pointer';
        }
    } else {
        weapon3Element.classList.remove('unlocked');
        weapon3Element.removeEventListener('click', toggleWeapon3);
        weapon3Element.addEventListener('mouseover', showWeaponUnlockInfo.bind(null, weapon3Element, weaponUnlockLevels.weapon3));
        weapon3Element.addEventListener('mouseout', hideWeaponUnlockInfo.bind(null, weapon3Element));
        weapon3Element.style.opacity = 1;
    }
}

function selectWeapon1() {
    currentWeapon = 'weapon1';
    console.log('Weapon 1 selected');
}

function toggleWeapon2() {
    const currentTime = new Date().getTime();
    if (level >= weaponUnlockLevels.weapon2 && (weapon2ActiveEgg === null && currentTime - lastWeapon2UseTime >= weapon2Cooldown)) {
        weapon2Active = !weapon2Active;
        if (weapon2Active) {
            weapon2ActiveEgg = new WanderingWeapon(eggThrowerX + eggThrowerWidth / 2, eggThrowerY, weapon2Image);
            lastWeapon2UseTime = currentTime;
            weapon2CooldownTimer = weapon2Cooldown;
            weapon2Element.classList.remove('unlocked');
            weapon2Element.removeEventListener('click', toggleWeapon2);
            weapon2Element.style.opacity = 1;
            weapon2Element.style.filter = "grayscale(1)"
            console.log('Weapon 2 activated');
        } else {
            console.log('Weapon 2 deactivated');
        }
    }
}

function selectWeapon3() {
    currentWeapon = 'weapon3';
    console.log('Weapon 3 selected');
}

function toggleWeapon3() {
    const currentTime = new Date().getTime();
    if (level >= weaponUnlockLevels.weapon3 && currentTime - lastWeapon3UseTime >= weapon3CooldownDuration) {
        weapon3Active = true;
        lastWeapon3UseTime = currentTime;
        weapon3CooldownTimer = weapon3CooldownDuration;
        updateWeaponAvailability();
        fireWeapon3();
        console.log('Weapon 3 activated and fired');
    } else if (level >= weaponUnlockLevels.weapon3) {
        console.log(`Weapon 3 on cooldown. Time remaining: ${(weapon3CooldownTimer / 1000).toFixed(1)}s`);
    }
    currentWeapon = 'egg';
    weapon2Active = false;
}

function fireWeapon3() {
    const startX = eggThrowerX + eggThrowerWidth / 2;
    const startY = eggThrowerY;

    if (level >= weaponUnlockLevels.weapon3) {
        for (let i = 0; i < 10; i++) {
            const randomImageIndex = Math.floor(Math.random() * weapon3Images.length);
            eggs.push(new WanderingWeapon(startX, startY, weapon3Images[randomImageIndex]));
        }
    }
}

function toggleBooster() {
    boosterActive = !boosterActive;
    currentBoosterImageIndex = boosterActive ? 1 : 0;
    boosterElement.src = boosterImages[currentBoosterImageIndex];
    boosterSound.play();
    console.log('Booster toggled:', boosterActive);
}

function showWeaponUnlockInfo(element, unlockLevel) {
    const tooltip = document.createElement('div');
    tooltip.textContent = `Unlock at level ${unlockLevel}`;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'black';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '3px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '10';
    tooltip.style.bottom = '100%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    element.appendChild(tooltip);
}

function hideWeaponUnlockInfo(element) {
    const tooltip = element.querySelector('div');
    if (tooltip) {
        element.removeChild(tooltip);
    }
}

// Disable double-click zoom
canvas.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchTime = 0;
canvas.addEventListener('touchend', function(event) {
    const currentTime = new Date().getTime();
    const timeSinceLastTouch = currentTime - lastTouchTime;
    if (timeSinceLastTouch < 300 && event.touches.length === 0) {
        event.preventDefault();
    }
    lastTouchTime = currentTime;
}, false);

// Portrait orientation warning
function checkOrientation() {
    const warning = document.getElementById('orientationWarning');
    if (window.innerWidth < window.innerHeight) {
        if (!warning) {
            const warningDiv = document.createElement('div');
            warningDiv.id = 'orientationWarning';
            warningDiv.style.position = 'absolute';
            warningDiv.style.top = '50%';
            warningDiv.style.left = '50%';
            warningDiv.style.transform = 'translate(-50%, -50%)';
            warningDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            warningDiv.style.color = 'white';
            warningDiv.style.padding = '20px';
            warningDiv.style.borderRadius = '10px';
            warningDiv.style.fontSize = '1.5em';
            warningDiv.style.textAlign = 'center';
            warningDiv.textContent = 'Okrenite uredjaj horizontalno.';
            document.body.appendChild(warningDiv);
            canvas.style.display = 'none';
            weaponSlotsDiv.style.display = 'none';
        } else {
            warning.style.display = 'block';
            canvas.style.display = 'none';
            weaponSlotsDiv.style.display = 'none';
        }
    } else {
        if (warning) {
            warning.style.display = 'none';
            canvas.style.display = 'block';
            weaponSlotsDiv.style.display = 'flex';
        }
    }
}

let lastTime = 0;


function updateGame(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    if (weapon2CooldownTimer > 0) {
        weapon2CooldownTimer -= deltaTime;
        if (weapon2CooldownTimer <= 0) {
            weapon2CooldownTimer = 0;
            updateWeaponAvailability();
        }
    }

    if (weapon3CooldownTimer > 0) {
        weapon3CooldownTimer -= deltaTime;
        if (weapon3CooldownTimer <= 0) {
            weapon3CooldownTimer = 0;
            updateWeaponAvailability();
        }
    }

    // Control character spawning based on level
    const targetSpawnRate = level < 20 ? 1000 - (level - 1) * (1000 - 500) / 19 : 500;
    spawnInterval = targetSpawnRate;

    if (currentTime - lastSpawnTime >= spawnInterval) {
        spawnCharacter();
        lastSpawnTime = currentTime;
    }

    // Update and draw characters
    for (let i = characters.length - 1; i >= 0; i--) {
        const character = characters[i];
        character.update(deltaTime);
        character.draw();

        if ((character.isHit || character.hasSurvived) && character.hitTimer >= character.disappearTime) {
            characters.splice(i, 1);
        }
    }

    // Update and draw eggs
    eggs.forEach(egg => {
        egg.update();
        egg.draw();
    });

    if (weapon2ActiveEgg) {
        weapon2ActiveEgg.update(deltaTime);
        weapon2ActiveEgg.draw();
        if (weapon2ActiveEgg.durationTimer >= weapon2Duration) {
            weapon2ActiveEgg = null;
            weapon2Active = false;
        }
    }

    drawEggThrower();
    checkCollisions();
    drawScore();
    drawLevel();
    drawSurvived();

    requestAnimationFrame(updateGame);
}

function drawSurvived() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 10;
    ctx.font = '24px Arial Black';
    ctx.textAlign = 'left';
    let text;
    if (survivedEnemies === 0) {
        text = `Nijedan ćaci ne jede sendvič u ćacilendu`;
    } else if (survivedEnemies === 1) {
        text = `${survivedEnemies} ćaci jede sendvič u ćacilendu`;
    } else if (survivedEnemies > 1) {
        text = `${survivedEnemies} ćacija jedu sendvič u ćacilendu`;
    }

    ctx.strokeText(text, scoreDisplayX, survivedDisplayY);
    ctx.fillText(text, scoreDisplayX, survivedDisplayY);

}

// Event listeners
canvas.addEventListener('click', handleEggThrow);
boosterElement.addEventListener('click', toggleBooster);

// Initialize weapon availability and orientation check
updateWeaponAvailability();
checkOrientation();

// Start the game loop
requestAnimationFrame(updateGame);