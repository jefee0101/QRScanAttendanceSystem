const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Load Firebase admin credentials
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Home route with input form
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to QRCodeCounter</h1>
    <form method="GET" action="/scan">
      <input type="text" name="name" placeholder="Enter your name" required>
      <button type="submit">Scan</button>
    </form>
    <p><a href="/scan">View all scan logs</a></p>
  `);
});

// /scan route: logs or shows logs
app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    const scansRef = db.ref('scans');
    await scansRef.push({
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.send(`<h1>Hello, ${name}! Your scan has been recorded in QRCodeCounter.</h1><p><a href="/scan">View scan logs</a></p>`);
  }

  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
  const scans = snapshot.val() || {};

  let html = `<h1>QRCodeCounter Logs</h1><table border="1" cellpadding="8" cellspacing="0">
    <tr><th>Name</th><th>Timestamp</th></tr>`;

  Object.values(scans).forEach(scan => {
    html += `<tr><td>${scan.name}</td><td>${scan.timestamp}</td></tr>`;
  });

  html += `</table><p><a href="/">Back to Home</a></p>`;

  res.send(html);
});

// Start server
app.listen(PORT, () => {
  console.log(`QRCodeCounter server running on port ${PORT}`);
});
