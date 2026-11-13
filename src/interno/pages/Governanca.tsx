import { useState } from 'react';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import SalaEntrevista from '../components/SalaEntrevista';

const TABS = [
  { id: 'entrevista', label: 'Sala de Entrevista', icon: MessageSquare },
];

export default function Governanca() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">JuanNutri7 Governança</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Onde a conduta clínica real do Juan é extraída e validada antes de alimentar o RAG.
          </p>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {activeTab === 'entrevista' && <SalaEntrevista />}
        </div>
      </div>
    </div>
  );
}
