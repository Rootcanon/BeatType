// all variables required
const beatmapCardsContainer = document.getElementById("beatmap-cards");
const difficultyFilter = document.getElementById("difficulty-filter");
let allBeatmaps = [];

// Wait for all DOMs to load
document.addEventListener("DOMContentLoaded", () => {
  console.log("App ready");

  fetchBeatmaps();
});

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
    const response = await fetch("http://localhost:3000/beatmaps");
    if (!response.ok) throw new Error("Server Error");
    allBeatmaps = await response.json();
    applyFilter(allBeatmaps);
  } catch (error) {
    showError("Failed to load beatmaps.");
  }
}

// Filter for Beatmap Cards
function applyFilter() {
  let selected = difficultyFilter.value;
  let filtered;
  if (selected === "all") filtered = allBeatmaps;
  else {
    let star = parseInt(selected);
    filtered = allBeatmaps.filter((beatmap) =>
      beatmap.difficulties.includes(star),
    );
  }
  renderBeatmaps(filtered);
}

// Render Cards (Create & Render)
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
    for (let i = 1; i <= 5; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = "★".repeat(i) + "☆".repeat(5 - i);
      select.appendChild(option);
    }

    const playBtn = document.createElement("button");
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () => {
      console.log("Play:", element.title, "Difficulty:", select.value);
    });

    card.appendChild(title);
    controls.appendChild(select);
    controls.appendChild(playBtn);

    card.appendChild(controls);
    beatmapCardsContainer.appendChild(card);
  });
}

// Event Listeners
difficultyFilter.addEventListener("change", applyFilter);
