const subjects = ["Math", "Science", "English", "Computer", "Social"];
const marksInputs = [...document.querySelectorAll(".mark")];
const analyzeBtn = document.getElementById("analyzeBtn");
const historyBody = document.getElementById("historyBody");
document.getElementById("year").textContent = new Date().getFullYear();

let barChart, donutChart;
renderHistory();

function getThresholds() {
  const scheme = document.getElementById("scheme").value;
  return scheme === "strict"
    ? { distinction: 85, first: 70, pass: 50 }
    : { distinction: 75, first: 60, pass: 40 };
}

function getGrade(percentage, t) {
  if (percentage >= t.distinction) return { grade: "Distinction", remark: "Excellent", color: "#10B981" };
  if (percentage >= t.first) return { grade: "First Class", remark: "Very Good", color: "#3B82F6" };
  if (percentage >= t.pass) return { grade: "Pass", remark: "Can Improve", color: "#F59E0B" };
  return { grade: "Fail", remark: "Needs Attention", color: "#EF4444" };
}

function animateNumber(el, start, end, suffix = "", duration = 800) {
  const t0 = performance.now();
  function tick(t) {
    const p = Math.min((t - t0) / duration, 1);
    const v = start + (end - start) * p;
    el.textContent = `${Math.round(v)}${suffix}`;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function analyze() {
  const name = document.getElementById("studentName").value.trim() || "Unknown";
  const roll = document.getElementById("rollNumber").value.trim() || "-";
  const marks = marksInputs.map(i => Number(i.value));

  if (marks.some(m => Number.isNaN(m) || m < 0 || m > 100)) {
    alert("Please enter valid marks (0-100) for all subjects.");
    return;
  }

  const total = marks.reduce((a, b) => a + b, 0);
  const percentage = +(total / marks.length).toFixed(2);
  const t = getThresholds();
  const result = getGrade(percentage, t);

  animateNumber(document.getElementById("total"), 0, total);
  animateNumber(document.getElementById("percentage"), 0, percentage, "%");
  document.getElementById("grade").textContent = result.grade;
  document.getElementById("remark").textContent = result.remark;
  document.getElementById("cardGrade").style.borderTopColor = result.color;

  const max = Math.max(...marks), min = Math.min(...marks);
  const highest = subjects[marks.indexOf(max)];
  const lowest = subjects[marks.indexOf(min)];
  document.getElementById("highest").textContent = `${highest} (${max})`;
  document.getElementById("lowest").textContent = `${lowest} (${min})`;
  document.getElementById("suggestion").textContent =
    min < 50 ? `Focus on ${lowest}: target +15 marks with practice sets.` : "Strong consistency across subjects.";
  const badge = document.getElementById("statusBadge");
  badge.textContent = result.grade;
  badge.style.background = `${result.color}22`;
  badge.style.color = result.color;
  badge.style.borderColor = `${result.color}66`;

  drawCharts(marks, percentage, result.color);

  saveHistory({ name, roll, total, percentage, grade: result.grade });
}

function drawCharts(marks, percentage, gradeColor) {
  if (barChart) barChart.destroy();
  if (donutChart) donutChart.destroy();

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: subjects,
      datasets: [{ data: marks, borderRadius: 8, backgroundColor: "#3B82F6" }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: "rgba(148,163,184,.15)" }, ticks: { color: "#CBD5E1" } },
        x: { ticks: { color: "#CBD5E1" }, grid: { display: false } }
      }
    }
  });

  donutChart = new Chart(document.getElementById("donutChart"), {
    type: "doughnut",
    data: { labels: ["Scored", "Remaining"], datasets: [{ data: [percentage, 100 - percentage], backgroundColor: [gradeColor, "#334155"], borderWidth: 0 }] },
    options: {
      cutout: "72%",
      plugins: { legend: { labels: { color: "#CBD5E1" } } },
      animation: { animateRotate: true, duration: 900 }
    }
  });
}

function saveHistory(entry) {
  const list = JSON.parse(localStorage.getItem("studentHistory") || "[]");
  list.unshift(entry);
  localStorage.setItem("studentHistory", JSON.stringify(list.slice(0, 20)));
  renderHistory();
}

function renderHistory() {
  const list = JSON.parse(localStorage.getItem("studentHistory") || "[]");
  historyBody.innerHTML = list.map(i => `
    <tr>
      <td>${i.name}</td><td>${i.roll}</td><td>${i.total}</td><td>${i.percentage}%</td><td>${i.grade}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">No history yet</td></tr>`;
}

document.getElementById("downloadCSV").addEventListener("click", () => {
  const list = JSON.parse(localStorage.getItem("studentHistory") || "[]");
  if (!list.length) return alert("No history to export.");
  const rows = ["Name,Roll,Total,Percentage,Grade", ...list.map(i => `${i.name},${i.roll},${i.total},${i.percentage},${i.grade}`)];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "student-history.csv"; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("exportPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Student Performance Report", 14, 18);
  doc.setFontSize(11);

  const fields = [
    ["Name", document.getElementById("studentName").value || "Unknown"],
    ["Roll", document.getElementById("rollNumber").value || "-"],
    ["Total", document.getElementById("total").textContent],
    ["Percentage", document.getElementById("percentage").textContent],
    ["Grade", document.getElementById("grade").textContent],
    ["Remark", document.getElementById("remark").textContent],
  ];

  let y = 32;
  fields.forEach(([k, v]) => { doc.text(`${k}: ${v}`, 14, y); y += 8; });
  doc.save("student-report.pdf");
});

document.getElementById("clearAll").addEventListener("click", () => {
  document.getElementById("studentName").value = "";
  document.getElementById("rollNumber").value = "";
  marksInputs.forEach(i => i.value = "");
  document.getElementById("total").textContent = "0";
  document.getElementById("percentage").textContent = "0%";
  document.getElementById("grade").textContent = "-";
  document.getElementById("remark").textContent = "-";
  document.getElementById("highest").textContent = "-";
  document.getElementById("lowest").textContent = "-";
  document.getElementById("suggestion").textContent = "Add marks and analyze to view suggestions.";
  document.getElementById("statusBadge").textContent = "Pending";
});

analyzeBtn.addEventListener("click", analyze);
lucide.createIcons();
