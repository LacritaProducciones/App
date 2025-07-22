// Estado global
let habits = [], user = {}, activeIdx = null, intervalId = null;
let streakTime = 0, streakDone = false;

// Valores por defecto
const defaultHabits = ["Delta","Theta","Alpha","Beta","Gamma"];
const dias = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// Al cargar la página
window.onload = () => {
  const u = JSON.parse(localStorage.getItem("btUser"));
  const h = JSON.parse(localStorage.getItem("btHabits"));
  if (u && h) {
    user = u;
    habits = h;
    document.getElementById("auth-view").classList.remove("active");
    document.getElementById("main-app").classList.add("active");
    document.getElementById("user-name").textContent = user.username;
    renderAll();
  } else {
    habits = defaultHabits.map(n => ({ name: n, dur: 0 }));
  }
};

// Registro de usuario
function registerUser() {
  const name = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const pwd   = document.getElementById("password").value.trim();
  if (!name || !email || !pwd) return alert("Rellena todos los campos");
  user = { username: name, email, streak: 0, avatar: "https://www.gravatar.com/avatar/?d=mp&s=200" };
  localStorage.setItem("btUser", JSON.stringify(user));
  localStorage.setItem("btHabits", JSON.stringify(habits));
  window.onload();
}

// Sidebar toggle
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("hidden");
}

// Navegación de secciones
function navigate(id) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  toggleSidebar();
}

// Perfil open/close
function openProfile() {
  document.getElementById("edit-username").value = user.username || "";
  document.getElementById("edit-email").value    = user.email    || "";
  document.getElementById("edit-password").value = "••••••••";
  document.getElementById("edit-streak").value   = user.streak   || 0;
  document.getElementById("profile-preview").src = user.avatar   || "https://www.gravatar.com/avatar/?d=mp&s=200";
  document.getElementById("user-avatar").src     = user.avatar   || "https://www.gravatar.com/avatar/?d=mp&s=200";

  const btn = document.getElementById("btn-edit");
  btn.textContent = "✎ Editar";
  btn.className   = "btn-edit";
  btn.onclick     = toggleEdit;
  document.getElementById("btn-save").classList.add("hidden");

  disableProfileFields();
  document.getElementById("profile-view").classList.remove("hidden");
}
function closeProfile() {
  document.getElementById("profile-view").classList.add("hidden");
}

function disableProfileFields() {
  ["edit-username","profile-picture"].forEach(id =>
    document.getElementById(id).disabled = true
  );
}

// Preview al seleccionar imagen
document.getElementById("profile-picture").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("profile-preview").src = reader.result;
  };
  reader.readAsDataURL(file);
});

// Alternar entre Editar y Descartar
function toggleEdit() {
  const btn = document.getElementById("btn-edit");
  const save = document.getElementById("btn-save");
  const isEditing = btn.textContent.includes("✎");
  if (isEditing) {
    // pasar a modo edición
    btn.textContent = "✖ Descartar";
    btn.className   = "btn-edit";
    save.classList.remove("hidden");
    ["edit-username","profile-picture"].forEach(id =>
      document.getElementById(id).disabled = false
    );
  } else {
    // descartar
    openProfile();
  }
}

// Guardar perfil
function saveProfile() {
  const newName = document.getElementById("edit-username").value.trim();
  if (newName) {
    user.username = newName;
    document.getElementById("user-name").textContent = newName;
  }
  const file = document.getElementById("profile-picture").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      user.avatar = reader.result;
      document.getElementById("user-avatar").src     = reader.result;
      document.getElementById("profile-preview").src = reader.result;
      localStorage.setItem("btUser", JSON.stringify(user));
    };
    reader.readAsDataURL(file);
  }
  openProfile(); // vuelve al estado inicial
}

// Añadir hábito
function addHabit() {
  const v = document.getElementById("new-habit").value.trim();
  if (!v) return;
  habits.push({ name: v, dur: 0 });
  localStorage.setItem("btHabits", JSON.stringify(habits));
  renderAll();
}

// Renderizar todo
function renderAll() {
  renderHabits();
  renderStats();
  renderRanking();
  renderStreak();
}

// Renderizar hábitos
function renderHabits() {
  ["preset-habits","habit-list"].forEach(id => document.getElementById(id).innerHTML = "");
  habits.forEach((h, i) => {
    const d = document.createElement("div");
    d.className = "habit-card";
    d.innerHTML = `
      <h4>${h.name}</h4>
      <p>${Math.floor(h.dur/60)}:${String(h.dur%60).padStart(2,'0')}</p>
      <button onclick="toggleHabit(${i})">${activeIdx===i?'Parar':'Iniciar'}</button>
      <div class="progress-bar"><div style="width:${Math.min(h.dur/60/15*100,100)}%"></div></div>
      <div class="progress-label">Reducción de estrés / Mejora de concentración</div>`;
    document.getElementById(i<5?"preset-habits":"habit-list").appendChild(d);
  });
}

// Iniciar/parar hábito
function toggleHabit(i) {
  if (activeIdx === i) {
    clearInterval(intervalId);
    activeIdx = null;
    renderHabits();
    return;
  }
  if (activeIdx !== null) clearInterval(intervalId);
  activeIdx  = i;
  streakDone = user.streak > 0;
  intervalId = setInterval(() => {
    habits[i].dur++;
    if (!streakDone) updateStreak();
    localStorage.setItem("btHabits", JSON.stringify(habits));
    renderAll();
  }, 1000);
}

// Estadísticas
function renderStats() {
  const ct = document.getElementById("charts");
  ct.innerHTML = "";
  habits.forEach(h => {
    const cw = document.createElement("div");
    cw.className = "chart-wrapper";
    cw.innerHTML = `<h4>${h.name}</h4><canvas></canvas>`;
    ct.appendChild(cw);
    new Chart(cw.querySelector("canvas"), {
      type: "bar",
      data: {
        labels: dias,
        datasets: [{ label: "Minutos", data: [h.dur,0,0,0,0,0,0] }]
      },
      options: {
        scales: {
          x: { ticks: { color: "white" } },
          y: { beginAtZero: true, ticks: { color: "white" } }
        },
        plugins: { legend: { display: false } }
      }
    });
  });
}

// Ranking
function renderRanking() {
  document.querySelector("#ranking-table tbody").innerHTML =
    `<tr><td>${user.username}</td><td>${user.streak}</td></tr>`;
}

// Racha
function renderStreak() {
  document.getElementById("streak-count").textContent = user.streak;
  document.getElementById("fire-icon").classList.toggle("active", user.streak>0);
}
function updateStreak() {
  streakTime++;
  document.getElementById("streak-timer").textContent =
    Math.floor(streakTime/60)+":"+String(streakTime%60).padStart(2,'0');
  document.getElementById("streak-progress").style.width =
    Math.min(streakTime/60*100,100)+"%";
  if (streakTime>=60 && !streakDone) {
    user.streak++;
    streakDone = true;
    localStorage.setItem("btUser", JSON.stringify(user));
    renderStreak();
    renderRanking();
  }
}
