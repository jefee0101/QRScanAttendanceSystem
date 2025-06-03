const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get } = require('firebase/database');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAX_fn8C2f4Jmg98Ryu4y73teIr2vkPMXo",
  authDomain: "qrcodecounter-4fedb.firebaseapp.com",
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com/",
  projectId: "qrcodecounter-4fedb",
  storageBucket: "qrcodecounter-4fedb.appspot.com",
  messagingSenderId: "460463651638",
  appId: "1:460463651638:web:b97941c421e03650865197",
  measurementId: "G-RJ36RHCH02"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Homepage route
app.get('/', async (req, res) => {
  // Get current scan count
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};
  const totalScans = Object.keys(scans).length;

  // Serve homepage with Google One Tap and scan count
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QRCodeCounter</title>
      <meta name="google-signin-client_id" content="252359693508-41hiplcvn9u63bbb2mt7h32a5rkddt8f.apps.googleusercontent.com">
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <style>
        /* CSS Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body, html {
          height: 100%;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        video#background-video {
          position: fixed;
          right: 0;
          bottom: 0;
          min-width: 100%;
          min-height: 100%;
          z-index: -1;
          object-fit: cover;
        }

        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(8px);
          background-color: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        h1, .scan-count, p {
          color: white;
        }

        .scan-count {
          font-size: 1.5rem;
          margin: 15px 0;
        }

        .view-logs-btn {
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.2);
          padding: 12px 24px;
          border: none;
          color: white;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.3s ease;
        }

        .view-logs-btn:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      </style>
    </head>
    <body>
      <video autoplay muted loop id="background-video">
        <source src="/background.mp4" type="video/mp4">
      </video>

      <div class="container">
        <h1>QRCode Counter</h1>
        <div class="scan-count">Total Scans: ${totalScans}</div>
        <div id="g_id_onload"
             data-client_id="252359693508-41hiplcvn9u63bbb2mt7h32a5rkddt8f.apps.googleusercontent.com"
             data-callback="handleCredentialResponse"
             data-auto_prompt="true">
        </div>
        <div class="g_id_signin" data-type="standard"></div>

        <a href="/scan"><button class="view-logs-btn">View Logs</button></a>
      </div>

      <script>
        function handleCredentialResponse(response) {
          // Decode JWT from Google
          const data = parseJwt(response.credential);
          const name = data.name;

          // Send to server
          fetch('/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          }).then(res => {
            if (res.ok) {
              window.location.reload();
            }
          });
        }

        function parseJwt(token) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          ).join(''));
          return JSON.parse(jsonPayload);
        }
      </script>
    </body>
    </html>
  `);
});

// Logs scan with name received from frontend
app.post('/auth', async (req, res) => {
  const { name } = req.body;
  if (name) {
    await push(ref(db, 'scans'), {
      name,
      timestamp: new Date().toISOString()
    });
    res.status(200).send('Logged');
  } else {
    res.status(400).send('Name missing');
  }
});

// View logs
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
      <title>Scan Logs</title>
      <style>
        body, html {
          height: 100%;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        video#background-video {
          position: fixed;
          right: 0;
          bottom: 0;
          min-width: 100%;
          min-height: 100%;
          z-index: -1;
          object-fit: cover;
        }

        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(8px);
          background-color: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        h1 {
          color: white;
        }

        table {
          margin-top: 20px;
          border-collapse: collapse;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(3px);
          color: white;
        }

        th, td {
          padding: 12px 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        a {
          margin-top: 20px;
          display: inline-block;
          color: white;
          text-decoration: none;
          background: rgba(255,255,255,0.2);
          padding: 10px 20px;
          border-radius: 10px;
        }
      </style>
    </head>
    <body>
      <video autoplay muted loop id="background-video">
        <source src="/background.mp4" type="video/mp4">
      </video>

      <div class="container">
        <h1>Scan Logs</h1>
        <table>
          <tr><th>Name</th><th>Timestamp</th></tr>
          ${rows}
        </table>
        <a href="/">← Back to Home</a>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`QRCodeCounter running on port ${PORT}`);
});
