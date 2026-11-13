import { useEffect, useRef, useState } from 'react';
import { Flame, Send, Loader2, CheckCircle2, BadgeCheck } from 'lucide-react';
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

  useEffect(() => {
    // Abre a entrevista: pede a primeira pergunta sem histórico.
    callGrillInterview([])
      .then((res) => {
        if (res.nextQuestion) setMessages([{ role: 'ai', content: res.nextQuestion }]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingValidation]);

  const persistTranscript = async (updated: ChatMessage[]) => {
    await setDoc(
      doc(db, 'entrevista_sessoes', sessionId),
      { messages: updated, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const updated: ChatMessage[] = [...messages, { role: 'juan', content: input.trim() }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      await persistTranscript(updated);
      const res = await callGrillInterview(updated);

      if (res.readyToValidate && res.perguntaOficial && res.condutaRecomendada) {
        setPendingValidation({ perguntaOficial: res.perguntaOficial, condutaRecomendada: res.condutaRecomendada });
      } else if (res.nextQuestion) {
        setMessages((prev) => [...prev, { role: 'ai', content: res.nextQuestion! }]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao falar com o entrevistador.');
    } finally {
      setLoading(false);
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
        content: `Salvo no RAG ✅ — "${pendingValidation.perguntaOficial}". Vamos pra próxima.`,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-sm">Estilo Grill-me — a IA aprofunda até sua conduta ficar 100% clara</span>
        </div>
        {validatedCount > 0 && (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-700">
            <BadgeCheck className="w-4 h-4" /> {validatedCount} salva{validatedCount > 1 ? 's' : ''} nesta sessão
          </span>
        )}
      </div>

      <div ref={scrollRef} className="h-[420px] overflow-y-auto rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'juan' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'juan' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800 shadow-sm border border-slate-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pendingValidation && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Pronto para validar</p>
            <p className="text-sm text-slate-800"><strong>Pergunta:</strong> {pendingValidation.perguntaOficial}</p>
            <p className="text-sm text-slate-800"><strong>Conduta:</strong> {pendingValidation.condutaRecomendada}</p>
            <button
              onClick={handleValidate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Validar e Salvar no RAG
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Responda como você responderia o paciente de verdade..."
          rows={2}
          disabled={loading || !!pendingValidation}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
        />
        <button
          onClick={handleSend}
          disabled={loading || !!pendingValidation || !input.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 hover:bg-slate-700 disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
