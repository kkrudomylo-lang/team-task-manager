const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Разрешаем запросы с фронтенда
app.use(cors());
app.use(express.json()); // Чтобы читать JSON из запросов

// Подключение к базе данных PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Обязательно для облачных баз типа Neon
});

// Проверка подключения и создание таблицы при старте
pool.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'todo',
    assignee VARCHAR(100),
    deadline VARCHAR(50)
  );
`).then(() => console.log('✅ База данных подключена и таблица создана'))
  .catch(err => console.error('❌ Ошибка базы данных:', err));

// --- МАРШРУТЫ (API) ---

// 1. Получить все задачи (GET)
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Создать новую задачу (POST)
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, status, assignee, deadline } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (title, status, assignee, deadline) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, status || 'todo', assignee, deadline]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});