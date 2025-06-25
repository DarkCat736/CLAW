const express = require('express');
const {join} = require("node:path");
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'static/dashboard.html'));
});

app.get('/api/service/:serviceID/availability', (req, res) => {
    res.send("true");
});

app.get('/api/getclientapi', (req, res) => {
    res.setHeader('content-type', 'text/javascript');
    res.sendFile(join(__dirname, 'static/client-api.js'));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});