const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const VALID_USER = { username: "admin", password: "password123" };

// ---- In-memory "database" ----
let tasks = [
  { id: crypto.randomUUID(), title: "Write test plan", priority: "high", completed: false },
  { id: crypto.randomUUID(), title: "Review pull request", priority: "medium", completed: false },
  { id: crypto.randomUUID(), title: "Update documentation", priority: "low", completed: true },
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "taskflow-demo-secret", // fine for local/demo use only
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// ---- Auth routes ----
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};

  // simulate a bit of network/processing latency, useful for testing loading states
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (username === VALID_USER.username && password === VALID_USER.password) {
    req.session.user = { username };
    return res.json({ username });
  }
  return res.status(401).json({ error: "Invalid username or password." });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.session.user);
});

// ---- Task routes ----
app.get("/api/tasks", requireAuth, (req, res) => {
  res.json(tasks);
});

app.post("/api/tasks", requireAuth, (req, res) => {
  const { title, priority } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Title is required." });
  }
  const task = {
    id: crypto.randomUUID(),
    title: String(title).trim(),
    priority: priority || "medium",
    completed: false,
  };
  tasks.push(task);
  res.status(201).json(task);
});

app.put("/api/tasks/:id", requireAuth, (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found." });
  Object.assign(task, req.body);
  res.json(task);
});

app.delete("/api/tasks/:id", requireAuth, (req, res) => {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== req.params.id);
  if (tasks.length === before) return res.status(404).json({ error: "Task not found." });
  res.status(204).end();
});

// Endpoint for tests to reset state between runs, since there's no real DB
app.post("/api/test/reset", (req, res) => {
  tasks = [
    { id: crypto.randomUUID(), title: "Write test plan", priority: "high", completed: false },
    { id: crypto.randomUUID(), title: "Review pull request", priority: "medium", completed: false },
    { id: crypto.randomUUID(), title: "Update documentation", priority: "low", completed: true },
  ];
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`TaskFlow server running at http://localhost:${PORT}`);
});
