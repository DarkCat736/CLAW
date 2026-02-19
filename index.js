const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const {from} = require("buffer");
const port = 9876;
require('dotenv').config();

const mysql_rootpassword = process.env.MYSQL_DB_PASSWORD;
const mysql_user = process.env.MYSQL_DB_USER;
const mysql_host = process.env.MYSQL_DB_HOST;
const mysql_dbname = process.env.MYSQL_DB_NAME;

let dbPool = mysql.createPool({
    host: mysql_host,
    user: mysql_user,
    password: mysql_rootpassword,
    database: mysql_dbname,
    waitForConnections: true,
    connectionLimit: 20
});

module.exports = {
    dbPool
}

const realtime_handler = require('./service_modules/realtime_handler');
const auth_backend = require('./service_modules/auth_backend');

//server initialization
const app = express();
const server = createServer(app);
realtime_handler.api.init(server);
server.listen(port, async () => {
    console.log(`CLAW server listening on port ${port}`);
});

let service_config = JSON.parse(process.env.SERVICE_AVAILABILITY);

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'static/dashboard.html'));
});

app.get('/static/graphics/:fileName', (req, res) => {
    res.type('image/png');
    res.sendFile(join(__dirname, `static/graphics/${req.params.fileName}`));
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
})

app.get('/api/getstyle', (req, res) => {
    res.setHeader('content-type', 'text/css');
    res.sendFile(join(__dirname, 'static/style.css'));
});

//begin service routing
app.get('/service/account', (req, res) => {
    res.sendFile(join(__dirname, 'static/account.html'));
});

app.get('/service/checklist', (req, res) => {
    res.sendFile(join(__dirname, 'static/checklist.html'));
});

//auth tasks
app.get('/api/auth/signup/:email/:password/:name', async (req, res) => {
    try {
        let [rows, fields] = await dbPool.query(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        if (rows[0] != null) {
            res.type("application/json");
            res.send({resType: "error", error: "The email you provided is already connected to an account"});
            return;
        }

        let encryptedPassword;
        await bcrypt.hash(req.params.password, 10).then(function(result) {
            encryptedPassword = result;
        });

        [rows, fields] = await dbPool.query(`INSERT INTO accounts VALUES ('${req.params.email}', '${encryptedPassword}', '${req.params.name}', '{"active":"true","canvasAPIKey":null}');`);
        if (rows != null) {
            res.type("application/json");
            res.send({resType: "success", encryptedPassword: `${encryptedPassword}`});
        }
    } catch (e) {
        console.error('Error executing query: ', e);
        res.type("application/json");
        res.send({resType: "error", error: "There was an error when processing your request. (internal server error)"});
    }
});

app.get('/api/auth/signin/:email/:password', async (req, res) => {
    try {
        let [rows, fields] = await dbPool.query(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        if (rows[0] == null) {
            res.type("application/json");
            res.send({resType: "error", error: "There is no account associated with the provided email."});
            return;
        }

        let didDecryptionSucceed;
        await bcrypt.compare(req.params.password, rows[0].password).then(function(result) {
            didDecryptionSucceed = result;
        });

        if (didDecryptionSucceed) {
            res.type("application/json");
            res.send({resType: "success", email: `${rows[0].email}`, encryptedPassword: `${rows[0].password}`, name: `${rows[0].name}`, info: `${rows[0].info}`});
        } else {
            res.type("application/json");
            res.send({resType: "error", error: "The provided password is incorrect."});
        }
    } catch (e) {
        console.log(e);
        res.type("application/json");
        res.send({resType: "error", error: "There was an error when processing your request. (internal server error)"});
    }
});

app.get('/api/auth/authorize_creds/:email/:encryptedPassword', async (req, res) => {
    let authorized = await auth_backend.authAPI.signInForService(req.params.email, decodeURIComponent(req.params.encryptedPassword), dbPool);
    if (!authorized) {
        res.type("application/json");
        res.send({result: "false"});
    } else {
        res.type("application/json");
        res.send({result: "true"});
    }
});
