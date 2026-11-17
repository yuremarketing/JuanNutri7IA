import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Database,
  Flame
} from 'lucide-react';

import SalaEntrevista from '../components/SalaEntrevista';

const TABS = [
  { 
    id: 'entrevista', 
    label: 'Sala de Entrevista (Grill-me)', 
    icon: Flame,
    description: 'Sabatina interativa para extrair suas condutas clínicas reais'
  },
];

export default function Governanca() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <div className="relative min-h-screen bg-[#090c10] text-[#f0f6fc] font-['Inter',sans-serif] overflow-x-hidden">
      {/* Elementos visuais animados de fundo */}
      <div className="background-elements pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top bar de navegação */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#00ff88] border border-white/10 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Dashboard</span>
            </Link>

            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  JuanNutri7 <span className="text-[#00ff88]">Governança</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Calibração da Base de Conhecimento Clínica (RAG)
                </p>
              </div>
            </div>
          </div>

          {/* Badges de status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-[#00ff88] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></span>
              Gemini 2.5 Flash Ativo
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firestore Sync</span>
            </div>
          </div>
        </header>

        {/* Hero Banner Informativo */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-teal-950/30 border border-emerald-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              Método Grill-me (Sabatina Clínica)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Extração de Conduta Clínica Direto da Mente do Juan
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              O assistente de IA questiona você como um comitê científico. Responda como você conduz suas consultas reais — 
              quando a conduta estiver clara, ela é aprovada e inserida imediatamente no cérebro do <span className="text-[#00ff88] font-semibold">Nutri7IA</span>.
            </p>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex gap-2 border-b border-white/10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-[#00ff88] text-[#00ff88] bg-emerald-500/10 rounded-t-xl shadow-[0_4px_12px_rgba(0,255,136,0.15)]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-t-xl'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00ff88]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Área Principal de Conteúdo */}
        <main className="rounded-3xl bg-[#14191e]/80 border border-white/10 p-4 sm:p-8 backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] relative">
          {activeTab === 'entrevista' && <SalaEntrevista />}
        </main>
      </div>
    </div>
  );
}
