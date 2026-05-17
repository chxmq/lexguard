import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { setGoogleTokens } from '../lib/google-tokens.js';

export default function OAuthCallback() {
  const [message, setMessage] = useState('Connecting Google account…');

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const error = params.get('error');
    const tokensB64 = params.get('tokens');

    if (error) {
      setMessage(`Google sign-in failed: ${decodeURIComponent(error)}`);
      return;
    }

    if (tokensB64) {
      try {
        const json = atob(tokensB64.replace(/-/g, '+').replace(/_/g, '/'));
        setGoogleTokens(JSON.parse(json));
        setMessage('Google account connected. You can close this tab and export to Docs or Slides.');
        if (window.opener) {
          window.opener.postMessage({ type: 'lexguard-oauth-done' }, window.location.origin);
          setTimeout(() => window.close(), 1200);
        }
      } catch (err) {
        setMessage(`Failed to save tokens: ${err.message}`);
      }
      return;
    }

    setMessage('No authorization data received.');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="glass-card max-w-md w-full p-8 text-center">
        <p className="text-ink">{message}</p>
        <Link to="/" className="btn-outline inline-block mt-6 text-sm">
          Back to LexGuard
        </Link>
      </div>
    </div>
  );
}
