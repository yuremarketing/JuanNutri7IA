// netlify/functions/grill-interview.ts
// Handler serverless para a "Sala de Entrevista" (estilo Grill-me)
// Mantém a chave de API segura no servidor e retorna perguntas adaptativas de conduta clínica.
// Valida o usuário autenticado via Google Identity Toolkit antes de invocar a LLM (proteção OWASP API4).

interface ChatMessage {
  role: 'ai' | 'juan' | 'assistant' | 'user';
  content: string;
}

interface RequestPayload {
  topic?: string;
  history?: ChatMessage[];
  latestAnswer?: string;
}

interface GrillResponse {
  feedback?: string;
  nextQuestion: string;
  readyToValidate: boolean;
  perguntaOficial?: string;
  condutaRecomendada?: string;
  summaryQuestion?: string;
  summaryAnswer?: string;
}

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || "AIzaSyCRZsxp-nptfLoCW1R1781Ws4whi3KMrMs";

const SYSTEM_INSTRUCTION = `
Você é o Entrevistador Clínico Especialista do JuanNutri7 no formato "Grill-me".
Seu objetivo é entrevistar e "grelhar" o nutricionista Juan para extrair com precisão cirúrgica a conduta clínica real dele, para alimentar a base de conhecimento RAG do consultório.

Diretrizes de Atuação:
1. Seja direto, clínico, desafiador e focado na prática diária com pacientes reais.
2. Explore casos difíceis, exceções, mitos comuns e decisões de conduta (ex: "Se o paciente tiver SOP e ansiedade noturna, você corta carboidrato? Como orienta a ceia?").
3. Analise criticamente a resposta do Juan:
   - Se a resposta for genérica ou superficial, aprofunde ("E se o paciente relatar refluxo com essa conduta?", "Qual o cálculo ou dosagem de referência?").
   - Quando a resposta estiver madura, sólida e pronta para virar regra oficial do RAG, marque "readyToValidate: true" e formule o par de pergunta oficial e conduta recomendada.
4. Mantenha um tom profissional, respeitoso, mas instigante (estilo comitê clínico/sabatina).

Retorne OBRIGATORIAMENTE um JSON válido com o seguinte schema:
{
  "feedback": "Comentário analítico sobre a resposta anterior (ou saudação se for o início)",
  "nextQuestion": "A próxima pergunta para continuar o grill",
  "readyToValidate": true ou false,
  "perguntaOficial": "Pergunta oficial formatada como dúvida de paciente/caso (obrigatório se readyToValidate for true)",
  "condutaRecomendada": "Resposta e conduta clínica sintetizada e aprovada do Juan (obrigatório se readyToValidate for true)"
}
`;

async function verifyFirebaseToken(idToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return Boolean(data.users && data.users.length > 0);
  } catch (err) {
    console.error('Erro ao verificar idToken no Identity Toolkit:', err);
    return false;
  }
}

export const handler = async (event: {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
}) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Verificação de autenticação Bearer Token
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  const apiKey = process.env.GEMINI_API_KEY;

  // Se houver chave real da IA configurada, a autenticação do token é estritamente obrigatória
  if (apiKey) {
    if (!token) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Não autorizado: token de autenticação ausente' }),
      };
    }

    const isValidUser = await verifyFirebaseToken(token);
    if (!isValidUser) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Não autorizado: token de autenticação inválido ou expirado' }),
      };
    }
  }

  try {
    const payload: RequestPayload = event.body ? JSON.parse(event.body) : {};
    const { topic = 'Conduta Nutricional Geral', history = [], latestAnswer } = payload;
    const lastMsg = history.length > 0 ? history[history.length - 1] : undefined;
    const effectiveAnswer = latestAnswer || (lastMsg && (lastMsg.role === 'juan' || lastMsg.role === 'user') ? lastMsg.content : undefined);

    if (!apiKey) {
      // Mock de fallback gracioso para desenvolvimento local caso a chave não esteja no .env
      const isComplete = Boolean(effectiveAnswer && effectiveAnswer.length > 25);
      const fallbackResponse: GrillResponse = {
        feedback: '[MODO SIMULAÇÃO - configure GEMINI_API_KEY no Netlify/env para IA real] Boa colocação sobre a conduta clínica.',
        nextQuestion: `Sobre o tópico "${topic}": qual a sua conduta exata quando o paciente relata que não consegue atingir a meta de proteína diária no café da manhã?`,
        readyToValidate: isComplete,
        perguntaOficial: isComplete ? `Como bater a meta proteica no café da manhã com opções práticas?` : undefined,
        condutaRecomendada: isComplete ? effectiveAnswer : undefined,
        summaryQuestion: isComplete ? `Como bater a meta proteica no café da manhã com opções práticas?` : undefined,
        summaryAnswer: isComplete ? effectiveAnswer : undefined,
      };

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackResponse),
      };
    }

    // Construção dos conteúdos para a API Gemini
    const contents = [
      {
        role: 'user',
        parts: [{ text: `Tópico da Entrevista: ${topic}` }],
      },
    ];

    for (const msg of history) {
      const isAi = msg.role === 'ai' || msg.role === 'assistant';
      contents.push({
        role: isAi ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    if (effectiveAnswer && (!lastMsg || lastMsg.content !== effectiveAnswer)) {
      contents.push({
        role: 'user',
        parts: [{ text: effectiveAnswer }],
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API Error:', geminiRes.status, errText);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Falha na comunicação com a IA', details: errText }),
      };
    }

    const geminiData = await geminiRes.json();
    const rawJson = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJson) {
      throw new Error('Resposta vazia da API do Gemini');
    }

    const parsedResponse: GrillResponse = JSON.parse(rawJson);
    
    // Normalização dos campos para interoperabilidade
    if (parsedResponse.perguntaOficial && !parsedResponse.summaryQuestion) {
      parsedResponse.summaryQuestion = parsedResponse.perguntaOficial;
    }
    if (parsedResponse.condutaRecomendada && !parsedResponse.summaryAnswer) {
      parsedResponse.summaryAnswer = parsedResponse.condutaRecomendada;
    }
    if (parsedResponse.summaryQuestion && !parsedResponse.perguntaOficial) {
      parsedResponse.perguntaOficial = parsedResponse.summaryQuestion;
    }
    if (parsedResponse.summaryAnswer && !parsedResponse.condutaRecomendada) {
      parsedResponse.condutaRecomendada = parsedResponse.summaryAnswer;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(parsedResponse),
    };
  } catch (error: any) {
    console.error('Grill-interview handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro interno ao processar a entrevista', message: error?.message }),
    };
  }
};
