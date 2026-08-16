// api/sheet.js
// Vercel serverless proxy for the Apps Script backend.
// Handles CORS (Apps Script itself can't set these headers) and
// follows the 302 redirect Apps Script issues to script.googleusercontent.com.

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw0D3TBtC8jD8xUQzqb2Zf27A0UZvApJO1oXsMkpga37qNzpY5X_6K3KqlzKlWJNcaH/exec'; // ends in /exec

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Forward query params as-is (Apps Script parameter values are already
      // decoded on arrival — do not decodeURIComponent again)
      const params = new URLSearchParams(req.query).toString();
      const url = `${APPS_SCRIPT_URL}?${params}`;
      const response = await fetch(url, { method: 'GET', redirect: 'follow' });
      const data = await response.text();
      res.status(200).send(data);
      return;
    }

    if (req.method === 'POST') {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // avoids Apps Script CORS preflight quirk
        body: JSON.stringify(req.body),
        redirect: 'follow'
      });
      const data = await response.text();
      res.status(200).send(data);
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
