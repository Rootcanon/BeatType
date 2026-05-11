// Hardcoded Variables
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
const difficultyBPM = { 1: 70, 2: 100, 3: 130, 4: 160, 5: 190 };



function getBeatmapData(id) {
  let result = beatmaps.find(function (beatmap) {
    return beatmap.id === id;
  })
  return result;
};

function getBPM(star) {
  return difficultyBPM[star] ?? 100;
};

function parseURLParams() {
  let p = new URLSearchParams(window.location.search)
  let id = parseInt(p.get("id") || 1);
  let star = parseInt(p.get("star") || 3);
  return { id, star };
}
console.log(parseURLParms());