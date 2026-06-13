// DOM Reference Variables
const tableBody = document.getElementById("beatmap-table-body");
const form = document.getElementById("beatmap-form");
const beatmapIdInput = document.getElementById("beatmap-id");
const beatmapTitleInput = document.getElementById("beatmap-title");
const beatmapDifficultiesInput = document.getElementById(
  "beatmap-difficulties",
);
const beatmapFilepathInput = document.getElementById("beatmap-filepath");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const formTitle = document.getElementById("form-title");
const formError = document.getElementById("form-error");
const btnDashboard = document.getElementById("btn-dashboard");
const btnBeatmaps = document.getElementById("btn-beatmaps");
const btnAdd = document.getElementById("btn-add");
const sections = document.querySelectorAll(".admin-section");

// Global Data
const API_URL = "http://localhost:3000";
let isEditing = false; // track whether we are adding or editing
let editingBeatmapId = null; // store the id of the beatmap being edited

// -----------------------------------------------
//  1. Fetch & Display Beatmaps
// -----------------------------------------------

async function fetchAdminBeatmaps() {
  try {
    const response = await fetch(API_URL + "/beatmaps");
    if (!response.ok) throw new Error("Server Error");
    const beatmaps = await response.json();
    renderAdminTable(beatmaps);
    updateAdminStats(beatmaps); // we'll write this later
  } catch (error) {
    tableBody.innerHTML =
      '<tr><td colspan="5">Failed to load beatmaps.</td></tr>';
  }
}

function renderAdminTable(beatmaps) {
  tableBody.innerHTML = "";

  beatmaps.forEach((beatmap) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${beatmap.id}</td>
      <td>${beatmap.title}</td>
      <td>${beatmap.difficulties.join(", ")}</td>
      <td>${beatmap.filePath}</td>
      <td>
        <button class="edit-btn" data-id="${beatmap.id}">Edit</button>
        <button class="delete-btn" data-id="${beatmap.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// -----------------------------------------------
//  2. Stats (placeholder - we'll fill later)
// -----------------------------------------------

function updateAdminStats(beatmaps) {
  // TODO: compute and display total, avg difficulties, most common difficulty
  console.log("Stats update not implemented yet");
}

// -----------------------------------------------
//  3. Section Navigation
// -----------------------------------------------

function showSection(sectionId) {
  sections.forEach(section => {
    section.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";

  // Update active button styling
  [btnDashboard, btnBeatmaps, btnAdd].forEach(btn => btn.classList.remove("active"));
  if (sectionId === "admin-stats") btnDashboard.classList.add("active");
  else if (sectionId === "admin-beatmaps") btnBeatmaps.classList.add("active");
  else if (sectionId === "admin-form-section") btnAdd.classList.add("active");
}

btnDashboard.addEventListener("click", () => showSection("admin-stats"));
btnBeatmaps.addEventListener("click", () => showSection("admin-beatmaps"));
btnAdd.addEventListener("click", () => showSection("admin-form-section"));

// Set initial active button
btnDashboard.classList.add("active");

// -----------------------------------------------
//  3. Form Handling (Add / Edit) - will be added next
// -----------------------------------------------

// Placeholder – we'll add event listeners for the form and buttons later

// -----------------------------------------------
//  4. CSV Export (Bonus) - will be added later
// -----------------------------------------------

// -----------------------------------------------
//  Initial Load
// -----------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  fetchAdminBeatmaps();
});
