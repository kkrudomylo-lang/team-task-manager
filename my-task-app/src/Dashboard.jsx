import { useState } from 'react';
import Kanban from './Kanban';
import './Dashboard.css';

function Dashboard({ onLogout }) {
  const [projects] = useState([
    { id: 1, title: 'Разработка сайта', description: 'Создать фронтенд и бэкенд для курсовой', tasksCount: 12, role: 'Владелец' },
    { id: 2, title: 'Подготовка к экзамену', description: 'Повторить все лекции по веб-технологиям', tasksCount: 5, role: 'Участник' },
    { id: 3, title: 'Дизайн логотипа', description: 'Нарисовать логотип для нашего стартапа', tasksCount: 3, role: 'Наблюдатель' }
  ]);

  const [activeProject, setActiveProject] = useState(null);

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
          <button className="create-btn">+ Создать проект</button>
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
    </div>
  );
}

export default Dashboard;