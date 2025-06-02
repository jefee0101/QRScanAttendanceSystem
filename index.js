const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;

// Parse service account from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Home page with input form
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

// Handle scan logging or log listing
app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    const scansRef = db.ref('scans');
    await scansRef.push({
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.send(`<h1>Hello, ${name}! Your scan has been recorded.</h1><p><a href="/scan">View scan logs</a></p>`);
  }

  // No name → show all scan logs
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
