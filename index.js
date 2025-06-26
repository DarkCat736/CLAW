const express = require('express');
const {join} = require("node:path");
const app = express();
const mysql = require('mysql2');
const port = 9876;
const mysql_rootpassword = ""; //INSERT ROOT PASSWORD!!
let service_config = {
    checklist: {
        available: true
    },
    solo_projects: {
        available: true
    },
    team_projects: {
        available: true
    },
    account: {
        available: true
    }
};

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'static/dashboard.html'));
});

app.get('/api/service/:serviceID/availability', (req, res) => {
    if (service_config[req.params.serviceID].available) {
        res.send("true");
    } else {
        res.send("false");
    }
});

app.get('/api/getclientapi', (req, res) => {
    res.setHeader('content-type', 'text/javascript');
    res.sendFile(join(__dirname, 'static/client-api.js'));
});

app.listen(port, () => {
    console.log(`CLAW server listening on port ${port}`);
});