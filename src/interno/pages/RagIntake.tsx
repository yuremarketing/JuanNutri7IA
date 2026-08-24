import { useState } from 'react';
import { Target, ListPlus, Flame, BookOpen, Save, Loader2, Plus, Trash2, ShieldAlert, Heart } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../shared/config/firebase';

interface FAQ {
  question: string;
  answer: string;
}

export default function RagIntake() {
  const [formData, setFormData] = useState({
    // 1. Conhecimento técnico
    foodTableSource: '',
    tmbFormula: '',
    tmbAdjustments: '',
    microGuidelines: '',
    
    // 2. Cardápios e protocolos
    menuAthlete: '',
    menuClinical: '',
    menuAesthetics: '',
    substitutions: '',

    // 4. Persona e atendimento clínico
    personaTone: '',
    personaOpening: '',
    personaNonAdherence: '',
    personaMotivation: '',
    personaExpressions: '',
    personaAvoid: '',
    personaEscalation: '',
    personaClosing: '',
  });

  const [faqs, setFaqs] = useState<FAQ[]>([{ question: '', answer: '' }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFaqChange = (index: number, field: keyof FAQ, value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      await addDoc(collection(db, 'rag_conteudo'), {
        ...formData,
        faqs,
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Erro ao salvar RAG Intake:", err);
      setError("Erro ao salvar os dados. Verifique a sua ligação ou permissões.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Base de Conhecimento IA</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Este formulário é crucial. O que escrever aqui será a "alma" da Inteligência Artificial. Seja o mais detalhado e específico possível.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-200">
            <ShieldAlert size={20} />
            <p>{error}</p>
          </div>
        )}

        {isSuccess && (
          <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center gap-4 border border-emerald-200 shadow-sm animate-fade-in">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <Save size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Conhecimento Guardado!</h3>
              <p className="text-emerald-600">A Base de Conhecimento RAG foi atualizada com sucesso no banco de dados.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 space-y-12">
          
          {/* Section 1: Conhecimento Técnico */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Target size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">1. Conhecimento Técnico</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Qual a fonte da tabela de alimentos que você usa (TACO, USDA, própria)?
                </label>
                <textarea 
                  name="foodTableSource"
                  value={formData.foodTableSource}
                  onChange={handleInputChange}
                  rows={3} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ex: Utilizo principalmente a TACO para alimentos nacionais e USDA para..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Qual fórmula você usa pra calcular TMB (Taxa de Metabolismo Basal)? Escreva a fórmula exata.
                </label>
                <textarea 
                  name="tmbFormula"
                  value={formData.tmbFormula}
                  onChange={handleInputChange}
                  rows={3} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ex: Harris-Benedict revisada por Roza e Shizgal..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Você ajusta a TMB de forma diferente pra Atleta / Clínico Geral / Estética? Como?
                </label>
                <textarea 
                  name="tmbAdjustments"
                  value={formData.tmbAdjustments}
                  onChange={handleInputChange}
                  rows={4} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ex: Para atletas multiplico pelo fator de atividade 1.5 a 1.9 dependendo do..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Orientações gerais de micronutrientes e hidratação que você costuma passar.
                </label>
                <textarea 
                  name="microGuidelines"
                  value={formData.microGuidelines}
                  onChange={handleInputChange}
                  rows={4} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ex: Mínimo de 35ml a 40ml de água por kg de peso. Foco em magnésio e..."
                />
              </div>
            </div>
          </section>

          {/* Section 2: Cardápios e Protocolos */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Flame size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">2. Cardápios e Protocolos</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Exemplo real de cardápio que você passaria pra um paciente perfil Atleta (café da manhã, almoço, jantar, lanches).
                </label>
                <textarea 
                  name="menuAthlete"
                  value={formData.menuAthlete}
                  onChange={handleInputChange}
                  rows={5} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Exemplo real de cardápio perfil Clínico Geral.
                </label>
                <textarea 
                  name="menuClinical"
                  value={formData.menuClinical}
                  onChange={handleInputChange}
                  rows={5} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Exemplo real de cardápio perfil Estética (Emagrecimento / Definição).
                </label>
                <textarea 
                  name="menuAesthetics"
                  value={formData.menuAesthetics}
                  onChange={handleInputChange}
                  rows={5} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  O que você recomenda no lugar de: ovo / leite-lactose / glúten / carne vermelha, quando o paciente não pode/não gosta?
                </label>
                <textarea 
                  name="substitutions"
                  value={formData.substitutions}
                  onChange={handleInputChange}
                  rows={4} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ovo -> X. Leite -> Y..."
                />
              </div>
            </div>
          </section>

          {/* Section 3: Persona e Atendimento Clínico */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Heart size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">3. Persona e Atendimento Clínico</h2>
            </div>
            <p className="text-sm text-slate-500 -mt-2">
              Esta seção ensina a IA a soar como você, não como um chatbot de nutrição genérico.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Como você se dirige ao paciente no dia a dia (formal/informal, técnico/simples, direto/acolhedor)? Dê um exemplo de frase real sua.
                </label>
                <textarea
                  name="personaTone"
                  value={formData.personaTone}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Ex: Uso um tom direto mas acolhedor, sempre chamo pelo primeiro nome..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Como você costuma começar uma consulta ou responder a primeira mensagem de um paciente novo?
                </label>
                <textarea
                  name="personaOpening"
                  value={formData.personaOpening}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Como você reage quando o paciente conta que "furou" o plano? Dê um exemplo real de resposta sua.
                </label>
                <textarea
                  name="personaNonAdherence"
                  value={formData.personaNonAdherence}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Como você incentiva um paciente que está achando o processo difícil ou querendo desistir?
                </label>
                <textarea
                  name="personaMotivation"
                  value={formData.personaMotivation}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Alguma frase, gíria ou expressão que você usa com frequência e que os pacientes já reconhecem como "sua"?
                </label>
                <textarea
                  name="personaExpressions"
                  value={formData.personaExpressions}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tem algo que outros nutricionistas/conteúdo genérico por aí dizem que você especificamente evita (dieta restritiva extrema, contar caloria obsessivamente, etc.)?
                </label>
                <textarea
                  name="personaAvoid"
                  value={formData.personaAvoid}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Em que situação você pararia o atendimento por IA/texto e mandaria o paciente procurar atendimento presencial ou urgente (sinais de transtorno alimentar, sintoma clínico fora do escopo, etc.)?
                </label>
                <textarea
                  name="personaEscalation"
                  value={formData.personaEscalation}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-4 bg-rose-50 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                  placeholder="Isso vira uma regra de segurança do sistema — seja específico."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Como você costuma fechar uma resposta ou consulta?
                </label>
                <textarea
                  name="personaClosing"
                  value={formData.personaClosing}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 4: FAQ */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <ListPlus size={20} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">4. FAQ de Pacientes</h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 relative group">
                  <div className="absolute -top-3 -right-3">
                    {faqs.length > 1 && (
                      <button 
                        onClick={() => removeFaq(index)}
                        className="p-2 bg-white text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                        title="Remover pergunta"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pergunta do paciente</label>
                    <input 
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="Ex: Posso beber cerveja no fim de semana?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">A sua resposta</label>
                    <textarea 
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      rows={2}
                      className="w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="Ex: Duas cervejas não vão arruinar a dieta se..."
                    />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addFaq}
                className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-medium rounded-xl hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Adicionar outra pergunta (FAQ)
              </button>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="pt-8 border-t border-slate-100">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {isSubmitting ? 'A Guardar Base de Conhecimento...' : 'Guardar Conhecimento na IA'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
