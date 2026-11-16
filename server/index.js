app.delete('/api/tasks/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE task_id = ?').run(req.params.id);
    db.prepare('DELETE FROM changelog WHERE task_id = ?').run(req.params.id);
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({ message: 'Задача удалена' });
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