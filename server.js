const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/save-data', (req, res) => {
  try {
    const jsonData = JSON.stringify(req.body, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `data-${timestamp}.txt`;
    const filepath = path.join(__dirname, 'data', filename);

    if (!fs.existsSync(path.join(__dirname, 'data'))) {
      fs.mkdirSync(path.join(__dirname, 'data'));
    }

    fs.writeFileSync(filepath, jsonData);

    res.json({
      success: true,
      message: 'Data saved successfully',
      filename: filename
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving data'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});