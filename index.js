const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`<h1>Welcome to the QR Scan Counter</h1><p>Visit <a href="/scan">/scan</a> to increment the counter.</p>`);
});

app.get('/scan', (req, res) => {
  const file = 'count.json';
  let countData = { count: 0 };

  if (fs.existsSync(file)) {
    countData = JSON.parse(fs.readFileSync(file));
  }

  countData.count += 1;
  fs.writeFileSync(file, JSON.stringify(countData));

  res.send(`<h1>This QR code has been scanned ${countData.count} times.</h1>`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
