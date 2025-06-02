const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Firebase modular imports
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, push, get } = require('firebase/database');

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase app and database
const appFirebase = initializeApp(firebaseConfig);
const db = getDatabase(appFirebase);

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
    // Log the scan
    await push(ref(db, 'scans'), {
      name: name,
      timestamp: new Date().toISOString()
    });

    return res.send(`<h1>Hello, ${name}! Your scan has been recorded in QRCodeCounter.</h1><p><a href="/scan">View scan logs</a></p>`);
  }

  // No name → show logs
  const snapshot = await get(ref(db, 'scans'));
  const scans = snapshot.val() || {};

  let html = `<h1>QRCodeCounter Logs</h1><table border="1" cellpadding="8" cellspacing="0">
    <tr><th>Name</th><th>Timestamp</th></tr>`;

  Object.values(scans).forEach(scan => {
    html
