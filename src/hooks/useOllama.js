import { useState } from 'react';

const isConnectionFailure = (error) => {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timed out') ||
    message.includes('abort') ||
    message.includes('status:')
  );
};

export default function useOllama() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);

  const generateCompletion = async (
    modelName,
    systemPrompt,
    userContent,
    endpoint = 'http://localhost:11434/api/generate'
  ) => {
    setLoading(true);
    setError(null);
    setResponse('');

    const model = modelName?.trim() || 'qwen2.5-coder:1.5b';
    const normalizeEndpoint = (value) =>
      value.startsWith('http') ? value : `http://localhost:11434${value}`;

    const candidates = Array.from(
      new Set([
        endpoint,
        'http://localhost:11434/api/generate',
        'http://localhost:11434/api/chat',
      ])
    ).filter(Boolean);

    let lastError = null;

    for (const candidate of candidates) {
      try {
        const url = normalizeEndpoint(candidate);
        const payload = url.endsWith('/api/chat')
          ? {
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
              ],
              stream: false,
              options: {
                temperature: 0,
                top_p: 0.1,
                repeat_penalty: 1.1,
              },
            }
          : {
              model,
              prompt: `${systemPrompt}\n\nUser Data Context:\n${userContent}`,
              stream: false,
              options: {
                temperature: 0,
                top_p: 0.1,
                repeat_penalty: 1.1,
              },
            };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Ollama responded with status: ${res.status}`);
        }

        const data = await res.json();
        const text = data.response ?? data.message?.content ?? '';
        setResponse(text);
        setLoading(false);
        return text;
      } catch (err) {
        lastError = err;
        console.error('Local LLM handshake failure:', err);
      }
    }

    const message = lastError?.message || 'Could not connect to the local Ollama instance.';
    setError(message);
    setLoading(false);
    if (isConnectionFailure(lastError)) {
      throw new Error(message);
    }
    return null;
  };

  return { generateCompletion, loading, response, error };
}