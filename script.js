let rawData = [];

let ageMap = {};
let platformMap = {};
let genderMap = {};

let currentGender = "all";
let selectedAges = [];

let ageChart, platformChart, genderChart;

// =====================
// LOAD DATA
// =====================
fetch("data.csv")
  .then(res => res.text())
  .then(text => {

    const rows = text.trim().split("\n").slice(1);

    rawData = rows.map(r => {
      const c = r.split(",");

      return {
        age: parseInt(c[0]),
        gender: c[1],
        platform: c[3],
        addiction: parseFloat(c[11])
      };
    });

    // restore saved state
    currentGender = localStorage.getItem("genderFilter") || "all";
    selectedAges = JSON.parse(localStorage.getItem("selectedAges") || "[]");

    applyAllFilters();
  });

// =====================
// AVERAGE FUNCTION
// =====================
function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// =====================
// MASTER FILTER ENGINE
// =====================
function applyAllFilters() {

  let filtered = rawData;

  // gender filter
  if (currentGender !== "all") {
    filtered = filtered.filter(d => d.gender === currentGender);
  }

  // multi-age filter
  if (selectedAges.length > 0) {
    filtered = filtered.filter(d => selectedAges.includes(d.age));
  }

  buildCharts(filtered);
  updateKPIs(filtered);
  updateAgeCards(filtered);
}

// =====================
// UPDATE BUTTON FILTER (GENDER)
// =====================
function updateDashboard(genderFilter, btn) {

  currentGender = genderFilter;
  localStorage.setItem("genderFilter", genderFilter);

  applyAllFilters();

  document.querySelectorAll(".controls button").forEach(b => {
    b.classList.remove("active");
  });

  btn.classList.add("active");
}

// =====================
// BUILD CHARTS
// =====================
function buildCharts(data) {

  ageMap = {};
  platformMap = {};
  genderMap = {};

  data.forEach(d => {
    if (isNaN(d.addiction)) return;

    if (!ageMap[d.age]) ageMap[d.age] = [];
    ageMap[d.age].push(d.addiction);

    if (!platformMap[d.platform]) platformMap[d.platform] = [];
    platformMap[d.platform].push(d.addiction);

    if (!genderMap[d.gender]) genderMap[d.gender] = [];
    genderMap[d.gender].push(d.addiction);
  });

  const ageLabels = Object.keys(ageMap);
  const ageValues = Object.values(ageMap).map(avg);

  const platformLabels = Object.keys(platformMap);
  const platformValues = Object.values(platformMap).map(avg);

  const genderLabels = Object.keys(genderMap);
  const genderValues = Object.values(genderMap).map(avg);

  if (ageChart) ageChart.destroy();
  if (platformChart) platformChart.destroy();
  if (genderChart) genderChart.destroy();

  ageChart = new Chart(document.getElementById("ageChart"), {
    type: "bar",
    data: {
      labels: ageLabels,
      datasets: [{
        label: "Average Addiction",
        data: ageValues,
        backgroundColor: "red"
      }]
    }
  });

  platformChart = new Chart(document.getElementById("platformChart"), {
    type: "bar",
    data: {
      labels: platformLabels,
      datasets: [{
        label: "Average Addiction",
        data: platformValues,
        backgroundColor: "blue"
      }]
    }
  });

  genderChart = new Chart(document.getElementById("genderChart"), {
    type: "bar",
    data: {
      labels: genderLabels,
      datasets: [{
        label: "Average Addiction",
        data: genderValues,
        backgroundColor: "green"
      }]
    }
  });
}

// =====================
// KPI UPDATE
// =====================
function updateKPIs(data) {

  const total = data.length;

  const avgVal =
    data.reduce((sum, d) => sum + (d.addiction || 0), 0) / total;

  document.getElementById("totalCount").innerText = total;
  document.getElementById("avgAddiction").innerText =
    isNaN(avgVal) ? 0 : avgVal.toFixed(2);
}

// =====================
// AGE CARDS UPDATE
// =====================
function updateAgeCards(data) {

  const ages = [13, 14, 15, 16, 17, 18, 19];

  const counts = {};
  ages.forEach(a => counts[a] = 0);

  data.forEach(d => {
    if (counts[d.age] !== undefined) {
      counts[d.age]++;
    }
  });

  ages.forEach(age => {
    const el = document.getElementById("age" + age);
    if (el) el.innerText = counts[age];
  });
}

// =====================
// AGE FILTER (MULTI-SELECT TOGGLE)
// =====================
function filterByAge(age, element) {

  age = parseInt(age);

  if (selectedAges.includes(age)) {
    selectedAges = selectedAges.filter(a => a !== age);
  } else {
    selectedAges.push(age);
  }

  localStorage.setItem("selectedAges", JSON.stringify(selectedAges));

  document.querySelectorAll(".age-kpis .kpi-card").forEach(card => {
    card.classList.remove("active");
  });

  selectedAges.forEach(a => {
    const el = document.querySelector(`.kpi-card[onclick*="${a}"]`);
    if (el) el.classList.add("active");
  });

  applyAllFilters();
}

// =====================
// PANEL SWITCH
// =====================
function showPanel(id, event) {

  localStorage.setItem("activePanel", id);

  document.querySelectorAll(".panel-page").forEach(p => {
    p.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".sidebar button").forEach(btn => {
    btn.classList.remove("active");
  });

  event.currentTarget.classList.add("active");

  // reset only when overview is opened
  if (id === "overview") {

    currentGender = "all";
    selectedAges = [];

    localStorage.setItem("genderFilter", "all");
    localStorage.setItem("selectedAges", "[]");

    document.querySelectorAll(".controls button").forEach(b => {
      b.classList.remove("active");
    });

    const allBtn = document.querySelector(".controls button");
    if (allBtn) allBtn.classList.add("active");

    document.querySelectorAll(".age-kpis .kpi-card").forEach(c => {
      c.classList.remove("active");
    });

    applyAllFilters();
  }
}

// =====================
// RESTORE ON LOAD (FIXED)
// =====================
window.addEventListener("load", () => {

  const savedPanel = localStorage.getItem("activePanel") || "about";
  const savedGender = localStorage.getItem("genderFilter") || "all";
  const savedAges = JSON.parse(localStorage.getItem("selectedAges") || "[]");

  currentGender = savedGender;
  selectedAges = savedAges;

  // show correct panel
  document.querySelectorAll(".panel-page").forEach(p => {
    p.classList.remove("active");
  });

  const panel = document.getElementById(savedPanel);
  if (panel) panel.classList.add("active");

  // sidebar active
  document.querySelectorAll(".sidebar button").forEach(btn => {
    btn.classList.remove("active");

    if (btn.getAttribute("onclick")?.includes(savedPanel)) {
      btn.classList.add("active");
    }
  });

  // restore gender button UI
  document.querySelectorAll(".controls button").forEach(b => {
    b.classList.remove("active");

    if (b.textContent.toLowerCase().includes(savedGender)) {
      b.classList.add("active");
    }
  });

  // restore age UI
  document.querySelectorAll(".age-kpis .kpi-card").forEach(c => {
    c.classList.remove("active");
  });

  selectedAges.forEach(age => {
    const el = document.querySelector(`.kpi-card[onclick*="${age}"]`);
    if (el) el.classList.add("active");
  });

  // apply everything
  applyAllFilters();
});

