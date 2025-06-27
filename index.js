const express = require('express');
const {join} = require("node:path");
const app = express();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const {from} = require("buffer");
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

//begin service routing
app.get('/service/account', (req, res) => {
    res.sendFile(join(__dirname, 'static/account_service.html'));
});

//auth tasks
app.get('/api/auth/signup/:email/:password/:name', async (req, res) => {
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        if (rows[0] != null) {
            res.type("application/json");
            res.send({resType: "error", error: "The email you provided is already connected to an account"});
            return;
        }

        db_connection.end();

        db_connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: mysql_rootpassword,
            database: 'claw'
        });

        let encryptedPassword;
        await bcrypt.hash(req.params.password, 10).then(function(result) {
            encryptedPassword = result;
        });

        [rows, fields] = await db_connection.execute(`INSERT INTO accounts VALUES ('${req.params.email}', '${encryptedPassword}', '${req.params.name}', '{active: true}');`);
        if (rows != null) {
            res.type("application/json");
            res.send({resType: "success", encryptedPassword: `${encryptedPassword}`});
        }
        db_connection.end();
    } catch (e) {
        console.error('Error executing query: ', e);
        res.type("application/json");
        res.send({resType: "error", error: "There was an error when processing your request. (internal server error)"});
        try {
            db_connection.end();
        } catch (e) {
            console.log("DB connection close failure. (might be a harmless error): ", e);
        }
    }
});

app.listen(port, async () => {
    console.log(`CLAW server listening on port ${port}`);
});

async function encrypt(text) {
    let encryptedText;
    let didFail;
    await bcrypt.hash(text, 10, function(err, hash) {
        if (err) {
            console.error('Error hashing password:', err);
            didFail = true;
            return;
        }
        console.log(hash);
        encryptedText = hash;
    });
    if (didFail) {
        return;
    }
    return encryptedText;
}

async function decrypt(encryptedText, key) {
    let success;
    await bcrypt.compare(key, encryptedText, async function(err, result) {
        if (err) {
            console.error('Error comparing password:', err);
            success = false;
            return;
        }
        if (result) {
            console.log('Password matched!');
            success = true;
        } else {
            console.log('Password did not match.');
            success = false;
        }
    });
    return success;
}