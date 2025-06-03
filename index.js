const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Firebase modular imports
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get } = require('firebase/database');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAX_fn8C2f4Jmg98Ryu4y73teIr2vkPMXo",
  authDomain: "qrcodecounter-4fedb.firebaseapp.com",
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com",
  projectId: "qrcodecounter-4fedb",
  storageBucket: "qrcodecounter-4fedb.appspot.com",
  messagingSenderId: "460463651638",
  appId: "1:460463651638:web:b97941c421e03650865197",
  measurementId: "G-RJ36RHCH02"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Serve static files (CSS, JS, video)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Home route
app.get('/', async (req, res) => {
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};
  const count = Object.keys(scans).length;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QRCodeCounter</title>
      <link rel="stylesheet" href="/style.css" />
      <script src="https://accounts.google.com/gsi/client" async defer></script>
    </head>
    <body>
      <video autoplay muted loop id="bgVideo">
        <source src="/background.mp4" type="video/mp4">
      </video>
      <div class="container">
        <h1>QRCodeCounter</h1>
        <h2>Total Scans: <span id="scanCount">${count}</span></h2>
        <div id="g_id_onload"
          data-client_id="252359693508-41hiplcvn9u63bbb2mt7h32a5rkddt8f.apps.googleusercontent.com"
          data-callback="handleCredentialResponse"
          data-auto_prompt="true">
        </div>
        <div class="g_id_signin" data-type="standard"></div>
        <p><a href="/scan">View Scan Logs</a></p>
      </div>
      <script>
        async function handleCredentialResponse(response) {
          const res = await fetch('/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
          });
          const result = await res.text();
          alert(result);
          window.location.reload();
        }
      </script>
    </body>
    </html>
  `);
});

// Google Sign-In Auth handler
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("252359693508-41hiplcvn9u63bbb2mt7h32a5rkddt8f.apps.googleusercontent.com");

app.post('/auth', async (req, res) => {
  const token = req.body.credential;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "252359693508-41hiplcvn9u63bbb2mt7h32a5rkddt8f.apps.googleusercontent.com"
    });

    const payload = ticket.getPayload();
    const name = payload.name;

    // Push to Firebase
    await push(ref(db, 'scans'), {
      name: name,
      timestamp: new Date().toISOString()
    });

    res.send(`Welcome, ${name}! Your scan has been recorded.`);
  } catch (err) {
    res.status(400).send("Invalid Google token.");
  }
});

// View logs route
app.get('/scan', async (req, res) => {
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};

  let rows = '';
  Object.values(scans).forEach(scan => {
    rows += `<tr><td>${scan.name}</td><td>${scan.timestamp}</td></tr>`;
  });

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QRCodeCounter - Logs</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
      <video autoplay muted loop id="bgVideo">
        <source src="/background.mp4" type="video/mp4">
      </video>
      <div class="container">
        <h1>Scan Logs</h1>
        <table>
          <tr><th>Name</th><th>Timestamp</th></tr>
          ${rows}
        </table>
        <p><a href="/">Back to Home</a></p>
      </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`QRCodeCounter server running on port ${PORT}`);
});
