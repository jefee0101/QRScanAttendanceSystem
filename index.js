const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Firebase modular imports
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get } = require('firebase/database');

// Serve static files (for background video)
app.use(express.static('public'));

// Your Firebase config (replace with your actual config)
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

// Home route with input form and live scan count
app.get('/', async (req, res) => {
  // Get all scans count from Firebase DB
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};
  const scanCount = Object.keys(scans).length;

  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <title>QRCodeCounter - Home</title>
    <style>
      /* Reset and base styles */
      html, body {
        height: 100%;
        margin: 0;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: white;
        overflow: hidden;
      }

      /* Video background */
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

      /* Glass effect container */
      .container {
        position: relative;
        max-width: 400px;
        margin: 80px auto;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 30px;
        box-sizing: border-box;
        text-align: center;
      }

      /* Form input */
      input[type="text"] {
        width: 80%;
        padding: 10px;
        border: none;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 1rem;
      }

      /* Button styling */
      button {
        background-color: #2196f3;
        border: none;
        padding: 10px 20px;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.3s ease;
      }

      button:hover {
        background-color: #0b7dda;
      }

      /* Links */
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

      /* Scan count styling */
      .scan-count {
        font-size: 1.2rem;
        margin-bottom: 20px;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <!-- Video background -->
    <video id="bg-video" autoplay muted loop>
      <source src="/background.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    <div class="container">
      <h1>Welcome to QRCodeCounter</h1>
      <div class="scan-count">Total Scans: ${scanCount}</div>
      <form method="GET" action="/scan">
        <input type="text" name="name" placeholder="Enter your name" required />
        <button type="submit">Scan</button>
      </form>
      <a href="/scan">View all scan logs</a>
    </div>
  </body>
  </html>
  `);
});

// /scan route: logs new scans or shows all logs with glass effect and video background
app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    // Log the scan in Firebase Realtime Database
    await push(ref(db, 'scans'), {
      name: name,
      timestamp: new Date().toISOString()
    });

    // Confirmation page after logging scan
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Scan Recorded</title>
        <style>
          html, body {
            height: 100%;
            margin: 0;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: black;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .container {
            background: rgba(0, 0, 0, 0.7);
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            box-sizing: border-box;
          }
          a {
            color: #2196f3;
            text-decoration: underline;
          }
          a:hover {
            color: #0b7dda;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hello, ${name}!</h1>
          <p>Your scan has been recorded in QRCodeCounter.</p>
          <p><a href="/scan">View scan logs</a></p>
          <p><a href="/">Back to Home</a></p>
        </div>
      </body>
      </html>
    `);
  }

  // Show all scan logs if no name query param
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};

  // Generate table rows dynamically
  let rows = '';
  Object.values(scans).forEach(scan => {
    rows += `<tr><td>${scan.name}</td><td>${scan.timestamp}</td></tr>`;
  });

  // Logs page with glass effect container and video background
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
