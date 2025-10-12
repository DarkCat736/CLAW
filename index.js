const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const {from} = require("buffer");
const port = 9876;
require('dotenv').config();

const mysql_rootpassword = process.env.MYSQL_DB_PASSWORD;
const mysql_user = process.env.MYSQL_DB_USER;

//server initialization
const app = express();
const server = createServer(app);
server.listen(port, async () => {
    console.log(`CLAW server listening on port ${port}`);
});
const io = new Server(server);

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
});

//begin service routing
app.get('/service/account', (req, res) => {
    res.sendFile(join(__dirname, 'static/account.html'));
});

app.get('/service/checklist', (req, res) => {
    res.sendFile(join(__dirname, 'static/checklist.html'));
});

app.get('/service/teamprojects', (req, res) => {
    res.sendFile(join(__dirname, 'static/team_projects_dashboard.html'));
});

app.get('/service/assignment_tracker', (req, res) => {
    res.sendFile(join(__dirname, 'static/assignment_tracker.html'));
});

app.get('/api/service/checklist/pull_data/:email/:password', async (req, res) => {
    let authorized = await signInForService(req.params.email, decodeURIComponent(req.params.password));
    if (!authorized) {
        res.type("application/json");
        res.send({resType: "error", error: "Authorization error."});
        return;
    }
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        console.log(rows);
        let userInfoObject = JSON.parse(rows[0]["info"]);
        db_connection.destroy();
        if (userInfoObject.checklist == null) {
             userInfoObject.checklist = {
                "0": {
                    "title": "Untitled checklist",
                    "content": {
                        "0": {
                            "content": "Add items now!",
                            "completed": "false"
                        }
                    }
                }
            }
            let db_connection = await mysql.createConnection({
                host: 'localhost',
                user: mysql_user,
                password: mysql_rootpassword,
                database: 'claw'
            });
            let [rows, fields] = await db_connection.execute(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject)}' WHERE email = '${req.params.email}';`);
            db_connection.destroy();
            res.type("application/json");
            res.send({resType: "success", data: `${JSON.stringify(userInfoObject.checklist)}`});
        } else {
            res.type("application/json");
            res.send({resType: "success", data: `${JSON.stringify(userInfoObject.checklist)}`});
        }
    } catch (e) {
        res.type("application/json");
        res.send({resType: "error", error: "Internal server error while getting data."});
        console.log(e);
    }
});

app.get('/api/service/checklist/push_data/:email/:password/:data', async (req, res) => {
    let authorized = await signInForService(req.params.email, decodeURIComponent(req.params.password));
    if (!authorized) {
        res.type("application/json");
        res.send({resType: "error", error: "Authorization error."});
        return;
    }
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        console.log(rows);
        let userInfoObject = JSON.parse(rows[0]["info"]);
        db_connection.destroy();

        userInfoObject.checklist = JSON.parse(decodeURIComponent(req.params.data));
        console.log(JSON.stringify(userInfoObject).replaceAll('\\', '\\\\'));

        db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        [rows, fields] = await db_connection.execute(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}' WHERE email = '${req.params.email}';`);
        db_connection.destroy();
        res.type("application/json");
        res.send({resType: "success"});
    } catch (e) {
        res.type("application/json");
        res.send({resType: "error", error: "Internal server error while pushing data."});
        console.log(e);
    }
});

app.get('/api/service/team_projects/get_added_projects/:email/:password', async (req, res) => {
    let authorized = await signInForService(req.params.email, decodeURIComponent(req.params.password));
    if (!authorized) {
        res.type("application/json");
        res.send({resType: "error", error: "Authorization error."});
        return;
    }
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        console.log(rows);
        let userInfoObject = JSON.parse(rows[0]["info"]);
        db_connection.destroy();
        if (userInfoObject.team_projects == null) {
            userInfoObject.team_projects = {
                "0": {id: "0", name: "Sample Project"}
            };
            let db_connection = await mysql.createConnection({
                host: 'localhost',
                user: mysql_user,
                password: mysql_rootpassword,
                database: 'claw'
            });
            let [rows, fields] = await db_connection.execute(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject)}' WHERE email = '${req.params.email}';`);
            db_connection.destroy();
            res.type("application/json");
            res.send({resType: "success", data: `${JSON.stringify(userInfoObject.team_projects)}`});
        } else {
            res.type("application/json");
            res.send({resType: "success", data: `${JSON.stringify(userInfoObject.team_projects)}`});
        }
    } catch (e) {
        res.type("application/json");
        res.send({resType: "error", error: "Internal server error while getting data."});
        console.log(e);
    }
});

app.get('/api/service/assignment_tracker/pull_data/:email/:password', async (req, res) => {
    let authorized = await signInForService(req.params.email, decodeURIComponent(req.params.password));
    if (!authorized) {
        res.type("application/json");
        res.send({resType: "error", error: "Authorization error."});
        return;
    }
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        console.log(rows);
        let userInfoObject = JSON.parse(rows[0]["info"]);
        db_connection.destroy();
        if (userInfoObject.assignment_tracker == null) {
            userInfoObject.assignment_tracker = {
                "0": {
                    "title": "Untitled checklist",
                    "content": {
                        "0": {
                            "content": "Add items now!",
                            "completed": "false"
                        }
                    }
                }
            }
            let db_connection = await mysql.createConnection({
                host: 'localhost',
                user: mysql_user,
                password: mysql_rootpassword,
                database: 'claw'
            });
            let [rows, fields] = await db_connection.execute(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject)}' WHERE email = '${req.params.email}';`);
            db_connection.destroy();
            res.type("application/json");
            res.send({resType: "success", data: `${JSON.stringify(userInfoObject.checklist)}`});
        } else {
            res.type("application/json");
            res.send({resType: "success", data: `${JSON.stringify(userInfoObject.checklist)}`});
        }
    } catch (e) {
        res.type("application/json");
        res.send({resType: "error", error: "Internal server error while getting data."});
        console.log(e);
    }
});

