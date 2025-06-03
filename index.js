const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://qrcodecounter-4fedb-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.get('/', async (req, res) => {
  // Get current scan count
  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
  const scans = snapshot.val() || {};
  const count = Object.keys(scans).length;

  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <title>QRCodeCounter</title>
    <style>
      /* Reset & body styles */
      html, body {
        height: 100%;
        margin: 0;
        font-family: Arial, sans-serif;
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
        filter: brightness(0.7);
      }

      /* Container to center content */
      .container {
        position: relative;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #fff;
        text-align: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.4);
        box-sizing: border-box;
      }

      input[type="text"] {
        padding: 10px;
        font-size: 1rem;
        border-radius: 4px;
        border: none;
        margin-right: 10px;
        width: 250px;
      }

      button {
        padding: 10px 20px;
        font-size: 1rem;
        border: none;
        border-radius: 4px;
        background-color: #2196f3;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      button:hover {
        background-color: #0b7dda;
      }

      a {
        color: #fff;
        text-decoration: underline;
        margin-top: 20px;
        display: inline-block;
      }

      #live-count {
        font-size: 2rem;
        margin: 20px 0;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <video id="bg-video" autoplay muted loop>
      <source src="/background.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    <div class="container">
      <h1>Welcome to QRCodeCounter</h1>
      <div id="live-count">Total Scans: ${count}</div>

      <form method="GET" action="/scan" onsubmit="return validateForm()">
        <input type="text" name="name" placeholder="Enter your name" required>
        <button type="submit">Scan</button>
      </form>

      <p><a href="/scan">View all scan logs</a></p>
    </div>

    <script>
      // Live count update every 3 seconds
      async function updateCount() {
        try {
          const res = await fetch('/count');
          if(res.ok){
            const data = await res.json();
            document.getElementById('live-count').innerText = 'Total Scans: ' + data.count;
          }
        } catch(e) {
          console.error('Failed to fetch live count', e);
        }
      }

      setInterval(updateCount, 3000);

      // Optional form validation
      function validateForm() {
        const input = document.querySelector('input[name="name"]').value.trim();
        if(input.length === 0){
          alert('Please enter your name.');
          return false;
        }
        return true;
      }
    </script>
  </body>
  </html>
  `);
});

// Endpoint to provide live count as JSON
app.get('/count', async (req, res) => {
  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
  const scans = snapshot.val() || {};
  const count = Object.keys(scans).length;
  res.json({ count });
});

app.get('/scan', async (req, res) => {
  const name = req.query.name;

  if (name) {
    const scansRef = db.ref('scans');
    await scansRef.push({
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Scan Recorded</title>
        <style>
          html, body {
            height: 100%;
            margin: 0;
            font-family: Arial, sans-serif;
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

  const scansRef = db.ref('scans');
  const snapshot = await scansRef.once('value');
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
        font-family: Arial, sans-serif;
        background: black;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      body {
        background: black;
      }
      .container {
        width: 90%;
        max-width: 800px;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border-radius: 10px;
        box-sizing: border-box;
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        color: white;
      }
      th, td {
        padding: 12px 15px;
        border-bottom: 1px solid #ddd;
        text-align: left;
      }
      th {
        background-color: #2196f3;
      }
      tr:hover {
        background-color: rgba(33, 150, 243, 0.2);
      }
      a {
        display: inline-block;
        margin-top: 20px;
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

app.listen(PORT, () => {
  console.log(`QRCodeCounter server running on port ${PORT}`);
});
