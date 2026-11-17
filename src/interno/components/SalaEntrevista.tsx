import { useEffect, useRef, useState } from 'react';
import { 
  Flame, 
  Send, 
  Loader2, 
  CheckCircle2, 
  BadgeCheck, 
  Sparkles, 
  User, 
  Lightbulb
} from 'lucide-react';

import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../shared/config/firebase';

interface ChatMessage {
  role: 'ai' | 'juan';
  content: string;
}

interface GrillResponse {
  nextQuestion?: string;
  readyToValidate: boolean;
  perguntaOficial?: string;
  condutaRecomendada?: string;
  error?: string;
}

const QUICK_TOPICS = [
  '🍗 Proteína no café da manhã',
  '🩸 SOP e carboidratos',
  '💊 Dosagem de Creatina',
  '📉 Platô no Emagrecimento',
  '🥑 Refluxo e Gorduras'
];

async function callGrillInterview(history: ChatMessage[]): Promise<GrillResponse> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Sessão expirada — faça login novamente.');

  const res = await fetch('/.netlify/functions/grill-interview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ history }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status} ao falar com o entrevistador.`);
  }

  return res.json();
}

export default function SalaEntrevista() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingValidation, setPendingValidation] = useState<{ perguntaOficial: string; condutaRecomendada: string } | null>(null);
  const [validatedCount, setValidatedCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Abre a entrevista: solicita a primeira pergunta
    callGrillInterview([])
      .then((res) => {
        if (res.nextQuestion) setMessages([{ role: 'ai', content: res.nextQuestion }]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingValidation, loading]);

  const persistTranscript = async (updated: ChatMessage[]) => {
    try {
      await setDoc(
        doc(db, 'entrevista_sessoes', sessionId),
        { messages: updated, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.warn('Erro ao salvar transcrição local:', e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const msg = textToSend || input;
    if (!msg.trim() || loading) return;

    const updated: ChatMessage[] = [...messages, { role: 'juan', content: msg.trim() }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      await persistTranscript(updated);
      const res = await callGrillInterview(updated);

      if (res.readyToValidate && res.perguntaOficial && res.condutaRecomendada) {
        setPendingValidation({
          perguntaOficial: res.perguntaOficial,
          condutaRecomendada: res.condutaRecomendada,
        });
      }

      if (res.nextQuestion) {
        const next: ChatMessage = { role: 'ai', content: res.nextQuestion };
        const withAi = [...updated, next];
        setMessages(withAi);
        await persistTranscript(withAi);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao falar com o entrevistador.');
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleValidate = async () => {
    if (!pendingValidation) return;
    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'rag_conteudo'), {
        question: pendingValidation.perguntaOficial,
        answer: pendingValidation.condutaRecomendada,
        origem: 'entrevista_grill',
        sessionId,
        createdAt: serverTimestamp(),
      });

      setValidatedCount((n) => n + 1);
      const confirmation: ChatMessage = {
        role: 'ai',
        content: `Conduta validada e arquivada no RAG oficial com sucesso! ✅\n\n📌 "${pendingValidation.perguntaOficial}"\n\nVamos continuar aprofundando:`,
      };
      const updated = [...messages, confirmation];
      setMessages(updated);
      setPendingValidation(null);
      await persistTranscript(updated);

      const res = await callGrillInterview(updated);
      if (res.nextQuestion) {
        setMessages((prev) => [...prev, { role: 'ai', content: res.nextQuestion! }]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar no RAG.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Chat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00ff88] border-2 border-slate-900 rounded-full shadow-[0_0_8px_#00ff88]"></span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Sabatina Clínica JuanNutri7
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Grill-me Mode
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              A IA questiona cenários reais de pacientes para capturar sua conduta exata
            </p>
          </div>
        </div>

        {/* Contador de Validadas */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00ff88] text-xs font-semibold shadow-[0_0_15px_rgba(0,255,136,0.1)]">
            <BadgeCheck className="w-4 h-4 text-[#00ff88]" />
            <span>{validatedCount} conduta{validatedCount === 1 ? '' : 's'} no RAG</span>
          </div>
        </div>
      </div>

      {/* Sugestões de Tópicos Rápidos */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Atalhos de Tópicos Clínicos (clique para responder sobre):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(`Quero falar sobre a minha conduta clínica em: ${topic}`)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 text-slate-300 hover:text-[#00ff88] border border-white/5 hover:border-emerald-500/30 transition-all disabled:opacity-50"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Área de Mensagens (Chat Stream) */}
      <div 
        ref={scrollRef} 
        className="h-[480px] overflow-y-auto rounded-2xl bg-black/40 border border-white/10 p-4 sm:p-6 space-y-4 shadow-inner"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,255,136,0.3) transparent' }}
      >
        {messages.length === 0 && loading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
            <p className="text-sm">Iniciando o entrevistador clínico com IA...</p>
          </div>
        )}

        {messages.map((m, i) => {
          const isJuan = m.role === 'juan';
          return (
            <div key={i} className={`flex items-start gap-3 ${isJuan ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {isJuan ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border border-[#00ff88]/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,255,136,0.3)] overflow-hidden">
                    <img 
                      src="https://avatars.githubusercontent.com/juanpablonutri7" 
                      alt="Juan Pablo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <User className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.25)]">
                    <Flame className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Balão da Mensagem */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-lg whitespace-pre-wrap ${
                  isJuan
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none border border-emerald-400/30 shadow-[0_4px_20px_rgba(0,204,106,0.2)]'
                    : 'bg-[#1a222d] text-slate-100 rounded-tl-none border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                }`}
              >
                <div className="text-[11px] font-semibold mb-1 opacity-70 flex items-center justify-between gap-2">
                  <span>{isJuan ? 'Juan Pablo (Você)' : 'Entrevistador Clínico IA'}</span>
                </div>
                {m.content}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#1a222d] text-slate-300 rounded-2xl rounded-tl-none border border-white/10 px-5 py-3 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#00ff88] animate-spin" />
              <span>Avaliando sua conduta clínica...</span>
            </div>
          </div>
        )}

        {/* Card Dourado/Esmeralda: Pronto para Validar */}
        {pendingValidation && (
          <div className="rounded-2xl border-2 border-[#00ff88]/60 bg-gradient-to-br from-emerald-950/80 via-slate-900/90 to-teal-950/70 p-5 space-y-4 shadow-[0_0_30px_rgba(0,255,136,0.2)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-[#00ff88] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#00ff88]" />
              <span>Conduta Clínica Madura — Pronta para Ingestão</span>
            </div>

            <div className="space-y-2 bg-black/40 rounded-xl p-4 border border-white/5 text-sm">
              <div className="text-slate-300">
                <span className="text-emerald-400 font-semibold">❓ Dúvida Oficial do Paciente:</span>
                <p className="mt-0.5 text-white font-medium">{pendingValidation.perguntaOficial}</p>
              </div>
              <div className="text-slate-300 pt-2 border-t border-white/5">
                <span className="text-emerald-400 font-semibold">👨‍⚕️ Sua Conduta Aprovada:</span>
                <p className="mt-0.5 text-slate-200 leading-relaxed">{pendingValidation.condutaRecomendada}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <p className="text-xs text-slate-400">
                Ao validar, este conhecimento se torna regra oficial do assistente JuanNutri7.
              </p>
              <button
                onClick={handleValidate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-slate-950 font-bold px-5 py-2.5 text-sm hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all disabled:opacity-50 flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Validar e Salvar no RAG
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alerta de Erro */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Barra de Entrada (Input Bar) */}
      <div className="relative rounded-2xl bg-black/50 border border-white/10 p-2 focus-within:border-[#00ff88]/60 focus-within:ring-2 focus-within:ring-[#00ff88]/20 transition-all shadow-xl">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Digite sua conduta clínica como você falaria na consulta... (Pressione Enter para enviar)"
          rows={3}
          disabled={loading || !!pendingValidation}
          className="w-full bg-transparent text-white placeholder-slate-500 text-sm p-3 focus:outline-none resize-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between px-3 pb-1 pt-2 border-t border-white/5">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">Enter</kbd> para enviar • <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">Shift + Enter</kbd> para nova linha
          </span>

          <button
            onClick={() => handleSend()}
            disabled={loading || !!pendingValidation || !input.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-slate-950 font-bold px-5 py-2 hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all disabled:opacity-30 disabled:hover:shadow-none ml-auto"
          >
            <span>Responder</span>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
