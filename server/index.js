const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

const port = process.env.PORT || 8080;

// Разрешаем запросы с фронтенда и чтение JSON
app.use(cors());
app.use(express.json());

// Подключение к базе данных PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


// --- "ОХРАННИК" (Проверка токена) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Формат: "Bearer ТОКЕН"

  if (!token) {
    return res.status(401).json({ error: 'Доступ запрещен. Вы не авторизованы.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный или просроченный токен.' });
    }
    req.user = user;
    next();
  });
};

// --- МАРШРУТЫ АВТОРИЗАЦИИ ---

// 1. Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Проверяем, есть ли уже такой юзер
    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хэшируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Сохраняем
    const newUser = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    res.json({ message: 'Пользователь успешно создан', user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. Логин (Вход)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    // Создаем токен
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ 
      message: 'Успешный вход', 
      token: token, 
      user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- МАРШРУТЫ ДЛЯ ЗАДАЧ (ТЕПЕРЬ ПОД ЗАЩИТОЙ) ---

// 3. Получить все задачи
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Создать новую задачу
app.post('/api/tasks', authenticateToken, async (req, res) => {
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});
// Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${port}`);
});