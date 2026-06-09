// DOM Refrence Variables
const beatmapCardsContainer = document.getElementById("beatmap-cards");
const difficultyFilter = document.getElementById("difficulty-filter");
const sortFilter = document.getElementById("sort-filter");
const usernameInput = document.getElementById("username-input");
const audio = document.getElementById("game-audio");

// Global Data
const API_URL = "http://localhost:3000";
let allBeatmapsData = [];
let currentBeatmap = null;
let currentStar = 3;
let currentUsername = ""; // empty = show all players
const difficultyBPM = { 1: 60, 2: 80, 3: 100, 4: 120, 5: 140 };
let gameState = {
  isPlaying: false,
  score: 0,
  combo: 0,
  maxCombo: 0,
  accuracyCounts: { perfect: 0, great: 0, good: 0, bad: 0, miss: 0 },
  activeNotes: [],
  noteEvents: [],
  startTimer: null,
  bpm: 120,
  difficulty: 3,
  maxLanes: 7,
  totalPointsEarned: 0,
  offset: 0,
};
const KEY_TO_LANE = {
  KeyF: "lane_0",
  KeyJ: "lane_1",
  KeyD: "lane_2",
  KeyK: "lane_3",
  Space: "lane_4",
  KeyL: "lane_5",
  KeyS: "lane_6",
  Semicolon: "lane_7",
  KeyA: "lane_8",
};

// Wait for all DOMs to load Event Listner
document.addEventListener("DOMContentLoaded", () => {
  fetchBeatmaps();
  loadRecentScores();
});

// Filter Event Listener
difficultyFilter.addEventListener("change", applyFilters);

// Sort Event Listener
sortFilter.addEventListener("change", applyFilters);

// Audio Event Listner
audio.addEventListener("canplaythrough", function () {
  console.log("Audio ready");
});
audio.addEventListener("error", function (e) {
  console.error("Audio error:", e);
});

// key Event listner
window.addEventListener("keydown", function (e) {
  if (gameState.isPlaying) {
    let laneID = KEY_TO_LANE[e.code];
    if (laneID) {
      e.preventDefault();
      handleKeyPress(laneID);
    }
  } else if (
    e.code === "Space" &&
    !gameState.isPlaying &&
    document.getElementById("start-message").style.display === "flex"
  ) {
    e.preventDefault();
    document.getElementById("start-message").style.display = "none";
    gameState.isPlaying = true;

    audio.play();
    startGameLoop();
  }
});

// Back to Menu btn
document.getElementById("btn-menu").addEventListener("click", function () {
  window.location.href = "index.html";
});
// Restart btn - new
document.getElementById("btn-restart").addEventListener("click", function () {
  if (currentBeatmap) {
    startGame(currentBeatmap, currentStar);
  }
});

// Prevent form submition
document
  .getElementById("score-submission")
  .addEventListener("submit", function (e) {
    e.preventDefault();
  });

// Score Submit Event listener
document.getElementById("btn-submit-score").addEventListener("click", () => {
  // hide result
  document.querySelector(".result").style.display = "none";
  document.querySelector(".result-breakdown").style.display = "none";
  document.getElementById("btns").style.display = "none";

  // Show form
  const form = document.getElementById("score-submission");
  form.style.display = "flex";
  form.hidden = false;
  document.getElementById("player-name").value = "";

  document.getElementById("submitted-score").value = gameState.score;
  document.getElementById("submitted-combo").value = gameState.maxCombo;
  document.getElementById("submitted-accuracy").value =
    document.getElementById("final-accuracy").textContent;
  document.getElementById("submitted-difficulty").value = currentStar;
  document.getElementById("submitted-song").value = currentBeatmap
    ? currentBeatmap.title
    : "";
  document.getElementById("submitted-date").value = new Date().toISOString();

  document.getElementById("name-error").textContent = "";
  document.getElementById("submit-error").textContent = "";
});

// Cancel submission – go back to stats
document.getElementById("cancel-submit-btn").addEventListener("click", () => {
  // hide form
  document.getElementById("score-submission").style.display = "none";

  // Show result
  document.querySelector(".result").style.display = "flex";
  document.querySelector(".result-breakdown").style.display = "flex";
  document.getElementById("btns").style.display = "flex";
});

// Input Username Event Listner
usernameInput.addEventListener("change", () => {
  currentUsername = usernameInput.value.trim();
  loadRecentScores();
});

// ------ Beatmap fetching & rendering functions ------
// Loading and Error for Beatmap cards
function showLoading() {
  beatmapCardsContainer.textContent = "loading beatmaps...";
}
function showError(message) {
  beatmapCardsContainer.textContent = message;
}

