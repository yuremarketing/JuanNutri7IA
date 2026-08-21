import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const demoBtnRef = useRef<HTMLButtonElement>(null);
  const [demoState, setDemoState] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    // Add interactive glow effect on cards based on mouse position
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.card.glow');
      cards.forEach(card => {
        const htmlCard = card as HTMLElement;
        const rect = htmlCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        htmlCard.style.background = `
          radial-gradient(
            800px circle at ${x}px ${y}px, 
            rgba(0, 255, 136, 0.06),
            transparent 40%
          )
        `;
      });
    };

    const handleMouseLeave = () => {
      const cards = document.querySelectorAll('.card.glow');
      cards.forEach(card => {
        (card as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
      });
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const orbs = document.querySelectorAll('.orb');

      orbs.forEach((orb, index) => {
        const speed = (index + 1) * 20;
        const xOffset = (window.innerWidth / 2 - e.pageX) / speed;
        const yOffset = (window.innerHeight / 2 - e.pageY) / speed;
        
        (orb as HTMLElement).style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    
    const cards = document.querySelectorAll('.card.glow');
    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove as any);
      card.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove as any);
        card.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  const handleDemoClick = () => {
    setDemoState('loading');
    setTimeout(() => {
      setDemoState('success');
      setTimeout(() => {
        setDemoState('idle');
      }, 3000);
    }, 1500);
  };

  return (
    <>
      <div className="background-elements">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="glass-container">
        <aside className="sidebar">
          <div className="brand">
            <div className="logo">
              <i className="ri-leaf-fill"></i>
            </div>
            <h2>Nutri7IA</h2>
          </div>
          
          <nav className="menu">
            <Link to="/" className="active"><i className="ri-dashboard-line"></i> Dashboard</Link>
            <Link to="#"><i className="ri-group-line"></i> Pacientes</Link>
            <Link to="#"><i className="ri-brain-line"></i> Triagem IA</Link>
            <Link to="#"><i className="ri-camera-lens-line"></i> Visão Comp.</Link>
            <Link to="/briefing"><i className="ri-file-list-3-line"></i> Briefing Marketing</Link>
            <Link to="#"><i className="ri-settings-4-line"></i> Configurações</Link>
          </nav>

          <div className="user-profile">
            <div className="avatar">
              <img src="https://avatars.githubusercontent.com/juanpablonutri7" alt="Juan Pablo" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Juan+Pablo&background=0D8B6D&color=fff' }} />
            </div>
            <div className="user-info">
              <h4>Juan Pablo</h4>
              <span>Nutricionista Chefe</span>
            </div>
          </div>
        </aside>

        <main className="content">
          <header className="topbar">
            <div className="greeting">
              <h1>Bem-vindo ao futuro, Juan! 👋</h1>
              <p>Seu sistema de atendimento nutricional com IA está em fase de preparação.</p>
            </div>
            <div className="actions">
              <button 
                className="btn-primary" 
                id="btn-demo"
                ref={demoBtnRef}
                onClick={handleDemoClick}
                style={demoState === 'success' ? { background: '#00cc6a' } : {}}
              >
                {demoState === 'idle' && <><i className="ri-play-circle-line"></i> Iniciar Demo</>}
                {demoState === 'loading' && <><i className="ri-loader-4-line" style={{animation: 'spin 1s linear infinite'}}></i> Inicializando...</>}
                {demoState === 'success' && <><i className="ri-check-line"></i> Módulos IA Ativados</>}
              </button>
              <div className="notification">
                <i className="ri-notification-3-line"></i>
                <span className="badge">3</span>
              </div>
            </div>
          </header>

          <div className="dashboard-grid">
            {/* RAG INTAKE ALERT */}
            <div className="card-full bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex items-center justify-between col-span-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">Ação Necessária: Base de Conhecimento IA (RAG)</h3>
                  <p className="text-amber-700">A Inteligência Artificial precisa do seu conhecimento técnico para avançar com o desenvolvimento (Issue #12).</p>
                </div>
              </div>
              <Link 
                to="/rag-intake"
                className="px-6 py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors whitespace-nowrap shadow-md shadow-amber-200"
              >
                Completar Base de Conhecimento da IA
              </Link>
            </div>

            <div className="card stat-card glow">
              <div className="stat-icon"><i className="ri-user-heart-line"></i></div>
              <div className="stat-details">
                <h3>Pacientes</h3>
                <h2>0</h2>
                <span className="trend up"><i className="ri-arrow-up-line"></i> Capacidade p/ 100+</span>
              </div>
            </div>

            <div className="card stat-card glow">
              <div className="stat-icon"><i className="ri-robot-2-line"></i></div>
              <div className="stat-details">
                <h3>Triagens IA</h3>
                <h2>Automatizadas</h2>
                <span className="status-badge success">Pronto em breve</span>
              </div>
            </div>

            <div className="card stat-card glow">
              <div className="stat-icon"><i className="ri-camera-3-line"></i></div>
              <div className="stat-details">
                <h3>Leitura de Geladeira</h3>
                <h2>Visão Comp.</h2>
                <span className="status-badge warning">Em desenvolvimento</span>
              </div>
            </div>

            <div className="card epic-summary">
              <div className="card-header">
                <h3><i className="ri-book-read-line"></i> Resumo da Epic (Projeto)</h3>
              </div>
              <div className="card-body">
                <ul className="features-list">
                  <li style={{ '--delay': 1 } as any}><i className="ri-checkbox-blank-circle-line text-gray-500"></i> <strong>US01:</strong> Triagem inicial automatizada de perfil. <span className="text-xs text-gray-500 ml-2">(Não iniciada)</span></li>
                  <li style={{ '--delay': 2 } as any}><i className="ri-checkbox-blank-circle-line text-gray-500"></i> <strong>US02:</strong> Anamnese e coleta de hábitos alimentares estruturados. <span className="text-xs text-gray-500 ml-2">(Não iniciada)</span></li>
                  <li style={{ '--delay': 3 } as any}><i className="ri-checkbox-blank-circle-line text-gray-500"></i> <strong>US03:</strong> Segmentação metabólica inteligente (Atleta, Estética, etc). <span className="text-xs text-gray-500 ml-2">(Não iniciada)</span></li>
                  <li style={{ '--delay': 4 } as any}><i className="ri-checkbox-blank-circle-line text-gray-500"></i> <strong>US04:</strong> Identificação de insumos na geladeira e lista de compras. <span className="text-xs text-gray-500 ml-2">(Não iniciada)</span></li>
                  <li style={{ '--delay': 5 } as any}><i className="ri-checkbox-blank-circle-line text-gray-500"></i> <strong>US05:</strong> Acompanhamento diário da adesão e feedbacks. <span className="text-xs text-gray-500 ml-2">(Não iniciada)</span></li>
                  <li style={{ '--delay': 6 } as any}><i className="ri-checkbox-blank-circle-line text-gray-500"></i> <strong>US06:</strong> Agendamento automático de consultas online. <span className="text-xs text-gray-500 ml-2">(Não iniciada)</span></li>
                </ul>
              </div>
            </div>
            
            <div className="card action-card">
              <div className="illustration">
                <i className="ri-rocket-2-line"></i>
              </div>
              <h3>Tudo pronto para decolar!</h3>
              <p>O ambiente do projeto já foi configurado. Você foi adicionado como colaborador e a Epic foi criada no repositório.</p>
              <a href="https://github.com/yuremarketing/JuanNutri7IA" target="_blank" rel="noreferrer" className="btn-secondary">Acessar Repositório</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
