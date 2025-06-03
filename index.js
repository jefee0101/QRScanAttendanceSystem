const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Reusable HTML wrapper with animated red gradient
const htmlWrapper = (title, bodyContent) => `
<html>
  <head>
    <title>${title}</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        height: 100vh;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(-45deg, #ff4b4b, #ff0000, #b30000, #ff4b4b);
        background-size: 400% 400%;
        animation: gradientFlow 15s ease infinite;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        text-align: center;
      }
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .content {
        max-width: 800px;
        width: 100%;
        padding: 40px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.4);
      }
      h1 {
        margin-bottom: 20px;
        font-size: 2.5em;
      }
      form input, form button {
        padding: 12px 20px;
        font-size: 1em;
        border: none;
        border-radius: 8px;
        margin: 10px 5px;
      }
      form input {
        width: 60%;
      }
      form button {
        background-color: #ff1a1a;
        color: white;
        cursor: pointer;
        transition: background 0.3s;
      }
      form button:hover {
        background-color: #cc0000;
      }
      a {
        color: #ffecec;
        display: inline-block;
        margin-top: 20px;
        text-decoration: underline;
      }
      .count {
        margin-top: 20px;
        font-size: 1.2em;
        font-weight: bold;
      }
      table {
        width: 100%;
        margin-top: 20px;
        border-collapse: collapse;
        color: white;
      }
      th, td {
        padding: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      th {
        background-color: rgba(255, 255, 255, 0.1);
      }
    </style>
  </head>
  <body>
    <div class="content">
      ${bodyContent}
    </div>
  </body>
</html>
`;

// Homepage
app.get('/', async (req, res) => {
  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
  const scans = snapshot.val() || {};
  const count = Object.keys(scans).length;

  res.send(htmlWrapper(
    'QRCodeCounter',
    `
      <h1>Welcome to QRCodeCounter</h1>
      <form method="GET" action="/scan">
        <input type="text" name="name" placeholder="Enter your name" required>
        <button type="submit">Scan</button>
      </form>
      <div class="count">Total scans so far: ${count}</div>
      <a href="/scan">View all scan logs</a>
    `
  ));
});

// Scan or view logs
app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    const scansRef = db.ref('scans');
    await scansRef.push({
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.send(htmlWrapper(
      'Scan Recorded',
      `
        <h1>Hello, ${name}!</h1>
        <p>Your scan has been recorded.</p>
        <a href="/scan">View scan logs</a>
      `
    ));
  }

  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
  const scans = snapshot.val() || {};

  let rows = Object.values(scans).map(scan => 
    `<tr><td>${scan.name}</td><td>${scan.timestamp}</td></tr>`).join('');

  res.send(htmlWrapper(
    'Scan Logs',
    `
      <h1>QRCodeCounter Logs</h1>
      <table>
        <tr><th>Name</th><th>Timestamp</th></tr>
        ${rows}
      </table>
      <a href="/">Back to Home</a>
    `
  ));
});

// Start server
app.listen(PORT, () => {
  console.log(`QRCodeCounter server running on port ${PORT}`);
});
