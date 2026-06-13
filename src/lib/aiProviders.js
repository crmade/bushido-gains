export const PROVIDERS = {
  anthropic: {
    label: 'Anthropic (Claude)',
    defaultModel: 'claude-sonnet-4-6',
    keyLabel: 'Clave de API de Anthropic',
    keyPlaceholder: 'sk-ant-...',
    keyType: 'password',
    keyHelp: 'Consigue tu clave en console.anthropic.com',
  },
  openai: {
    label: 'OpenAI (ChatGPT)',
    defaultModel: 'gpt-4o-mini',
    keyLabel: 'Clave de API de OpenAI',
    keyPlaceholder: 'sk-...',
    keyType: 'password',
    keyHelp: 'Consigue tu clave en platform.openai.com/api-keys',
  },
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    keyLabel: 'Clave de API de Gemini',
    keyPlaceholder: 'AIza...',
    keyType: 'password',
    keyHelp: 'Consigue tu clave en aistudio.google.com/apikey',
  },
  ollama: {
    label: 'Ollama (local)',
    defaultModel: 'llama3.2',
    keyLabel: 'URL del servidor Ollama',
    keyPlaceholder: 'http://localhost:11434',
    keyType: 'text',
    keyHelp: 'Asegúrate de tener Ollama corriendo y de que CORS esté habilitado (OLLAMA_ORIGINS=*).',
  },
};

export async function callAI({ provider, apiKey, prompt, model }) {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error('Proveedor desconocido: ' + provider);
  const mdl = model || cfg.defaultModel;

  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: mdl,
        max_tokens: 3500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!r.ok) {
      let detail = '';
      try { const j = await r.json(); detail = j.error?.message || ''; } catch (e) {}
      throw new Error(r.status + (detail ? ': ' + detail : ''));
    }
    const data = await r.json();
    return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  }

  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: mdl,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3500,
      }),
    });
    if (!r.ok) {
      let detail = '';
      try { const j = await r.json(); detail = j.error?.message || ''; } catch (e) {}
      throw new Error(r.status + (detail ? ': ' + detail : ''));
    }
    const data = await r.json();
    return data.choices?.[0]?.message?.content || '';
  }

  if (provider === 'gemini') {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + mdl + ':generateContent?key=' + encodeURIComponent(apiKey);
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 3500, temperature: 0.7 },
      }),
    });
    if (!r.ok) {
      let detail = '';
      try { const j = await r.json(); detail = j.error?.message || ''; } catch (e) {}
      throw new Error(r.status + (detail ? ': ' + detail : ''));
    }
    const data = await r.json();
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  }

  if (provider === 'ollama') {
    const baseUrl = (apiKey || 'http://localhost:11434').replace(/\/$/, '');
    const r = await fetch(baseUrl + '/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: mdl, prompt, stream: false, options: { num_predict: 3500 } }),
    });
    if (!r.ok) throw new Error(r.status + ' (¿Ollama está corriendo en ' + baseUrl + '?)');
    const data = await r.json();
    return data.response || '';
  }

  throw new Error('Proveedor no implementado: ' + provider);
}
