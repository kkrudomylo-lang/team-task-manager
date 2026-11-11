import { useState } from 'react';
import './Kanban.css';

function Kanban({ project, onBack }) {
  const [tasks, setTasks] = useState([
    { 
      id: 1, title: 'Сверстать страницу входа', status: 'done', assignee: 'Студент А', deadline: '10.11.2026',
      comments: [{ id: 1, author: 'Студент Б', text: 'Выглядит отлично!' }],
      history: [{ id: 1, text: 'Студент А перевел задачу в "Готово"' }]
    },
    { 
      id: 2, title: 'Написать API для логина', status: 'in-progress', assignee: 'Студент Б', deadline: '15.11.2026',
      comments: [], history: [{ id: 1, text: 'Студент А перевел задачу в "В процессе"' }]
    },
    { 
      id: 3, title: 'Создать базу данных', status: 'todo', assignee: 'Студент В', deadline: '20.11.2026',
      comments: [], history: [{ id: 1, text: 'Студент А создал задачу' }]
    },
    { 
      id: 4, title: 'Купить домен', status: 'todo', assignee: 'Студент В', deadline: '25.11.2026',
      comments: [], history: [{ id: 1, text: 'Студент А создал задачу' }]
    }
  ]);

  const [filterAssignee, setFilterAssignee] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');

  const moveTask = (taskId, newStatus, statusName) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newHistory = [...task.history, { id: Date.now(), text: `Студент А перевел задачу в "${statusName}"` }];
        return { ...task, status: newStatus, history: newHistory };
      }
      return task;
    }));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({ 
        ...prev, 
        status: newStatus, 
        history: [...prev.history, { id: Date.now(), text: `Студент А перевел задачу в "${statusName}"` }] 
      }));
    }
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment = { id: Date.now(), author: 'Студент А', text: newComment };
    setTasks(tasks.map(task => 
      task.id === selectedTask.id ? { ...task, comments: [...task.comments, comment] } : task
    ));
    setSelectedTask(prev => ({ ...prev, comments: [...prev.comments, comment] }));
    setNewComment('');
  };

  const filteredTasks = tasks.filter(t => filterAssignee === 'all' || t.assignee === filterAssignee);
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const renderTaskCard = (task) => (
    <div key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
      <h4>{task.title}</h4>
      <p>👤 {task.assignee}</p>
      <p className="deadline">📅 до {task.deadline}</p>
      <div className="task-actions" onClick={(e) => e.stopPropagation()}>
        {task.status === 'todo' && <button className="move-btn" onClick={() => moveTask(task.id, 'in-progress', 'В процессе')}>В работу →</button>}
        {task.status === 'in-progress' && <button className="move-btn" onClick={() => moveTask(task.id, 'done', 'Готово')}>Завершить ✓</button>}
      </div>
    </div>
  );

  return (
    <div className="kanban-container">
      <header className="kanban-header">
        <button className="back-btn" onClick={onBack}>← Назад к проектам</button>
        <h2>Проект: {project.title}</h2>
        <div className="header-controls">
          <div className="stats">📊 Выполнено: {doneCount} из {tasks.length}</div>
          <select className="filter-select" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
            <option value="all">Все исполнители</option>
            <option value="Студент А">Студент А</option>
            <option value="Студент Б">Студент Б</option>
            <option value="Студент В">Студент В</option>
          </select>
        </div>
      </header>

      <div className="kanban-board">
        <div className="kanban-column">
          <h3>📋 Надо сделать</h3>
          {filteredTasks.filter(t => t.status === 'todo').length === 0 && (
            <p className="empty-column-text">Нет задач</p>
          )}
          {filteredTasks.filter(t => t.status === 'todo').map(renderTaskCard)}
        </div>
        
        <div className="kanban-column">
          <h3>⚙️ В процессе</h3>
          {filteredTasks.filter(t => t.status === 'in-progress').length === 0 && (
            <p className="empty-column-text">Нет задач</p>
          )}
          {filteredTasks.filter(t => t.status === 'in-progress').map(renderTaskCard)}
        </div>
        
        <div className="kanban-column">
          <h3>✅ Готово</h3>
          {filteredTasks.filter(t => t.status === 'done').length === 0 && (
            <p className="empty-column-text">Нет задач</p>
          )}
          {filteredTasks.filter(t => t.status === 'done').map(renderTaskCard)}
        </div>
      </div>

      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTask.title}</h2>
              <button className="close-btn" onClick={() => setSelectedTask(null)}>✖</button>
            </div>
            
            <div className="modal-info">
              <p><strong>Исполнитель:</strong> {selectedTask.assignee}</p>
              <p><strong>Срок:</strong> {selectedTask.deadline}</p>
              <p><strong>Статус:</strong> {selectedTask.status === 'todo' ? 'Надо сделать' : selectedTask.status === 'in-progress' ? 'В процессе' : 'Готово'}</p>
            </div>

            <div className="modal-section">
              <h3>💬 Комментарии ({selectedTask.comments.length})</h3>
              <div className="comments-list">
                {selectedTask.comments.map(c => (
                  <div key={c.id} className="comment"><strong>{c.author}:</strong> {c.text}</div>
                ))}
                {selectedTask.comments.length === 0 && <p className="empty-text">Пока нет комментариев</p>}
              </div>
              <form onSubmit={addComment} className="comment-form">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Написать комментарий..." />
                <button type="submit">Отправить</button>
              </form>
            </div>

            <div className="modal-section">
              <h3>📜 Журнал изменений</h3>
              <ul className="history-list">
                {selectedTask.history.map(h => <li key={h.id}>{h.text}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kanban;