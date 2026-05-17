import { Router } from 'express';
import { getAuthUrl, getTokensFromCode } from '../lib/google-auth.js';

const router = Router();

router.get('/auth/url', (_req, res) => {
  try {
    res.json({ url: getAuthUrl() });
  } catch {
    res.status(503).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
  }
});

router.get('/auth/callback', async (req, res) => {
  const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';
  const { code, error: oauthError } = req.query;

  if (oauthError) {
    return res.redirect(`${appOrigin}/oauth/callback#error=${encodeURIComponent(String(oauthError))}`);
  }

  if (!code) {
    return res.redirect(`${appOrigin}/oauth/callback#error=${encodeURIComponent('No authorization code')}`);
  }

  try {
    const { tokens } = await getTokensFromCode(code);
    const encoded = Buffer.from(JSON.stringify(tokens)).toString('base64url');
    res.redirect(`${appOrigin}/oauth/callback#tokens=${encoded}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${appOrigin}/oauth/callback#error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
