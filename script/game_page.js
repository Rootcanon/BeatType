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
  maxLanes: 7,
  totalPointsEarned: 0,
};

const KEY_TO_LANE = {
  'KeyA': 'lane_8',
  'KeyS': 'lane_6',
  'KeyD': 'lane_2',
  'KeyF': 'lane_0',
  'Space': 'lane_4',
  'KeyJ': 'lane_1',
  'KeyK': 'lane_3',
  'KeyL': 'lane_5',
  'Semicolon': 'lane_7'
};

// song ID and star rating from URL
function parseURLParams() {
  let p = new URLSearchParams(window.location.search)
  let id = parseInt(p.get("id") || 1);
  let star = parseInt(p.get("star") || 1);
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

// key Event listner
window.addEventListener("keydown", function (e) {
  if (gameState.isPlaying) {
    let laneID = KEY_TO_LANE[e.code];
    if (laneID) {
      console.log(e)
      e.preventDefault();
      handleKeyPress(laneID);
    }
  }

  else if (e.code === "Space" && !gameState.isPlaying) {
    e.preventDefault();
    document.getElementById("start-message").style.display = "none";
    gameState.isPlaying = true;

    audio.play();
    startGameLoop();
  }
});

function findClosestNote(laneId, currentTime) {
  let closestNote = null; // Note object
  let closestDelta = Infinity; // Least distance to bottem
  gameState.activeNotes.forEach(note => {
    if (note.laneId === laneId) {
      let delta = Math.abs(note.time - currentTime); // Current note’s distance
      if (delta < closestDelta && delta <= 0.100) {
        closestNote = note;
        closestDelta = delta;
      }
    }
  });
  return closestNote;
}

function handleKeyPress(laneID) {
  let currentTime = audio.currentTime;
  let note = findClosestNote(laneID, currentTime);
  if (note) judgeNote(note, currentTime);
}

function judgeNote(note, currentTime) {
  let delta = Math.abs(note.time - currentTime);
  let basepoints = 0;
  let judgment;
  if (delta <= 0.025) {
    gameState.accuracyCounts.perfect += 1;
    judgment = "perfect";
    basepoints = 300;
  }
  else if (delta <= 0.050) {
    gameState.accuracyCounts.great += 1;
    judgment = "great";
    basepoints = 200;
  }
  else if (delta <= 0.075) {
    gameState.accuracyCounts.good += 1;
    judgment = "good";
    basepoints = 100;
  }
  else if (delta <= 0.100) {
    gameState.accuracyCounts.bad += 1;
    judgment = "bad";
    basepoints = 50;
  }

  gameState.totalPointsEarned += basepoints;

  let hitScore = basepoints * (1 + gameState.combo / 100);
  gameState.score += hitScore;
  gameState.combo += 1;

  if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

  // remove from array
  let index = gameState.activeNotes.indexOf(note);
  if (index !== -1) gameState.activeNotes.splice(index, 1);

  // remove from DOM
  note.element.classList.add(judgment);
  setTimeout(() => {
    if (note.element) note.element.remove();
  }, 100);


  updateHUD();
}

function updateHUD() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('combo').textContent = gameState.combo;

  let totalHits = (gameState.accuracyCounts.perfect + gameState.accuracyCounts.great + gameState.accuracyCounts.good + gameState.accuracyCounts.bad + gameState.accuracyCounts.miss);
  let accuracy = totalHits > 0 ? Math.round((gameState.totalPointsEarned / (totalHits * 300)) * 100) : 100;
  document.getElementById('accuracy').textContent = accuracy + "%";
}

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
  noteElement.style.top = "0px";
  laneElement.appendChild(noteElement);
  noteData.element = noteElement;
  noteData.laneId = 'lane_' + noteData.lane;
  gameState.activeNotes.push(noteData);
  console.log("spawn note:", noteData);
}

function moveActiveNotes(currentTime, fallDuration) {
  for (let i = gameState.activeNotes.length - 1; i >= 0; i--) {
    let noteData = gameState.activeNotes[i];
    let timeUntilHit = noteData.time - currentTime;
    let progress = 1 - (timeUntilHit / fallDuration);
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    
    let laneElement = document.getElementById(noteData.laneId);
    let travelHeight = laneElement.clientHeight - 60;
    noteData.element.style.top = (progress * travelHeight) + "px";

    if (timeUntilHit < -0.075) {
      gameState.accuracyCounts.miss += 1;
      gameState.combo = 0;
      noteData.element.remove();
      gameState.activeNotes.splice(i, 1);
      updateHUD();
    }
  }
}