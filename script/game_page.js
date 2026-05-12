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
const difficultyBPM = { 1: 70, 2: 100, 3: 130, 4: 160, 5: 190 };

// Game State with defult values
let gameState = {
  isPlaying: false, score: 0, combo: 0, maxCombo: 0,
  accuracyCounts: { perfect: 0, great: 0, good: 0, bad: 0, miss: 0 },
  activeNotes: [],
  noteEvents: [],
  startTimer: null,
  bpm: 130,
  difficulty: 3
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
  return difficultyBPM[star] ?? 130;
};

// Get beatmap's filepath ID
let params = parseURLParams();
let song = getBeatmapData(params.id);
if (!song) { song = beatmaps[0]; }

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
  gameState.noteEvents = generateNoteEvents(gameState.bpm, gameState.difficulty, audio.duration); //dynamic
  console.log("Generated", gameState.noteEvents.length, "notes");
  console.log(gameState.noteEvents); // first 10 notes
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
    step = Math.round((beatinterval / 4) * 100) / 100;
    spawnChance = 0.6;
    maxLane = 7;
  }
  else if (difficulty == 4) {
    step = Math.round((beatinterval / 8) * 100) / 100;
    spawnChance = 0.7;
    maxLane = 9;
  }
  else if (difficulty == 5) {
    step = Math.round((beatinterval / 16) * 100) / 100;
    spawnChance = 0.8;
    maxLane = 9;
  }

  let notes = [];
  for (let t = 0; t < duration; t += step) {
    t = Math.round(t * 100) / 100;
    if (Math.random() < spawnChance) {
      let lane = Math.floor(Math.random() * maxLane);
      notes.push({ time: t, lane: lane });
    }
  }
  return notes;
}