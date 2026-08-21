import { useState } from 'react';
import { Target, Users, Smartphone, Gift, ShieldCheck, LayoutList, ChevronRight, ChevronLeft, CheckCircle2, Save, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/config/firebase';

interface Question {
  id: string;
  type: 'radio' | 'text' | 'textarea';
  text: string;
  options?: string[];
}

interface Section {
  id: string;
  title: string;
  icon: any;
  description: string;
  questions: Question[];
}

const sections: Section[] = [
  {
    id: 'objetivos',
    title: 'Objetivos da Campanha',
    icon: Target,
    description: 'O que queremos alcançar nas próximas semanas.',
    questions: [
      { id: 'q1', type: 'radio', text: '1. Qual é o principal objetivo desta ação de marketing?', options: ['Lotar a agenda de consultas', 'Vender pacotes online', 'Criar lista de espera para o Nutri7IA', 'Aumentar a autoridade/seguidores'] },
      { id: 'q2', type: 'text', text: '2. Qual é a meta quantitativa ideal? (Ex: +20 consultas, +500 seguidores)' },
      { id: 'q3', type: 'radio', text: '3. Qual é o foco principal de atendimento agora?', options: ['Presencial (Consultório)', 'Online (Teleconsulta)', 'Híbrido'] },
      { id: 'q4', type: 'radio', text: '4. Qual é o prazo/duração planeado para esta campanha?', options: ['1 semana (Urgência)', '2 semanas', '1 mês contínuo'] },
      { id: 'q5', type: 'radio', text: '5. Qual é a disponibilidade de orçamento para anúncios pagos?', options: ['Zero (Apenas orgânico)', 'Baixo (Testes iniciais)', 'Médio/Alto (Escala)'] },
    ]
  },
  {
    id: 'publico',
    title: 'Público-Alvo',
    icon: Users,
    description: 'Com quem vamos falar prioritariamente agora.',
    questions: [
      { id: 'q6', type: 'radio', text: '6. Qual perfil de paciente queremos atrair mais nesta campanha?', options: ['Atleta (Performance/Hipertrofia)', 'Clínico Geral (Saúde/Exames)', 'Estética (Emagrecimento/Definição)'] },
      { id: 'q7', type: 'radio', text: '7. Qual a faixa etária predominante deste público?', options: ['18 a 25 anos', '26 a 35 anos', '36 a 50 anos', 'Mais de 50 anos'] },
      { id: 'q8', type: 'textarea', text: '8. Qual é a maior dor ou frustração que este paciente relata na 1ª consulta?' },
      { id: 'q9', type: 'textarea', text: '9. Qual é o maior desejo ou "sonho" desse paciente com a nutrição?' },
      { id: 'q10', type: 'radio', text: '10. Qual o nível de consciência do público que vamos abordar?', options: ['Público Quente (Já o conhecem)', 'Público Frio (Não o conhecem)', 'Misto'] },
    ]
  },
  {
    id: 'produto',
    title: 'Produto & Nutri7IA',
    icon: Smartphone,
    description: 'Como vamos integrar a inovação do seu novo software.',
    questions: [
      { id: 'q11', type: 'radio', text: '11. Que funcionalidade do Nutri7IA (em desenvolvimento) vamos destacar como "Em breve"?', options: ['Visão Computacional do Frigorífico', 'Triagem IA', 'Monitorização em Tempo Real', 'Não mencionar o Nutri7IA agora'] },
      { id: 'q12', type: 'radio', text: '12. Qual será o tom usado ao falar da IA?', options: ['Inovação e Modernidade', 'Facilidade e Praticidade na rotina', 'Precisão Clínica e Científica'] },
      { id: 'q13', type: 'textarea', text: '13. O que os seus pacientes atuais mais elogiam no seu acompanhamento?' },
      { id: 'q14', type: 'radio', text: '14. Deseja criar um formulário de "Lista de Espera Vip" para o Nutri7IA?', options: ['Sim, para captar leads', 'Ainda não, focar nas consultas atuais'] },
      { id: 'q15', type: 'textarea', text: '15. Como a consulta com o Juan Pablo hoje já prepara o paciente para a chegada do software?' },
    ]
  },
  {
    id: 'oferta',
    title: 'Oferta & Ganchos',
    icon: Gift,
    description: 'O que vamos entregar para captar a atenção.',
    questions: [
      { id: 'q16', type: 'radio', text: '16. Qual será o gancho principal para chamar a atenção?', options: ['Tecnologia Exclusiva', 'Método Clínico Comprovado', 'Conteúdo de Alto Valor Gratuito'] },
      { id: 'q17', type: 'radio', text: '17. Vamos usar algum "Lead Magnet" (Isca Digital)?', options: ['E-book de Receitas', 'Quiz de Triagem Interativo', 'Nenhum, direto para o WhatsApp'] },
      { id: 'q18', type: 'textarea', text: '18. Qual é a objeção mais comum para não marcarem consulta (Preço, Distância, etc.)?' },
      { id: 'q19', type: 'textarea', text: '19. Qual é o seu maior diferencial perante outros nutricionistas?' },
      { id: 'q20', type: 'radio', text: '20. Qual será a Chamada para Ação (CTA) principal?', options: ['Mensagem para o WhatsApp', 'Link para o site/agendamento', 'Comentar numa publicação'] },
    ]
  },
  {
    id: 'etica',
    title: 'Ética & CFN',
    icon: ShieldCheck,
    description: 'Garantindo o cumprimento das normas do conselho.',
    questions: [
      { id: 'q21', type: 'radio', text: '21. Confirma que a campanha não fará promessas de "resultados milagrosos"?', options: ['Sim, confirmo', 'Preciso de rever a copy final'] },
      { id: 'q22', type: 'radio', text: '22. Tem casos de sucesso com autorização expressa para uso em marketing?', options: ['Sim (Em texto/vídeo)', 'Sim (Com fotos autorizadas)', 'Não, melhor não usar'] },
      { id: 'q23', type: 'textarea', text: '23. Existe algum termo comum no marketing fitness que o Juan proíbe (ex: "Secar em 30 dias")?' },
      { id: 'q24', type: 'textarea', text: '24. Como prefere abordar a perda de peso/hipertrofia garantindo o rigor clínico?' },
      { id: 'q25', type: 'radio', text: '25. O CRN 27717/P estará visível em todos os materiais gerados?', options: ['Sim, obrigatoriamente', 'Apenas na bio do Instagram'] },
    ]
  },
  {
    id: 'logistica',
    title: 'Logística & Formatos',
    icon: LayoutList,
    description: 'Onde e como vamos publicar o conteúdo.',
    questions: [
      { id: 'q26', type: 'radio', text: '26. Que formato de conteúdo prefere criar?', options: ['Vídeos (Reels/Stories a falar)', 'Carrosséis (Design/Texto)', 'Misto'] },
      { id: 'q27', type: 'radio', text: '27. Qual a frequência ideal de publicações para o Juan aprovar?', options: ['Diária', '3x por semana', 'Apenas em campanha específica'] },
      { id: 'q28', type: 'radio', text: '28. Em que canais vamos focar?', options: ['Apenas Instagram', 'Instagram + WhatsApp', 'Múltiplas redes (Insta, TikTok, Ads)'] },
      { id: 'q29', type: 'radio', text: '29. Tem disponibilidade para gravar vídeos roteirizados pela IA?', options: ['Sim, alta disponibilidade', 'Sim, mas vídeos curtos', 'Não, prefiro formatos escritos/visuais'] },
      { id: 'q30', type: 'radio', text: '30. Quem fará o atendimento inicial no WhatsApp quando o lead chegar?', options: ['O próprio Juan', 'Assistente/Secretária', 'O Bot/Triagem Automática'] },
    ]
  }
];

export default function BriefingApp() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentSection = sections[currentSectionIndex];

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = async () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsSaving(true);
      try {
        await addDoc(collection(db, 'briefings'), {
          ...answers,
          timestamp: serverTimestamp()
        });
        setIsCompleted(true);
      } catch (error) {
        console.error("Erro ao salvar briefing:", error);
        alert("Erro ao salvar as respostas. Por favor, tente novamente.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Briefing Concluído!</h1>
        <p className="text-slate-600 max-w-md mx-auto mb-8">
          Excelente, Juan! As suas respostas foram guardadas. A nossa inteligência artificial de marketing tem agora todo o contexto necessário (Objetivos, Público, Produto, Oferta, Ética e Logística) para desenhar campanhas de alta conversão.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => {setIsCompleted(false); setCurrentSectionIndex(0);}}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors"
          >
            Rever Respostas
          </button>
          <button 
            disabled
            className="px-6 py-3 bg-slate-200 text-slate-500 font-medium rounded-xl flex items-center gap-2 cursor-not-allowed border border-slate-300"
          >
            <Save size={18} />
            Gerar Plano de Marketing (Em Breve)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-8">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Nutri7<span className="text-emerald-600">IA</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">Painel de Briefing de Marketing</p>
            </div>
            
            <nav className="space-y-2">
              {sections.map((section, idx) => {
                const Icon = section.icon;
                const isActive = idx === currentSectionIndex;
                const isPast = idx < currentSectionIndex;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSectionIndex(idx)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 font-medium' 
                        : isPast 
                          ? 'text-slate-600 hover:bg-slate-50' 
                          : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-600' : isPast ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-sm">{section.title}</span>
                  </button>
                )
              })}
            </nav>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Progresso</span>
                <span>{Math.round(((currentSectionIndex + 1) / sections.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentSectionIndex + 1) / sections.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário Principal */}
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10 animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider mb-4">
                Secção {currentSectionIndex + 1} de {sections.length}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentSection.title}</h2>
              <p className="text-slate-500">{currentSection.description}</p>
            </div>

            <div className="space-y-8">
              {currentSection.questions.map((q) => (
                <div key={q.id} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-4">{q.text}</h3>
                  
                  {q.type === 'radio' && (
                    <div className="space-y-3">
                      {q.options && q.options.map((opt, i) => (
                        <label key={i} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          answers[q.id] === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-200 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswer(q.id, opt)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="ml-3 font-medium text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                      placeholder="A sua resposta curta..."
                      className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm text-slate-700"
                    />
                  )}

                  {q.type === 'textarea' && (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                      placeholder="Descreva com detalhe..."
                      rows={3}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm text-slate-700 resize-none"
                    ></textarea>
                  )}
                </div>
              ))}
            </div>

            {/* Footer de Navegação */}
            <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                onClick={handlePrev}
                disabled={currentSectionIndex === 0}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors ${
                  currentSectionIndex === 0 
                    ? 'text-slate-300 cursor-not-allowed' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft size={18} />
                Anterior
              </button>
              
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>A gravar... <Loader2 size={18} className="animate-spin" /></>
                ) : (
                  <>
                    {currentSectionIndex === sections.length - 1 ? 'Concluir Briefing' : 'Próxima Secção'}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}