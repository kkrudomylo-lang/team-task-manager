import { useState, useEffect } from 'react';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [error, setError] = useState('');
  
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  
  const [expandedTask, setExpandedTask] = useState(null);
  const [taskComments, setTaskComments] = useState({});
  const [newCommentText, setNewCommentText] = useState('');

  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:8080/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCurrentProject(data[0]);
          loadTasks(data[0].id);
        }
      })
      .catch(() => setError('Сервер недоступен'));
    }
  }, [token]);

  const loadTasks = async (projectId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/tasks?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (err) { console.error(err); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    const url = isLogin ? 'http://localhost:8080/api/login' : 'http://localhost:8080/api/register';
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.error) setError(data.error);
      else if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else if (!isLogin) {
        alert('Регистрация успешна! Теперь войдите.');
        setIsLogin(true);
      }
    } catch (err) { setError('Ошибка сервера'); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!currentProject) return;
    try {
      const res = await fetch('http://localhost:8080/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          title: taskTitle, assignee: taskAssignee, deadline: taskDeadline, project_id: currentProject.id 
        })
      });
      if (res.ok) {
        setTaskTitle(''); setTaskAssignee(''); setTaskDeadline('');
        loadTasks(currentProject.id);
      }
    } catch (err) { setError('Ошибка'); }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    loadTasks(currentProject.id);
  };

  const confirmDeleteTask = async () => {
    if (!deleteConfirmId) return;
    try {
      await fetch(`http://localhost:8080/api/tasks/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Мгновенно убираем задачу с экрана, не делая повторный запрос
      setTasks(prevTasks => prevTasks.filter(t => t.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setOpenMenuId(null);
    } catch (err) { 
      setError('Ошибка при удалении'); 
    }
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditAssignee(task.assignee || '');
    setEditDeadline(task.deadline || '');
    setOpenMenuId(null);
  };

  const saveEdit = async (taskId) => {
    try {
      await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          title: editTitle, 
          assignee: editAssignee, 
          deadline: editDeadline 
        })
      });
      setEditingTaskId(null);
      loadTasks(currentProject.id);
    } catch (err) { setError('Ошибка редактирования'); }
  };

  const toggleComments = async (taskId) => {
    if (expandedTask === taskId) return setExpandedTask(null);
    setExpandedTask(taskId);
    if (!taskComments[taskId]) {
      const res = await fetch(`http://localhost:8080/api/tasks/${taskId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setTaskComments(prev => ({ ...prev, [taskId]: data }));
    }
  };

  const addComment = async (taskId) => {
    if (!newCommentText.trim()) return;
    await fetch(`http://localhost:8080/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text: newCommentText })
    });
    setNewCommentText('');
    const res = await fetch(`http://localhost:8080/api/tasks/${taskId}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) setTaskComments(prev => ({ ...prev, [taskId]: data }));
  };

  if (token && currentProject) {
    return (
      <div className="container">
        
        {deleteConfirmId && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0 }}>Вы уверены?</h3>
              <p style={{ color: '#555' }}>Это действие нельзя будет отменить.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                <button onClick={confirmDeleteTask} style={{ backgroundColor: '#e74c3c', padding: '10px 20px', width: 'auto' }}>Да</button>
                <button onClick={() => setDeleteConfirmId(null)} style={{ backgroundColor: '#6c757d', padding: '10px 20px', width: 'auto' }}>Нет</button>
              </div>
            </div>
          </div>
        )}

        <div className="header-bar">
          <h2 style={{ color: '#333' }}>Добро пожаловать!</h2>
          <button onClick={() => { localStorage.removeItem('token'); setToken(''); window.location.reload(); }} className="btn-logout">Выйти</button>
        </div>

        <div className="create-task-form">
          <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <input type="text" placeholder="Название задачи" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required style={{ flex: 2, margin: 0 }} />
            <input type="text" placeholder="Исполнитель" value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} style={{ flex: 1, margin: 0 }} />
            <input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} style={{ flex: 1, margin: 0 }} />
            <button type="submit">Создать</button>
          </form>
        </div>

        <div className="kanban-board">
          {['todo', 'in-progress', 'done'].map(status => {
            const filteredTasks = tasks.filter(t => t.status === status);
            
            return (
              <div key={status} className="kanban-column">
                <h4 style={{ color: '#555' }}>
                  {status === 'todo' ? 'Дела' : status === 'in-progress' ? 'В работе' : 'Готово'}
                </h4>

                {filteredTasks.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginTop: '20px' }}>
                    Пока нет задач
                  </p>
                )}

                {filteredTasks.map(task => {
                  if (editingTaskId === task.id) {
                    return (
                      <div key={task.id} className="task-card" style={{ padding: '10px' }}>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Название" style={{ width: '100%', marginBottom: '8px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        <input type="text" value={editAssignee} onChange={e => setEditAssignee(e.target.value)} placeholder="Исполнитель" style={{ width: '100%', marginBottom: '8px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        <input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => saveEdit(task.id)} style={{ backgroundColor: '#28a745', padding: '6px', fontSize: '12px', borderRadius: '4px', border: 'none', color: 'white', cursor: 'pointer', flex: 1 }}>Сохранить</button>
                          <button onClick={() => setEditingTaskId(null)} style={{ backgroundColor: '#6c757d', padding: '6px', fontSize: '12px', borderRadius: '4px', border: 'none', color: 'white', cursor: 'pointer', flex: 1 }}>Отмена</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={task.id} className="task-card" style={{ position: 'relative' }}>
                      <button onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', width: 'auto', color: '#666', padding: '0 5px' }}>⋮</button>

                      {openMenuId === task.id && (
                        <div style={{ position: 'absolute', top: '25px', right: '5px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: 10, display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                          <button onClick={() => startEdit(task)} style={{ background: 'white', color: '#333', textAlign: 'left', padding: '8px', border: 'none', borderBottom: '1px solid #eee', fontSize: '12px', margin: 0 }}>Редактировать</button>
                          <button onClick={() => handleUpdateStatus(task.id, 'done')} style={{ background: 'white', color: '#333', textAlign: 'left', padding: '8px', border: 'none', borderBottom: '1px solid #eee', fontSize: '12px', margin: 0 }}>Готово</button>
                          <button onClick={() => setDeleteConfirmId(task.id)} style={{ background: 'white', color: '#e74c3c', textAlign: 'left', padding: '8px', border: 'none', fontSize: '12px', margin: 0 }}>Удалить</button>
                        </div>
                      )}

                      <strong>{task.title}</strong>
                      <div className="task-info">Исполнитель: {task.assignee || 'Не назначен'}</div>
                      <div className="task-info">Дедлайн: {task.deadline || 'Нет'}</div>
                      
                      <select value={task.status} onChange={(e) => handleUpdateStatus(task.id, e.target.value)} style={{ marginTop: '5px' }}>
                        <option value="todo">Дело</option>
                        <option value="in-progress">В работе</option>
                        <option value="done">Готово</option>
                      </select>

                      <button onClick={() => toggleComments(task.id)} className="btn-comments">
                        {expandedTask === task.id ? 'Скрыть' : 'Комментарии'}
                      </button>
                      
                      {expandedTask === task.id && (
                        <div className="comments-block">
                          {taskComments[task.id]?.map(c => (
                            <div key={c.id} className="comment-item"><b>{c.author}:</b> {c.text}</div>
                          ))}
                          <div className="comment-input-wrapper">
                            <input type="text" placeholder="Написать..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} />
                            <button onClick={() => addComment(task.id)}>OK</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2 style={{ color: '#333' }}>Добро пожаловать!</h2>
      <p style={{color: '#7f8c8d', marginBottom: '20px', fontSize: '14px'}}>
        {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
      </p>
      {error && <p style={{color: '#e74c3c', fontSize: '14px'}}>{error}</p>}
      <form onSubmit={handleAuth}>
        {!isLogin && <input type="text" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} required />}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
      </form>
      <span className="link" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
      </span>
    </div>
  );
}

export default App;