// Fetch data from JSON server
async function fetchBeatmaps() {
  showLoading();
  try {
    const response = await fetch(API_URL + "/beatmaps");
    if (!response.ok) throw new Error("Server Error");
    allBeatmapsData = await response.json();
    applyFilters();
  } catch (error) {
    showError("Failed to load beatmaps.");
  }
}

// Filter for Beatmap Cards
function applyFilters() {
  let selected = difficultyFilter.value;
  let filtered;
  if (selected === "all") filtered = allBeatmapsData;
  else {
    let star = parseInt(selected);
    filtered = allBeatmapsData.filter((beatmap) =>
      beatmap.difficulties.includes(star),
    );
  }
  if (sortFilter.value === "name-asc") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortFilter.value === "name-desc") {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  }
  renderBeatmaps(filtered);
}

// Render Beatmap Cards (Create & Render)
function renderBeatmaps(cardData) {
  beatmapCardsContainer.innerHTML = "";

  cardData.forEach((element) => {
    const card = document.createElement("div");
    card.className = "beatmap-card";

    const title = document.createElement("h3");
    title.textContent = element.title;

    const controls = document.createElement("div");
    controls.className = "card-controls";

    const select = document.createElement("select");
    element.difficulties.forEach((star) => {
      const option = document.createElement("option");
      option.value = star;
      option.textContent = "★".repeat(star) + "☆".repeat(5 - star);
      select.appendChild(option);
    });

    const playBtn = document.createElement("button");
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () => {
      startGame(element, parseInt(select.value));
    });

    card.appendChild(title);
    controls.appendChild(select);
    controls.appendChild(playBtn);

    card.appendChild(controls);
    beatmapCardsContainer.appendChild(card);
  });
}
// ------ Beatmap fetching & rendering functions ------

// ------ RecentPlay fetching & rendering functions ------
// Load recent-scores
async function loadRecentScores() {
  let url = API_URL + "/scores";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch scores");
    const scores = await response.json();

    let filtered = scores;
    if (currentUsername) {
      filtered = scores.filter((s) => s.player === currentUsername);
    }

    updateUserStats(filtered);
    renderRecentScores(filtered);
  } catch (error) {
    let recentPlays = document.getElementById("recent-plays-cards");
    recentPlays.textContent = "Could not load recent scores";
  }
}
// Render RecentPlays Cards (Create & Render)
function renderRecentScores(scoresData) {
  let recentPlays = document.getElementById("recent-plays-cards");
  recentPlays.innerHTML = "";

  scoresData.forEach((element) => {
    const card = document.createElement("div");
    card.className = "recentplay-card";

    const title = document.createElement("span");
    title.className = "recentplay-title";

    const grade = document.createElement("h4");
    grade.textContent = element.grade;
    const score = document.createElement("h4");
    score.textContent = "Score: " + element.score;

    title.appendChild(grade);
    title.appendChild(score);

    const maxCombo = document.createElement("p");
    maxCombo.textContent = "Combo: " + element.maxCombo;
    const accuracy = document.createElement("p");
    accuracy.textContent = "Accuracy: " + element.accuracy;
    const song = document.createElement("p");
    song.textContent = "Song: " + element.song;
    const difficulty = document.createElement("p");
    difficulty.textContent =
      "Difficulty: " +
      "★".repeat(element.difficulty) +
      "☆".repeat(5 - element.difficulty);

    const showResult = document.createElement("button");
    showResult.textContent = "Result";
    // showResult.addEventListener("click", () => {
    //   showResult(element, parseInt(select.value));
    // });

    card.appendChild(title);
    card.appendChild(maxCombo);
    card.appendChild(accuracy);
    card.appendChild(song);
    card.appendChild(difficulty);

    recentPlays.appendChild(card);
  });
}
// ------ RecentPlay fetching & rendering functions ------

// ------ Game start & state functions ------
// Game start
function startGame(beatmap, star) {
  // Store for Replay
  currentBeatmap = beatmap;
  currentStar = star;
  // Reset game state
  gameState.score = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.isPlaying = false;
  gameState.accuracyCounts = {
    perfect: 0,
    great: 0,
    good: 0,
    bad: 0,
    miss: 0,
  };
  gameState.totalPointsEarned = 0;
  gameState.activeNotes = [];
  gameState.noteEvents = [];
  document.querySelectorAll(".note").forEach((n) => n.remove());

  // Set up audio
  audio.src = beatmap.filePath;
  gameState.bpm = getBPM(star);
  gameState.difficulty = star;

  // Hide result overlay and show playing field again
  document.getElementById("result-overlay").style.display = "none";
  document.querySelector(".playing-field").style.display = "flex";

  // Switch views
  document.querySelector("#main-nav").style.display = "none";
  document.querySelector(".main-view").style.display = "none";
  document.body.style.justifyContent = "flex-start";
  document.body.style.overflow = "hidden";
  document.querySelector(".game-view").hidden = false;

  // show "Press SPACE to Start"
  document.getElementById("start-message").style.display = "flex";
}

