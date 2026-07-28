// ---- Client-side JS: talks to the Express API via fetch ----

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  return res;
}

// ---- Login page logic ----
async function initLoginPage() {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");

  // If already logged in, skip straight to dashboard
  const meRes = await api("/api/me");
  if (meRes.ok) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    errorEl.hidden = true;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";

    try {
      const res = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        window.location.href = "dashboard.html";
        return;
      }

      const data = await res.json().catch(() => ({}));
      errorEl.textContent = data.error || "Invalid username or password.";
      errorEl.hidden = false;
    } catch (err) {
      errorEl.textContent = "Could not reach the server. Is it running?";
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  });
}

// ---- Dashboard page logic ----
async function initDashboardPage() {
  const meRes = await api("/api/me");
  if (!meRes.ok) {
    window.location.href = "index.html";
    return;
  }
  const me = await meRes.json();
  document.getElementById("welcome-username").textContent = me.username;

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    window.location.href = "index.html";
  });

  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-title-input");
  const priorityInput = document.getElementById("task-priority-input");
  const searchInput = document.getElementById("task-search");
  const filterSelect = document.getElementById("task-filter");

  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, priority: priorityInput.value }),
    });

    taskInput.value = "";
    priorityInput.value = "medium";
    taskInput.focus();
    renderTasks();
  });

  searchInput.addEventListener("input", renderTasks);
  filterSelect.addEventListener("change", renderTasks);

  renderTasks();
}

async function renderTasks() {
  const listEl = document.getElementById("task-list");
  const emptyEl = document.getElementById("task-empty-state");
  const countEl = document.getElementById("task-count");
  const searchTerm = (document.getElementById("task-search")?.value || "").toLowerCase();
  const filter = document.getElementById("task-filter")?.value || "all";

  const res = await api("/api/tasks");
  if (!res.ok) {
    window.location.href = "index.html";
    return;
  }
  let tasks = await res.json();

  if (searchTerm) {
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(searchTerm));
  }
  if (filter === "active") {
    tasks = tasks.filter((t) => !t.completed);
  } else if (filter === "completed") {
    tasks = tasks.filter((t) => t.completed);
  }

  listEl.innerHTML = "";
  countEl.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;

  if (tasks.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.setAttribute("data-testid", "task-item");
    li.setAttribute("data-task-id", task.id);
    if (task.completed) li.classList.add("completed");

    li.innerHTML = `
      <label class="task-item__label">
        <input type="checkbox" data-testid="task-toggle" ${task.completed ? "checked" : ""} />
        <span class="task-item__title" data-testid="task-title">${escapeHtml(task.title)}</span>
      </label>
      <span class="task-item__priority priority-${task.priority}" data-testid="task-priority">${task.priority}</span>
      <div class="task-item__actions">
        <button type="button" data-testid="task-edit-btn" aria-label="Edit task">Edit</button>
        <button type="button" data-testid="task-delete-btn" aria-label="Delete task">Delete</button>
      </div>
    `;

    li.querySelector('[data-testid="task-toggle"]').addEventListener("change", async (e) => {
      await api(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: e.target.checked }),
      });
      renderTasks();
    });

    li.querySelector('[data-testid="task-delete-btn"]').addEventListener("click", async () => {
      await api(`/api/tasks/${task.id}`, { method: "DELETE" });
      renderTasks();
    });

    li.querySelector('[data-testid="task-edit-btn"]').addEventListener("click", () => {
      startEditingTask(li, task);
    });

    listEl.appendChild(li);
  });
}

function startEditingTask(li, task) {
  li.innerHTML = `
    <form class="task-item__edit-form" data-testid="task-edit-form">
      <input type="text" value="${escapeHtml(task.title)}" data-testid="task-edit-input" />
      <button type="submit" data-testid="task-save-btn">Save</button>
      <button type="button" data-testid="task-cancel-btn">Cancel</button>
    </form>
  `;

  const form = li.querySelector('[data-testid="task-edit-form"]');
  const input = li.querySelector('[data-testid="task-edit-input"]');
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newTitle = input.value.trim();
    if (newTitle) {
      await api(`/api/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: newTitle }),
      });
    }
    renderTasks();
  });

  li.querySelector('[data-testid="task-cancel-btn"]').addEventListener("click", () => {
    renderTasks();
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
