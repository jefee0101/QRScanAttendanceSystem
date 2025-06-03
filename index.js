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

// Serve homepage
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
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 80px auto;
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          input, button {
            padding: 10px;
            font-size: 16px;
            margin-top: 10px;
          }
          .count {
            margin-top: 20px;
            font-size: 18px;
            color: #444;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            text-decoration: none;
            color: #007BFF;
          }
        </style>
      </head>
      <body>
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

// Scan or view logs
app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    const scansRef = db.ref('scans');
    await scansRef.push({
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              background-color: #f0f0f0;
              padding: 80px 20px;
            }
            .message {
              background-color: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              max-width: 600px;
              margin: auto;
            }
            a {
              display: inline-block;
              margin-top: 20px;
              text-decoration: none;
              color: #007BFF;
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h1>Hello, ${name}!</h1>
            <p>Your scan has been recorded.</p>
            <a href="/scan">View scan logs</a>
          </div>
        </body>
      </html>
    `);
  }

  // Show scan logs
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
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            padding: 60px 20px;
            text-align: center;
          }
          .container {
            max-width: 800px;
            margin: auto;
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            text-decoration: none;
            color: #007BFF;
          }
        </style>
      </head>
      <body>
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