// Convert star rating to BPM, with fallback
function getBPM(star) {
  return difficultyBPM[star] ?? 100;
}

// Fall Duration of note
function getFallDuration(difficulty) {
  if (difficulty == 1) return 2;
  else if (difficulty == 2) return 2;
  else if (difficulty == 3) return 1.9;
  else if (difficulty == 4) return 1.9;
  else if (difficulty == 5) return 1.9;
}
// ------ Game start & state functions ------

// ------ Game loop & mechanics ------
function findClosestNote(laneId, currentTime) {
  let closestNote = null; // Note object
  let closestDelta = Infinity; // Least distance to bottom
  let offset = gameState.offset;
  gameState.activeNotes.forEach((note) => {
    if (note.laneId === laneId) {
      let adjustedTime = note.time - offset;
      let delta = Math.abs(adjustedTime - currentTime); // Current note’s distance
      if (delta < closestDelta && delta <= 0.1) {
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
  let offset = gameState.offset;
  let delta = Math.abs(note.time - currentTime - offset);
  let basepoints = 0;
  let judgment;
  if (delta <= 0.025) {
    gameState.accuracyCounts.perfect += 1;
    judgment = "perfect";
    basepoints = 300;
  } else if (delta <= 0.05) {
    gameState.accuracyCounts.great += 1;
    judgment = "great";
    basepoints = 200;
  } else if (delta <= 0.075) {
    gameState.accuracyCounts.good += 1;
    judgment = "good";
    basepoints = 100;
  } else if (delta <= 0.1) {
    gameState.accuracyCounts.bad += 1;
    judgment = "bad";
    basepoints = 50;
  }

  gameState.totalPointsEarned += basepoints;

  let hitScore = Math.round(basepoints * (1 + gameState.combo / 100));
  gameState.score += hitScore;
  gameState.combo += 1;

  if (gameState.combo > gameState.maxCombo)
    gameState.maxCombo = gameState.combo;

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

// Update Game Stats
function updateHUD() {
  document.getElementById("score").textContent = gameState.score;
  document.getElementById("combo").textContent = gameState.combo;

  let totalHits =
    gameState.accuracyCounts.perfect +
    gameState.accuracyCounts.great +
    gameState.accuracyCounts.good +
    gameState.accuracyCounts.bad +
    gameState.accuracyCounts.miss;
  let accuracy =
    totalHits > 0
      ? Math.round((gameState.totalPointsEarned / (totalHits * 300)) * 100)
      : 100;
  document.getElementById("accuracy").textContent = accuracy + "%";
}

// Update User Stats
function updateUserStats(scores) {
  if (!scores || scores.length === 0) {
    document.getElementById("user-score").textContent = "0";
    document.getElementById("user-accuracy").textContent = "0.00%";
    return;
  }

  // Total score
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  // Average accuracy – parseFloat removes the '%'
  const avgAccuracy =
    scores.reduce((sum, s) => {
      return sum + parseFloat(s.accuracy);
    }, 0) / scores.length;

  document.getElementById("user-score").textContent = totalScore;
  document.getElementById("user-accuracy").textContent =
    avgAccuracy.toFixed(2) + "%";
}

// Game loop logic - Run till audio ends.
function startGameLoop() {
  console.log("Game loop started");

  gameState.noteEvents = generateNoteEvents(
    gameState.bpm,
    gameState.difficulty,
    audio.duration,
  );
  updateHUD();

  let fallDuration = getFallDuration(gameState.difficulty);
  let spawnIndex = 0;

  // Hides unusedLanes
  let maxLane = gameState.maxLanes;
  for (let i = maxLane; i <= 8; i += 1) {
    let laneEl = document.getElementById("lane_" + i);
    laneEl.style.display = "none";
  }

  // Calculate Offset required to be perfect on neon line.
  let referenceLane = document.getElementById("lane_0");
  let laneHeight = referenceLane.clientHeight;
  let travelHeight = laneHeight - 60; // distance from top to hitlane bottom
  let speed = travelHeight / fallDuration;
  let offset = 18 / speed; // time to travel from neon line to bottom
  gameState.offset = offset;

  function loop() {
    if (!gameState.isPlaying) return;

    let currentTime = audio.currentTime;

    while (
      spawnIndex < gameState.noteEvents.length &&
      gameState.noteEvents[spawnIndex].time <= currentTime + fallDuration
    ) {
      let noteData = gameState.noteEvents[spawnIndex];
      spawnNoteElement(noteData);
      spawnIndex++;
    }

    moveActiveNotes(currentTime, fallDuration);

    if (audio.ended && gameState.activeNotes.length === 0) {
      gameState.isPlaying = false;
      showResult();
      console.log("Game loop ended.");
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
  } else if (difficulty == 2) {
    step = Math.round((beatinterval / 2) * 100) / 100;
    spawnChance = 0.5;
    maxLane = 5;
  } else if (difficulty == 3) {
    step = Math.round((beatinterval / 2) * 100) / 100;
    spawnChance = 0.6;
    maxLane = 7;
  } else if (difficulty == 4) {
    step = Math.round((beatinterval / 3) * 100) / 100;
    spawnChance = 0.6;
    maxLane = 9;
  } else if (difficulty == 5) {
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

function spawnNoteElement(noteData) {
  let laneElement = document.getElementById("lane_" + noteData.lane);
  let noteElement = document.createElement("div");
  noteElement.className = "note";
  noteElement.style.top = "0px";
  laneElement.appendChild(noteElement);
  noteData.element = noteElement;
  noteData.laneId = "lane_" + noteData.lane;
  noteData.laneElement = laneElement;
  gameState.activeNotes.push(noteData);
}

function moveActiveNotes(currentTime, fallDuration) {
  for (let i = gameState.activeNotes.length - 1; i >= 0; i--) {
    let noteData = gameState.activeNotes[i];
    let timeUntilHit = noteData.time - currentTime;
    let progress = 1 - timeUntilHit / fallDuration;
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;

    let laneElement = noteData.laneElement;
    let travelHeight = laneElement.clientHeight - 60;
    noteData.element.style.top = progress * travelHeight + "px";

    if (timeUntilHit < -0.1) {
      gameState.accuracyCounts.miss += 1;
      gameState.combo = 0;
      noteData.element.remove();
      gameState.activeNotes.splice(i, 1);
      updateHUD();
    }
  }
}
// ------ Game loop & mechanics ------

// ------ Results & grade ------
function showResult() {
  let totalHits =
    gameState.accuracyCounts.perfect +
    gameState.accuracyCounts.great +
    gameState.accuracyCounts.good +
    gameState.accuracyCounts.bad +
    gameState.accuracyCounts.miss;
  let accuracy =
    totalHits > 0
      ? Math.round((gameState.totalPointsEarned / (totalHits * 300)) * 100)
      : 100;
  let grade = getGrade(accuracy);

  // result
  document.getElementById("grade").querySelector("h1").textContent = grade;
  document.getElementById("final-score").textContent = gameState.score;
  document.getElementById("final-combo").textContent = gameState.maxCombo;
  document.getElementById("final-accuracy").textContent = accuracy + "%";
  document.getElementById("count-perfect").textContent =
    gameState.accuracyCounts.perfect;
  document.getElementById("count-great").textContent =
    gameState.accuracyCounts.great;
  document.getElementById("count-good").textContent =
    gameState.accuracyCounts.good;
  document.getElementById("count-bad").textContent =
    gameState.accuracyCounts.bad;
  document.getElementById("count-miss").textContent =
    gameState.accuracyCounts.miss;

  document.getElementById("result-overlay").style.display = "flex";
  document.querySelector(".playing-field").style.display = "none";
  document.querySelector("header").style.display = "none";
}

function getGrade(percentage) {
  if (percentage === 100) return "SS";
  else if (percentage >= 95) return "S";
  else if (percentage >= 90) return "A";
  else if (percentage >= 80) return "B";
  else if (percentage >= 70) return "C";
  else return "F";
}
// ------ Results & grade ------

// ------ Result Submit ------
document
  .getElementById("submit-name-btn")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("player-name");
    const nameError = document.getElementById("name-error");
    const submitError = document.getElementById("submit-error");

    if (!usernameInput.value.trim()) {
      usernameInput.value = nameInput.value.trim();
      currentUsername = nameInput.value.trim();
    }

    // Validate
    if (nameInput.value.trim().length < 2) {
      nameError.textContent = "Name must be at least 2 characters.";
      return;
    }
    nameError.textContent = "";

    // Build score object
    const newScore = {
      player: nameInput.value.trim(),
      score: gameState.score,
      maxCombo: gameState.maxCombo,
      accuracy: document.getElementById("final-accuracy").textContent,
      difficulty: currentStar,
      song: currentBeatmap ? currentBeatmap.title : "",
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch(API_URL + "/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newScore),
      });
      if (!response.ok) throw new Error("Submit failed");

      // Success
      document.getElementById("score-submission").style.display = "none";
      document.querySelector(".result").style.display = "flex";
      document.querySelector(".result-breakdown").style.display = "flex";
      document.getElementById("btns").style.display = "flex";
      const successMsg = document.getElementById("submit-success");
      successMsg.textContent = "Score submitted!";
      successMsg.style.display = "inline";
      loadRecentScores();
    } catch (error) {
      submitError.textContent = "Failed to submit score. Try again.";
      submitError.style.color = "#ff4444";
    }
  });
// ------ Result Submit ------
