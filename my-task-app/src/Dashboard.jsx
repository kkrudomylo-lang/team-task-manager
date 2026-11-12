import { useState } from 'react';
import Kanban from './Kanban';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [projects, setProjects] = useState([
    { id: 1, title: 'Разработка сайта', description: 'Создать фронтенд и бэкенд для курсовой', tasksCount: 12, role: 'Владелец' },
    { id: 2, title: 'Подготовка к экзамену', description: 'Повторить все лекции по веб-технологиям', tasksCount: 5, role: 'Участник' },
    { id: 3, title: 'Дизайн логотипа', description: 'Нарисовать логотип для нашего стартапа', tasksCount: 3, role: 'Наблюдатель' }
  ]);

  const [activeProject, setActiveProject] = useState(null);
  
  // Состояния для нашей формы создания проекта
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Функция, которая срабатывает при нажатии на "Создать" в форме
  const handleCreateProject = (e) => {
    e.preventDefault(); // Чтобы страница не перезагружалась
    
    if (!newTitle.trim()) return; // Если название пустое, ничего не делаем

    // Создаем новый проект
    const newProject = {
      id: Date.now(), // Уникальный ID
      title: newTitle,
      description: newDesc || 'Описание не добавлено',
      tasksCount: 0,
      role: 'Владелец'
    };

    setProjects([...projects, newProject]); // Добавляем в список
    setIsModalOpen(false); // Закрываем окно
    setNewTitle(''); // Очищаем поля
    setNewDesc('');
  };

  if (activeProject) {
    return <Kanban project={activeProject} onBack={() => setActiveProject(null)} />;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">TeamTask</div>
        <div className="user-info">
          <span>Привет, Студент А!</span>
          <button className="logout-btn" onClick={onLogout}>Выйти</button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="dashboard-top">
          <h2>Мои проекты</h2>
          {/* Добавили onClick, чтобы открывалось окно */}
          <button className="create-btn" onClick={() => setIsModalOpen(true)}>
            + Создать проект
          </button>
        </div>
        
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3>{project.title}</h3>
                <span className="role-badge">{project.role}</span>
              </div>
              <p>{project.description}</p>
              <div className="project-card-footer">
                <span>📋 Задач: {project.tasksCount}</span>
                <button className="open-board-btn" onClick={() => setActiveProject(project)}>Открыть →</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ЭТО ОКНО ПОЯВИТСЯ, ЕСЛИ isModalOpen === true */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать проект</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✖</button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              <div className="input-group">
                <label>Название:</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="Например: Новый проект" 
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Описание:</label>
                <textarea 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)} 
                  placeholder="Кратко о проекте..."
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-btn">Создать проект</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;