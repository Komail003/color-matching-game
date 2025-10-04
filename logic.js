// Utilities
const el = (id) => document.getElementById(id);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rgbToCss = (r, g, b) => `rgb(${r}, ${g}, ${b})`;
const distanceRGB = (a, b) => {
  // Euclidean distance in RGB
  const dr = a.r - b.r,
    dg = a.g - b.g,
    db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

// Elements
const targetSwatch = el("targetSwatch");
const mixSwatch = el("mixSwatch");
const rRange = el("rRange");
const gRange = el("gRange");
const bRange = el("bRange");
const rNum = el("rNum");
const gNum = el("gNum");
const bNum = el("bNum");
const newBtn = el("newBtn");
const submitBtn = el("submitBtn");
const nextBtn = el("nextBtn");
const roundEl = el("round");
const scoreEl = el("score");
const distEl = el("distance");
const bestEl = el("best");
const hintBtn = el("hintBtn");
const difficultySel = el("difficulty");

// State
let target = { r: 180, g: 90, b: 220 };
let round = 1;
let bestScore = null;
let lastDistance = null;

function setMixColor(r, g, b) {
  mixSwatch.style.background = rgbToCss(r, g, b);
  rRange.value = r;
  gRange.value = g;
  bRange.value = b;
  rNum.value = r;
  gNum.value = g;
  bNum.value = b;
}

function setTargetColor(r, g, b) {
  target = { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  targetSwatch.style.background = rgbToCss(target.r, target.g, target.b);
}

function randomColor(diff) {
  // difficulty: 1 easy (wide gap), 2 medium, 3 hard (closer colors)
  // We'll pick a color randomly; no need to be related to current mix.
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return { r, g, b };
}

function computeScore(dist) {
  // dist ranges 0..~441. Map to 0..1000 points
  const maxDist = Math.sqrt(255 * 255 * 3);
  const score = Math.round((1 - clamp(dist / maxDist, 0, 1)) * 1000);
  return score;
}

function checkMatch() {
  const mix = { r: +rNum.value, g: +gNum.value, b: +bNum.value };
  const dist = distanceRGB(mix, target);
  const score = computeScore(dist);
  lastDistance = Math.round(dist * 100) / 100;
  scoreEl.textContent = score;
  distEl.textContent = lastDistance;
  if (bestScore === null || score > bestScore) bestScore = score;
  bestEl.textContent = bestScore;

  // Visual feedback: border glow
  mixSwatch.style.boxShadow = `0 0 0 4px rgba(0,0,0,0.25), 0 0 18px ${
    score > 800 ? "rgba(124,58,237,0.6)" : "rgba(0,0,0,0.0)"
  } `;

  // Show a short animation
  submitBtn.disabled = true;
  setTimeout(() => (submitBtn.disabled = false), 700);

  return { score, dist };
}

// Sync range & number inputs
function syncFromRange(e) {
  const id = e.target.id.replace("Range", "");
  const val = +e.target.value;
  el(id + "Num").value = val;
  updateMixSwatch();
}
function syncFromNum(e) {
  const id = e.target.id.replace("Num", "");
  let val = +e.target.value;
  val = clamp(Math.round(val || 0), 0, 255);
  el(id + "Num").value = val;
  el(id + "Range").value = val;
  updateMixSwatch();
}

function updateMixSwatch() {
  const r = +rNum.value,
    g = +gNum.value,
    b = +bNum.value;
  mixSwatch.style.background = rgbToCss(r, g, b);
}

// Events
rRange.addEventListener("input", syncFromRange);
gRange.addEventListener("input", syncFromRange);
bRange.addEventListener("input", syncFromRange);
rNum.addEventListener("change", syncFromNum);
gNum.addEventListener("change", syncFromNum);
bNum.addEventListener("change", syncFromNum);

newBtn.addEventListener("click", () => {
  const diff = +difficultySel.value;
  const c = randomColor(diff);
  setTargetColor(c.r, c.g, c.b);
  round = 1;
  roundEl.textContent = round;
  scoreEl.textContent = "—";
  distEl.textContent = "—";
});

submitBtn.addEventListener("click", () => {
  const res = checkMatch();
  // Slight feedback message
  if (res.score >= 980) {
    alert("Perfect or near-perfect match! Well done!");
  } else if (res.score >= 800) {
    alert("Great match!");
  } else if (res.score >= 500) {
    alert("Not bad — try refining a bit.");
  } else {
    alert("Keep trying — move the sliders to approach the target.");
  }
});

nextBtn.addEventListener("click", () => {
  round += 1;
  roundEl.textContent = round;
  // new target each round but keep difficulty
  const diff = +difficultySel.value;
  const c = randomColor(diff);
  setTargetColor(c.r, c.g, c.b);
  // reset mix
  setMixColor(128, 128, 128);
  scoreEl.textContent = "—";
  distEl.textContent = "—";
});

hintBtn.addEventListener("click", () => {
  const diff = +difficultySel.value;
  // cost: easy free, medium small, hard costs more
  const cost = diff === 1 ? 0 : diff === 2 ? 50 : 120;
  const mix = { r: +rNum.value, g: +gNum.value, b: +bNum.value };
  const distBefore = distanceRGB(mix, target);
  // reveal one channel randomly
  const channels = ["r", "g", "b"];
  const choice = channels[Math.floor(Math.random() * 3)];
  if (choice === "r")
    alert(
      "Hint — Target R: " +
        target.r +
        (cost ? ` (cost ${cost} points)` : "")
    );
  if (choice === "g")
    alert(
      "Hint — Target G: " +
        target.g +
        (cost ? ` (cost ${cost} points)` : "")
    );
  if (choice === "b")
    alert(
      "Hint — Target B: " +
        target.b +
        (cost ? ` (cost ${cost} points)` : "")
    );
  // apply cost to bestScore if exists
  if (cost && bestScore !== null) {
    bestScore = Math.max(0, bestScore - cost);
    bestEl.textContent = bestScore;
  }
});

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitBtn.click();
  if (e.key === "n") nextBtn.click();
  if (e.key === "r") newBtn.click();
});

// Init
setTargetColor(
  Math.floor(Math.random() * 256),
  Math.floor(Math.random() * 256),
  Math.floor(Math.random() * 256)
);
setMixColor(128, 128, 128);
roundEl.textContent = round;
bestEl.textContent = bestScore === null ? "—" : bestScore;
