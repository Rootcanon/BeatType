// DOM Reference Variables
const tableBody = document.getElementById("beatmap-table-body");
const form = document.getElementById("beatmap-form");
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
const exportCsvBtn = document.getElementById("export-csv-btn");

// Global Data
const API_URL = "http://localhost:3000";
let isEditing = false; // track whether we are adding or editing
let editingBeatmapId = null; // store the id of the beatmap being edited
let currentBeatmaps = []; // To determine id no.

//  1. Fetch & Display Beatmaps
async function fetchAdminBeatmaps() {
  try {
    const response = await fetch(API_URL + "/beatmaps");
    if (!response.ok) throw new Error("Server Error");
    const beatmaps = await response.json();
    currentBeatmaps = beatmaps;
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
        <button type="button" class="edit-btn" data-id="${beatmap.id}">Edit</button>
        <button type="button" class="delete-btn" data-id="${beatmap.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

//  2. Stats

function updateAdminStats(beatmaps) {
  const total = beatmaps.length;
  const totalDiffs = beatmaps.reduce(
    (sum, b) => sum + b.difficulties.length,
    0,
  );
  const avgDiffs = total > 0 ? (totalDiffs / total).toFixed(1) : 0;

  // Most common difficulty
  const freq = {};
  beatmaps.forEach((b) =>
    b.difficulties.forEach((d) => (freq[d] = (freq[d] || 0) + 1)),
  );
  let mostCommon = "N/A",
    max = 0;
  for (let d in freq) {
    if (freq[d] > max) {
      max = freq[d];
      mostCommon = d;
    }
  }

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-avg-diff").textContent = avgDiffs;
  document.getElementById("stat-most-common").textContent =
    mostCommon !== "N/A" ? mostCommon + "★" : "N/A";
}

//  3. Section Navigation

function showSection(sectionId) {
  sections.forEach((section) => {
    section.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";

  // Update active button styling
  [btnDashboard, btnBeatmaps, btnAdd].forEach((btn) =>
    btn.classList.remove("active"),
  );
  if (sectionId === "admin-stats") btnDashboard.classList.add("active");
  else if (sectionId === "admin-beatmaps") btnBeatmaps.classList.add("active");
  else if (sectionId === "admin-form-section") btnAdd.classList.add("active");
}

btnDashboard.addEventListener("click", () => showSection("admin-stats"));
btnBeatmaps.addEventListener("click", () => showSection("admin-beatmaps"));
btnAdd.addEventListener("click", () => showSection("admin-form-section"));

// Set initial active button
btnDashboard.classList.add("active");

//  4. Form Handling (Add / Edit)
// -- ADD
form.addEventListener("submit", function (e) {
  e.preventDefault();
  handleSubmit();
});

async function handleSubmit() {
  const diffs = beatmapDifficultiesInput.value
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => n >= 1 && n <= 5);

  if (diffs.length === 0) {
    formError.textContent = "Enter at least one valid difficulty (1-5).";
    formError.style.color = "#ff4444";
    return;
  }

  const beatmapData = {
    title: beatmapTitleInput.value.trim(),
    difficulties: diffs,
    filePath: beatmapFilepathInput.value.trim(),
  };

  if (!beatmapData.title || !beatmapData.filePath) {
    formError.textContent = "All fields are required.";
    formError.style.color = "#ff4444";
    return;
  }

  try {
    let response;
    if (isEditing) {
      response = await fetch(API_URL + "/beatmaps/" + editingBeatmapId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(beatmapData),
      });
    } else {
      response = await fetch(API_URL + "/beatmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(beatmapData),
      });
    }
    if (!response.ok) throw new Error("Failed");

    form.reset();
    formError.textContent = isEditing ? "Beatmap updated!" : "Beatmap added!";
    formError.style.color = "lime";
    fetchAdminBeatmaps();
    cancelEdit();
    setTimeout(() => {
      formError.textContent = "";
      formError.style.color = "#ff4444";
    }, 3000);
  } catch (error) {
    formError.textContent = isEditing ? "Error updating." : "Error adding.";
    formError.style.color = "#ff4444";
  }
}

// Table body Event listner
tableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const id = parseInt(e.target.getAttribute("data-id"));
    editBeatmap(id);
  }
  if (e.target.classList.contains("delete-btn")) {
    const id = parseInt(e.target.getAttribute("data-id"));
    if (confirm("Are you sure you want to delete this beatmap?")) {
      deleteBeatmap(id);
    }
  }
});
// -- Edit
async function editBeatmap(id) {
  try {
    const response = await fetch(API_URL + "/beatmaps/" + id);
    if (!response.ok) throw new Error("Beatmap not found");
    const beatmap = await response.json();

    beatmapIdInput.value = beatmap.id;
    beatmapTitleInput.value = beatmap.title;
    beatmapDifficultiesInput.value = beatmap.difficulties.join(",");
    beatmapFilepathInput.value = beatmap.filePath;

    formTitle.textContent = "Edit Beatmap";
    saveBtn.textContent = "Update Beatmap";
    cancelEditBtn.style.display = "inline-block";

    isEditing = true;
    editingBeatmapId = id;

    // Switch to form section
    showSection("admin-form-section");
  } catch (error) {
    alert("Failed to load beatmap for editing.");
  }
}

cancelEditBtn.addEventListener("click", cancelEdit);
function cancelEdit() {
  isEditing = false;
  editingBeatmapId = null;
  form.reset();
  formTitle.textContent = "Add New Beatmap";
  saveBtn.textContent = "Add Beatmap";
  cancelEditBtn.style.display = "none";
}

// -- Delete/Remove
async function deleteBeatmap(id) {
  try {
    const response = await fetch(API_URL + "/beatmaps/" + id, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Delete failed");
    fetchAdminBeatmaps();
  } catch (error) {
    alert("Failed to delete beatmap.");
  }
}

//  5. CSV Export (Bonus)
exportCsvBtn.addEventListener("click", exportCSV);
function exportCSV() {
  fetch(API_URL + "/beatmaps")
    .then((res) => res.json())
    .then((beatmaps) => {
      let csv = "ID,Title,Difficulties,File Path\n";
      beatmaps.forEach((b) => {
        csv += `${b.id},"${b.title}","${b.difficulties.join(",")}",${b.filePath}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "beatmaps.csv";
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(() => alert("Failed to export CSV"));
}

//  Initial Load
document.addEventListener("DOMContentLoaded", () => {
  fetchAdminBeatmaps();
});
