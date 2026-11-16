const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
    UNIQUE(project_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    assignee TEXT,
    deadline TEXT,
    project_id INTEGER REFERENCES projects(id)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    text TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS changelog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT
  );
`);

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Нет токена' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
};

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const stmtCheck = db.prepare('SELECT * FROM users WHERE email = ?');
    if (stmtCheck.get(email)) return res.status(400).json({ error: 'Email уже занят' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
    const info = stmt.run(email, hashedPassword, name);
    res.json({ message: 'Пользователь создан', user: { id: info.lastInsertRowid, email, name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    if (!user) return res.status(400).json({ error: 'Неверный email или пароль' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Неверный email или пароль' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Успешный вход', token: token, user: { id: user.id, name: user.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/projects', auth, (req, res) => {
  try {
    const { name, description } = req.body;
    const owner_id = req.user.id;
    const stmt = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)');
    const info = stmt.run(name, description, owner_id);
    const projectId = info.lastInsertRowid;
    const stmtMember = db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
    stmtMember.run(projectId, owner_id, 'owner');
    res.json({ id: projectId, name, description, owner_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/projects', auth, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.*, pm.role FROM projects p
      JOIN project_members pm ON pm.project_id = p.id
      WHERE pm.user_id = ?
    `);
    res.json(stmt.all(req.user.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tasks', auth, (req, res) => {
  try {
    const { status, assignee, project_id } = req.query;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (assignee) { query += ' AND assignee = ?'; params.push(assignee); }
    if (project_id) { query += ' AND project_id = ?'; params.push(project_id); }
    const stmt = db.prepare(query);
    res.json(stmt.all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks', auth, (req, res) => {
  try {
    const { title, status, assignee, deadline, project_id } = req.body;
    const stmt = db.prepare('INSERT INTO tasks (title, status, assignee, deadline, project_id) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(title, status || 'todo', assignee, deadline, project_id);
    res.json({ id: info.lastInsertRowid, title, status, assignee, deadline, project_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tasks/:id', auth, (req, res) => {
  try {
    const stmtOld = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const oldTask = stmtOld.get(req.params.id);
    if (!oldTask) return res.status(404).json({ error: 'Задача не найдена' });
    const { title, status, assignee, deadline } = req.body;
    const stmt = db.prepare(`
      UPDATE tasks SET 
        title = COALESCE(?, title),
        status = COALESCE(?, status),
        assignee = COALESCE(?, assignee),
        deadline = COALESCE(?, deadline)
      WHERE id = ?
    `);
    stmt.run(title, status, assignee, deadline, req.params.id);
    const stmtLog = db.prepare('INSERT INTO changelog (task_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)');
    stmtLog.run(req.params.id, req.user.id, 'update', JSON.stringify(oldTask), JSON.stringify(req.body));
    res.json({ message: 'Задача обновлена' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// УДАЛЕНИЕ ЗАДАЧИ
app.delete('/api/tasks/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE task_id = ?').run(req.params.id);
    db.prepare('DELETE FROM changelog WHERE task_id = ?').run(req.params.id);
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({ message: 'Задача удалена' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks/:taskId/comments', auth, (req, res) => {
  try {
    const { text } = req.body;
    const stmt = db.prepare('INSERT INTO comments (task_id, user_id, text) VALUES (?, ?, ?)');
    const info = stmt.run(req.params.taskId, req.user.id, text);
    res.json({ id: info.lastInsertRowid, text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tasks/:taskId/comments', auth, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT c.*, u.name as author FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.task_id = ? ORDER BY c.id
    `);
    res.json(stmt.all(req.params.taskId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tasks/:taskId/changelog', auth, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT cl.*, u.name as author FROM changelog cl
      JOIN users u ON u.id = cl.user_id
      WHERE cl.task_id = ? ORDER BY cl.id DESC
    `);
    res.json(stmt.all(req.params.taskId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT} (SQLite)`);
});