app.get('/api/service/assignment_tracker/push_data/:email/:password/:data', async (req, res) => {
    let authorized = await signInForService(req.params.email, decodeURIComponent(req.params.password));
    if (!authorized) {
        res.type("application/json");
        res.send({resType: "error", error: "Authorization error."});
        return;
    }
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        console.log(rows);
        let userInfoObject = JSON.parse(rows[0]["info"]);
        db_connection.destroy();

        userInfoObject.checklist = JSON.parse(decodeURIComponent(req.params.data));
        console.log(JSON.stringify(userInfoObject).replaceAll('\\', '\\\\'));

        db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        [rows, fields] = await db_connection.execute(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}' WHERE email = '${req.params.email}';`);
        db_connection.destroy();
        res.type("application/json");
        res.send({resType: "success"});
    } catch (e) {
        res.type("application/json");
        res.send({resType: "error", error: "Internal server error while pushing data."});
        console.log(e);
    }
});

//auth tasks
app.get('/api/auth/signup/:email/:password/:name', async (req, res) => {
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
        if (rows[0] != null) {
            res.type("application/json");
            res.send({resType: "error", error: "The email you provided is already connected to an account"});
            return;
        }

        db_connection.destroy();

        db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });

        let encryptedPassword;
        await bcrypt.hash(req.params.password, 10).then(function(result) {
            encryptedPassword = result;
        });

        [rows, fields] = await db_connection.execute(`INSERT INTO accounts VALUES ('${req.params.email}', '${encryptedPassword}', '${req.params.name}', '{"active":"true","canvasAPIKey":"null"}');`);
        if (rows != null) {
            res.type("application/json");
            res.send({resType: "success", encryptedPassword: `${encryptedPassword}`});
        }
        db_connection.destroy();
    } catch (e) {
        console.error('Error executing query: ', e);
        res.type("application/json");
        res.send({resType: "error", error: "There was an error when processing your request. (internal server error)"});
        try {
            db_connection.destroy();
        } catch (e) {
            console.log("DB connection close failure. (might be a harmless error): ", e);
        }
    }
});

app.get('/api/auth/signin/:email/:password', async (req, res) => {
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${req.params.email}';`);
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
    let authorized = await signInForService(req.params.email, decodeURIComponent(req.params.encryptedPassword));
    if (!authorized) {
        res.type("application/json");
        res.send({result: "false"});
    } else {
        res.type("application/json");
        res.send({result: "true"});
    }
});

io.on('connection', (socket) => {
    console.log(`Collaboration client "${socket.id}" joined. Awaiting initialization call.`);
    socket.on('disconnect', () => {
        console.log(`Collaboration client "${socket.id}" disconnected.`);
    });
    socket.on('init', async (payload) => {
        console.log(payload);
        if (payload.serviceForInit == "team_projects") {
            if (await CLAW_ServerAPI.team_projects.checkAuthForProject(payload.teamProjectID, payload.email, payload.hashedPassword)) {console.log(`auth failure on team_project init for socket "${socket.id}"`);return false;}
            socket.join(`team_project_${payload.teamProjectID}`);
            console.log(`Collaboration client "${socket.id}" assigned to room "team_project_${payload.teamProjectID}" after initialization and authorization.`);
            io.to(`team_project_${payload.teamProjectID}`).emit('update',{type: "new_user", email: payload.email});
        }
    });
});

let CLAW_ServerAPI = {
    collaborationUsers: {
        teamProjectsActiveUsers: []
    },
    team_projects: {
        checkAuthForProject: async function(projectID, email, passwordHash) {
            if (!await signInForService(email, passwordHash)) {return false;}
            try {
                let db_connection = await mysql.createConnection({
                    host: 'localhost',
                    user: mysql_user,
                    password: mysql_rootpassword,
                    database: 'claw'
                });
                let [rows, fields] = await db_connection.execute(`SELECT * FROM team_projects WHERE id = ${projectID};`);

                let isAuthorized = JSON.parse(rows[0].authorizedUsers).includes(email);

                if (isAuthorized) {
                    return true;
                } else {
                    return false;
                }
            } catch (e) {
                console.log(e);
                return false;
            }
        }
    }
};

async function signInForService(email, passwordHash) {
    try {
        let db_connection = await mysql.createConnection({
            host: 'localhost',
            user: mysql_user,
            password: mysql_rootpassword,
            database: 'claw'
        });
        let [rows, fields] = await db_connection.execute(`SELECT * FROM accounts WHERE email = '${email}';`);

        return (passwordHash === rows[0].password);
    } catch (e) {
        console.log(e);
        return false;
    }
}