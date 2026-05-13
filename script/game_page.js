// Hardcoded Beatmaps & BPM lookup
const beatmaps = [
  {
    id: 1, title: "tuki - ZERO",
    filePath: "./assets/songs/tuki - ZERO.webm"
  },
  {
    id: 2, title: "tuki - HYURURIRAPAPPA",
    filePath: "./assets/songs/tuki - HYURURIRAPAPPA.webm"
  },
  {
    id: 3, title: "He's a Pirate",
    filePath: "./assets/songs/He's a Pirate.webm"
  },
  {
    id: 4, title: "Gravity Falls",
    filePath: "./assets/songs/Gravity Falls opening theme.webm"
  },
  {
    id: 5, title: "BURNOUT SYNDROMES - Hikariare",
    filePath: "./assets/songs/BURNOUT SYNDROMES - Hikariare.webm"
  },
  {
    id: 6, title: "Binks no Sake",
    filePath: "./assets/songs/Binks no Sake.webm"
  },
];
// difficultyBPM maps star rating (1-5) to beats per minute
const difficultyBPM = { 1: 60, 2: 80, 3: 100, 4: 120, 5: 140 };

// Game State with defult values
let gameState = {
  isPlaying: false, score: 0, combo: 0, maxCombo: 0,
  accuracyCounts: { perfect: 0, great: 0, good: 0, bad: 0, miss: 0 },
  activeNotes: [],
  noteEvents: [],
  startTimer: null,
  bpm: 120,
  difficulty: 3,
  maxLanes: 7
};

// song ID and star rating from URL
function parseURLParams() {
  let p = new URLSearchParams(window.location.search)
  let id = parseInt(p.get("id") || 1);
  let star = parseInt(p.get("star") || 3);
  return { id, star };
}

// Return beatmap object by ID
function getBeatmapData(id) {
  let result = beatmaps.find(function (beatmap) {
    return beatmap.id === id;
  })
  return result;
};

// Convert star rating to BPM, with fallback
function getBPM(star) {
  return difficultyBPM[star] ?? 100;
};

// Get beatmap's filepath ID
let params = parseURLParams();
let song = getBeatmapData(params.id);
if (!song) song = beatmaps[0];

const audio = document.getElementById("game-audio");

// Updating Game State
audio.src = song.filePath;
gameState.bpm = getBPM(params.star);
gameState.difficulty = params.star;

// Audio Event Listner
audio.addEventListener('canplaythrough', function () {
  console.log('Audio ready');
});
audio.addEventListener('error', function (e) {
  console.error('Audio error:', e);
});

// Start key Event listner
window.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !gameState.isPlaying) {
    e.preventDefault();
    document.getElementById("start-message").style.display = "none";
    gameState.isPlaying = true;

    audio.play();
    startGameLoop();
  }
});

// Game logic - Run till audio ends.
function startGameLoop() {
  console.log("Game loop started");

  gameState.noteEvents = generateNoteEvents(gameState.bpm, gameState.difficulty, audio.duration);

  let fallDuration = getFallDuration(gameState.difficulty);
  let spawnIndex = 0;

  // Hides unusedLanes
  let maxLane = gameState.maxLanes;
  for (let i = maxLane; i <= 8; i += 1) {
    let laneEl = document.getElementById("lane_" + i);
    laneEl.style.display = "none";
  }

  function loop() {
    if (!gameState.isPlaying) return;

    let currentTime = audio.currentTime;

    while (spawnIndex < gameState.noteEvents.length &&
      gameState.noteEvents[spawnIndex].time <= currentTime + fallDuration) {
      let noteData = gameState.noteEvents[spawnIndex];
      spawnNoteElement(noteData);
      spawnIndex++;
    }

    moveActiveNotes(currentTime, fallDuration);

    if (audio.ended && gameState.activeNotes.length === 0) {
      gameState.isPlaying = false;
      console.log("Game loop ended.")
      return;
    }
    requestAnimationFrame(loop); // NextFrame
  }
  requestAnimationFrame(loop); // Start
}

// Note Generation Algorithm/Event
function generateNoteEvents(bpm, difficulty, duration) {
  let beatinterval = 60 / bpm;
  let step, spawnChance, maxLane;
  if (difficulty == 1) {
    step = Math.round(beatinterval * 100) / 100;
    spawnChance = 0.5;
    maxLane = 4;
  }
  else if (difficulty == 2) {
    step = Math.round((beatinterval / 2) * 100) / 100;
    spawnChance = 0.5;
    maxLane = 5;
  }
  else if (difficulty == 3) {
    step = Math.round((beatinterval / 2) * 100) / 100;
    spawnChance = 0.6;
    maxLane = 7;
  }
  else if (difficulty == 4) {
    step = Math.round((beatinterval / 3) * 100) / 100;
    spawnChance = 0.6;
    maxLane = 9;
  }
  else if (difficulty == 5) {
    step = Math.round((beatinterval / 3) * 100) / 100;
    spawnChance = 0.7;
    maxLane = 9;
  }

  gameState.maxLanes = maxLane;

  let notes = [];
  for (let t = 0; t < duration; t += step) {
    t = Math.round(t * 100) / 100;
    if (Math.random() < spawnChance && t >= 1.5) {
      let lane = Math.floor(Math.random() * maxLane);
      notes.push({ time: t, lane: lane });
    }
  }
  return notes;
}

function getFallDuration(difficulty) {
  if (difficulty == 1) return 1.5;
  else if (difficulty == 2) return 1.5;
  else if (difficulty == 3) return 1.3;
  else if (difficulty == 4) return 1.1;
  else if (difficulty == 5) return 1.0;
}

function spawnNoteElement(noteData) {
  let laneElement = document.getElementById("lane_" + noteData.lane);
  let noteElement = document.createElement("div");
  noteElement.className = "note";
  noteElement.style.top = "0%";
  laneElement.appendChild(noteElement);
  noteData.element = noteElement;
  gameState.activeNotes.push(noteData);
  console.log("spawn note:", noteData);
}

function moveActiveNotes(currentTime, fallDuration) {
  for (let i = gameState.activeNotes.length - 1; i >= 0; i--) {
    let noteData = gameState.activeNotes[i];
    let timeUntilHit = noteData.time - currentTime;
    let progress = 1 - (timeUntilHit / fallDuration);

    noteData.element.style.top = (progress * 100) + "%";

    if (timeUntilHit < -0.075) {
      let totalMiss = gameState.accuracyCounts.miss + 1;
      gameState.accuracyCounts.miss = totalMiss;
      noteData.element.remove();
      gameState.activeNotes.splice(i, 1);
    }
  }
}