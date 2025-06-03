const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;

// Firebase service account from environment
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Homepage
app.get('/', async (req, res) => {
  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
  const scans = snapshot.val() || {};
  const count = Object.keys(scans).length;

  res.send(`
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            height: 100vh;
            background: linear-gradient(120deg, #0a0a0a, #111);
            color: #fff;
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }

          .wave-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 200%;
            height: 200%;
            background: linear-gradient(-45deg, #ff0000, #b30000, #ff4d4d, #ff1a1a);
            background-size: 400% 400%;
            animation: wave 15s ease infinite;
            z-index: -1;
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            opacity: 0.2;
            transform: rotate(-10deg);
          }

          @keyframes wave {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.2);
            max-width: 500px;
            width: 100%;
            text-align: center;
          }

          h1 {
            margin-bottom: 20px;
          }

          input[type="text"] {
            padding: 10px;
            width: 80%;
            border: none;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 16px;
          }

          button {
            padding: 10px 20px;
            background-color: #ff1a1a;
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s ease;
          }

          button:hover {
            background-color: #cc0000;
          }

          .count {
            margin-top: 20px;
            font-size: 18px;
            color: #ff6666;
          }

          a {
            display: inline-block;
            margin-top: 20px;
            color: #ff4d4d;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="wave-bg"></div>
        <div class="container">
          <h1>Welcome to QRCodeCounter</h1>
          <form method="GET" action="/scan">
            <input type="text" name="name" placeholder="Enter your name" required><br>
            <button type="submit">Scan</button>
          </form>
          <div class="count">Total scans so far: <strong>${count}</strong></div>
          <a href="/scan">View all scan logs</a>
        </div>
      </body>
    </html>
  `);
});

// Scan route
app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    const scansRef = db.ref('scans');
    await scansRef.push({
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.redirect('/scan');
  }

  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
  const scans = snapshot.val() || {};

  let rows = Object.values(scans).map(scan =>
    `<tr><td>${scan.name}</td><td>${scan.timestamp}</td></tr>`).join('');

  res.send(`
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            height: 100vh;
            background: linear-gradient(120deg, #0a0a0a, #111);
            color: #fff;
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: auto;
          }

          .wave-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 200%;
            height: 200%;
            background: linear-gradient(-45deg, #ff0000, #b30000, #ff4d4d, #ff1a1a);
            background-size: 400% 400%;
            animation: wave 15s ease infinite;
            z-index: -1;
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            opacity: 0.2;
            transform: rotate(-10deg);
          }

          @keyframes wave {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          .container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.2);
            max-width: 800px;
            width: 90%;
            text-align: center;
          }

          h1 {
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            color: #fff;
          }

          th, td {
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          th {
            background-color: rgba(255, 0, 0, 0.3);
          }

          tr:nth-child(even) {
            background-color: rgba(255, 255, 255, 0.05);
          }

          a {
            display: inline-block;
            margin-top: 20px;
            color: #ff4d4d;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="wave-bg"></div>
        <div class="container">
          <h1>QRCodeCounter Logs</h1>
          <table>
            <tr><th>Name</th><th>Timestamp</th></tr>
            ${rows}
          </table>
          <a href="/">Back to Home</a>
        </div>
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`QRCodeCounter server running on port ${PORT}`);
});
