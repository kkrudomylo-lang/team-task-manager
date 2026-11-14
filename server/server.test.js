const request = require('supertest');
const express = require('express');

// Создаем тестовое приложение Express
const app = express();
app.use(express.json()); // ОБЯЗАТЕЛЬНО для чтения JSON

// Настройка маршрутов (имитация твоего сервера)
app.get('/api/tasks', (req, res) => {
  res.status(200).json([]);
});

app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Название обязательно' });
  }
  res.status(201).json({ id: 1, title, status: 'todo' });
});

// --- ТЕСТЫ ---

test('1. GET /api/tasks возвращает 200 OK и пустой массив', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([]);
});

test('2. POST /api/tasks создает задачу с валидными данными', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: 'Новая задача' });
  expect(res.statusCode).toBe(201);
  expect(res.body.title).toBe('Новая задача');
});

test('3. POST /api/tasks возвращает 400 при пустом названии', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: '' });
  expect(res.statusCode).toBe(400);
  expect(res.body.error).toBe('Название обязательно');
});

test('4. GET /api/unknown возвращает 404', async () => {
  const res = await request(app).get('/api/unknown');
  expect(res.statusCode).toBe(404);
});

test('5. Ответ сервера имеет правильную структуру (массив)', async () => {
  const res = await request(app).get('/api/tasks');
  expect(Array.isArray(res.body)).toBe(true);
});