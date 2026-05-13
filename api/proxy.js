// ============================================================
//  api/proxy.js — CrypView AI Proxy (Vercel Serverless)
//  Sécurise les clés Gemini + Mistral côté serveur.
//  Variables d'env requises :
//    GEMINI_API_KEY
//    MISTRAL_API_KEY
//    ALLOWED_ORIGIN   (ex: https://ezilryb.github.io)
// ============================================================

const GEMINI_MODEL  = 'gemini-2.5-flash-lite';
const MISTRAL_MODEL = 'mistral-small-latest';

// ── URLs des APIs cibles ─────────────────────────────────────
const GEMINI_URL  = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

// ── Helper CORS ───────────────────────────────────────────────
function setCORSHeaders(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://ezilryb.github.io';

  // Autorise uniquement le domaine GitHub Pages déclaré
  const origin = req.headers.origin || '';
  if (origin === allowedOrigin || origin.startsWith(allowedOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // En dev local, autorise également localhost
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // Sinon : pas d'en-tête → le navigateur bloquera la requête
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // cache preflight 24h
}

// ── Appel Gemini ──────────────────────────────────────────────
async function callGemini(body) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurée.');

  const url = `${GEMINI_URL}?key=${apiKey}`;
  const res  = await fetch(url, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini HTTP ${res.status}`);
  }

  return res.json();
}

// ── Appel Mistral ─────────────────────────────────────────────
async function callMistral(body) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY non configurée.');

  const res = await fetch(MISTRAL_URL, {
    method  : 'POST',
    headers : {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Mistral HTTP ${res.status}`);
  }

  return res.json();
}

// ── Handler principal (export Vercel) ─────────────────────────
export default async function handler(req, res) {
  setCORSHeaders(req, res);

  // Preflight OPTIONS → répondre immédiatement
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Seul POST est accepté
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  // ── Lecture du corps ────────────────────────────────────────
  const { backend, payload } = req.body ?? {};

  if (!backend || !payload) {
    return res.status(400).json({ error: 'Paramètres manquants : backend, payload.' });
  }

  if (!['gemini', 'mistral'].includes(backend)) {
    return res.status(400).json({ error: 'backend doit être "gemini" ou "mistral".' });
  }

  // ── Dispatch ────────────────────────────────────────────────
  try {
    let data;

    if (backend === 'gemini') {
      data = await callGemini(payload);
    } else {
      data = await callMistral(payload);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error(`[CrypView Proxy] Erreur ${backend}:`, err.message);
    return res.status(502).json({ error: err.message });
  }
}
