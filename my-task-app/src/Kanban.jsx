import { useState } from 'react';
import './Kanban.css';

function Kanban({ project, onBack }) {
  // Фейковые задачи для этого проекта
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Сверстать страницу входа', status: 'done', assignee: 'Студент А' },
    { id: 2, title: 'Написать API для логина', status: 'in-progress', assignee: 'Студент Б' },
    { id: 3, title: 'Создать базу данных', status: 'todo', assignee: 'Студент В' },
    { id: 4, title: 'Купить домен', status: 'todo', assignee: 'Студент В' }
  ]);

  // Функция для перемещения задачи в следующий статус
  const moveTask = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  return (
    <div className="kanban-container">
      <header className="kanban-header">
        <button className="back-btn" onClick={onBack}>← Назад к проектам</button>
        <h2>Проект: {project.title}</h2>
      </header>

      <div className="kanban-board">
        {/* Колонка 1: Надо сделать */}
        <div className="kanban-column">
          <h3>📋 Надо сделать</h3>
          {tasks.filter(t => t.status === 'todo').map(task => (
            <div key={task.id} className="task-card">
              <h4>{task.title}</h4>
              <p>👤 {task.assignee}</p>
              <button className="move-btn" onClick={() => moveTask(task.id, 'in-progress')}>В работу →</button>
            </div>
          ))}
        </div>

        {/* Колонка 2: В процессе */}
        <div className="kanban-column">
          <h3>⚙️ В процессе</h3>
          {tasks.filter(t => t.status === 'in-progress').map(task => (
            <div key={task.id} className="task-card">
              <h4>{task.title}</h4>
              <p>👤 {task.assignee}</p>
              <button className="move-btn" onClick={() => moveTask(task.id, 'done')}>Завершить ✓</button>
            </div>
          ))}
        </div>

        {/* Колонка 3: Готово */}
        <div className="kanban-column">
          <h3>✅ Готово</h3>
          {tasks.filter(t => t.status === 'done').map(task => (
            <div key={task.id} className="task-card">
              <h4>{task.title}</h4>
              <p>👤 {task.assignee}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Kanban;