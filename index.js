const express = require('express');
const firebase = require('firebase');
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAX_fn8C2f4Jmg98Ryu4y73teIr2vkPMXo",
  authDomain: "qrcodecounter-4fedb.firebaseapp.com",
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com",
  projectId: "qrcodecounter-4fedb",
  storageBucket: "qrcodecounter-4fedb.firebasestorage.app",
  messagingSenderId: "460463651638",
  appId: "1:460463651638:web:b97941c421e03650865197",
  measurementId: "G-RJ36RHCH02"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ✅ Common CSS for styling
const style = `
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 2rem;
      background-color: #f4f4f4;
      color: #333;
    }

    h1 {
      color: #2c3e50;
    }

    form {
      margin-top: 1rem;
    }

    input[type="text"] {
      padding: 0.5rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      color: white;
      background-color: #3498db;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 0.5rem;
    }

    button:hover {
      background-color: #2980b9;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
    }

    table th, table td {
      border: 1px solid #ccc;
      padding: 0.75rem;
      text-align: left;
    }

    table th {
      background-color: #2c3e50;
      color: white;
    }

    a {
      display: inline-block;
      margin-top: 1rem;
      color: #3498db;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  </style>
`;

// 🏠 Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QRCodeCounter</title>
      ${style}
      <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
      <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
    </head>
    <body>
      <h1>Welcome to QRCodeCounter</h1>
      <p><strong>Total People Scanned:</strong> <span id="count">Loading...</span></p>

      <form method="GET" action="/scan">
        <input type="text" name="name" placeholder="Enter your name" required>
        <button type="submit">Scan</button>
      </form>

      <a href="/scan">View Scan Logs</a>

      <script>
        // ✅ Same Firebase config for client-side
        const firebaseConfig = {
          apiKey: "AIzaSyAX_fn8C2f4Jmg98Ryu4y73teIr2vkPMXo",
          authDomain: "qrcodecounter-4fedb.firebaseapp.com",
          databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com",
          projectId: "qrcodecounter-4fedb",
          storageBucket: "qrcodecounter-4fedb.firebasestorage.app",
          messagingSenderId: "460463651638",
          appId: "1:460463651638:web:b97941c421e03650865197",
          measurementId: "G-RJ36RHCH02"
        };

        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();
        const countSpan = document.getElementById('count');

        db.ref('scans').on('value', (snapshot) => {
          const scans = snapshot.val() || {};
          countSpan.textContent = Object.keys(scans).length;
        });
      </script>
    </body>
    </html>
  `);
});

// ✅ /scan route
app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    await db.ref('scans').push({
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scan Recorded</title>
        ${style}
      </head>
      <body>
        <h1>Hello, ${name}!</h1>
        <p>Your scan has been recorded in QRCodeCounter.</p>
        <a href="/scan">View Scan Logs</a><br>
        <a href="/">Back to Home</a>
      </body>
      </html>
    `);
  }

  const snapshot = await db.ref('scans').once('value');
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
      ${style}
    </head>
    <body>
      <h1>QRCodeCounter Logs</h1>
      <table>
        <tr><th>Name</th><th>Timestamp</th></tr>
        ${rows}
      </table>
      <a href="/">Back to Home</a>
    </body>
    </html>
  `);
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`QRCodeCounter running on port ${PORT}`);
});
