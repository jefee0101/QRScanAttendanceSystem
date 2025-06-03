const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Firebase modular imports
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get } = require('firebase/database');

// Serve static files (video, Google API script can be loaded remotely)
app.use(express.static('public'));

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAX_fn8C2f4Jmg98Ryu4y73teIr2vkPMXo",
  authDomain: "qrcodecounter-4fedb.firebaseapp.com",
  projectId: "qrcodecounter-4fedb",
  storageBucket: "qrcodecounter-4fedb.firebasestorage.app",
  messagingSenderId: "460463651638",
  appId: "1:460463651638:web:b97941c421e03650865197",
  measurementId: "G-RJ36RHCH02",
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com/"
};

// Initialize Firebase app and database
const appFirebase = initializeApp(firebaseConfig);
const db = getDatabase(appFirebase);

// Middleware to parse JSON body for POST requests
app.use(express.json());

// Homepage - show title, scan count, and "View Logs" link, plus Google Sign-In integration
app.get('/', async (req, res) => {
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};
  const scanCount = Object.keys(scans).length;

  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <title>QRCodeCounter</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
      html, body {
        height: 100%;
        margin: 0;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: white;
        overflow: hidden;
        background: black;
      }
      #bg-video {
        position: fixed;
        right: 0;
        bottom: 0;
        min-width: 100%;
        min-height: 100%;
        object-fit: cover;
        z-index: -1;
        filter: brightness(0.6);
      }
      .container {
        position: relative;
        max-width: 400px;
        margin: 120px auto;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px 30px;
        box-sizing: border-box;
        text-align: center;
      }
      h1 {
        margin-bottom: 20px;
      }
      .scan-count {
        font-size: 1.4rem;
        margin-bottom: 30px;
        font-weight: 600;
      }
      a {
        color: #bbdefb;
        text-decoration: underline;
        font-weight: 600;
        display: block;
        margin-top: 20px;
      }
      a:hover {
        color: #64b5f6;
      }
      #g_id_onload, #g_id_signin {
        margin: auto;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <video id="bg-video" autoplay muted loop>
      <source src="/background.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    <div class="container">
      <h1>QRCodeCounter</h1>
      <div class="scan-count">Total Scans: ${scanCount}</div>
      <a href="/scan">View all scan logs</a>

      <!-- Google Sign-In button -->
      <div id="g_id_onload"
           data-client_id="YOUR_GOOGLE_CLIENT_ID_HERE"
           data-auto_prompt="false"
           data-callback="handleCredentialResponse">
      </div>
      <div class="g_id_signin" data-type="standard"></div>
    </div>

    <script>
      // This function runs after Google Sign-In success
      async function handleCredentialResponse(response) {
        // Decode JWT to get user info (using Google JWT library or manual decode)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const user = JSON.parse(jsonPayload);

        // Extract user's display name (e.g., user.name)
        const displayName = user.name || 'Anonymous';

        // Send the name to backend /scan to record the scan
        try {
          const res = await fetch('/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: displayName })
          });
          if (res.ok) {
            alert('Hello, ' + displayName + '! Your scan has been recorded.');
            // Optionally, reload to update scan count
            location.reload();
          } else {
            alert('Failed to record scan.');
          }
        } catch (error) {
          alert('Error sending scan data: ' + error.message);
        }
      }
    </script>
  </body>
  </html>
  `);
});

// POST /scan - log a scan sent from frontend with user name
app.post('/scan', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    await push(ref(db, 'scans'), {
      name,
      timestamp: new Date().toISOString()
    });
    res.status(200).json({ message: 'Scan recorded' });
  } catch (err) {
    console.error('Error logging scan:', err);
    res.status(500).json({ error: 'Failed to log scan' });
  }
});

// GET /scan - show all scan logs page (with same styling as before)
app.get('/scan', async (req, res) => {
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};

  let rows = '';
  Object.values(scans).forEach(scan => {
    rows += `<tr><td>${scan.name}</td><td>${scan.timestamp}</td></tr>`;
  });

  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <title>Scan Logs</title>
    <style>
      html, body {
        height: 100%;
        margin: 0;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: white;
        overflow: hidden;
      }
      #bg-video {
        position: fixed;
        right: 0;
        bottom: 0;
        min-width: 100%;
        min-height: 100%;
        object-fit: cover;
        z-index: -1;
        filter: brightness(0.6);
      }
      .container {
        position: relative;
        max-width: 900px;
        margin: 60px auto;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 30px;
        box-sizing: border-box;
        color: white;
      }
      body {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: transparent;
        color: white;
      }
      th, td {
        padding: 14px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        text-align: left;
      }
      th {
        background-color: rgba(33, 150, 243, 0.7);
        border-radius: 10px 10px 0 0;
        font-weight: 600;
      }
      tr:hover {
        background-color: rgba(33, 150, 243, 0.2);
      }
      a {
        color: #bbdefb;
        text-decoration: underline;
        font-weight: 600;
        display: inline-block;
        margin-top: 20px;
      }
      a:hover {
        color: #64b5f6;
      }
    </style>
  </head>
  <body>
    <video id="bg-video" autoplay muted loop>
      <source src="/background.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div class="container">
      <h1>QRCodeCounter Logs</h1>
      <table>
        <thead>
          <tr><th>Name</th><th>Timestamp</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
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
