const { Server } = require("socket.io");
const { createServer } = require('node:http');
const auth_backend = require('./auth_backend');
const db = require('./../index.js');
const {dbPool} = require("../index");


let io;

let api = {
    init: function(expressServer) {
        io = new Server(expressServer);
        ioHandlers();
    },
    assignment_tracker: {

    },
    onlineUsers: {}
}

async function assignment_tracker_DIRECTOR(payload, socket) {
    switch (payload.payload) {
        case "INIT":
            try {
                let authorized = await auth_backend.authAPI.signInForService(payload.email, payload.password, db.dbPool);
                if (!authorized) {
                    return {status: "error", code: "Authorization error"};
                }
                api.onlineUsers[`${socket.id}`] = {email: payload.email, id: socket.id, service: "assignment_tracker"};
                console.log(`[${socket.id}] registered as "${payload.email}" for "assignment_tracker"`);
                return {status: "ok"}
            } catch(e) {
                console.log(e);
                return {status: "error", code: "Init error"};
            }
            break;
        case "GET_AVAILABLE_CLASSES":
            if (api.onlineUsers[socket.id] !== undefined) {
                try {
                    let [rows, fields] = await dbPool.query(`SELECT * FROM accounts WHERE email = '${api.onlineUsers[socket.id].email}';`);

                    let userInfoObject = JSON.parse(rows[0]["info"]);
                    console.log(userInfoObject);
                    if (userInfoObject.assignment_tracker === undefined) {
                        let [rows, fields] = await dbPool.query(`INSERT INTO assignment_tracker VALUES (NULL, '${api.onlineUsers[socket.id].email}', '["${api.onlineUsers[socket.id].email}"]', '{"metadata":{"name":"Untitled 01"}}');`);
                        userInfoObject.assignment_tracker = {
                            "0": {
                                "id": `${rows["insertId"]}`,
                                "owned": "true"
                            }
                        }
                        console.log(userInfoObject);
                        console.log(JSON.stringify(userInfoObject));
                        const result = await dbPool.query(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject)}' WHERE email = '${api.onlineUsers[socket.id].email}';`);
                        return {status: "ok", payload: userInfoObject.assignment_tracker};
                    } else {
                        return {status: "ok", payload: userInfoObject.assignment_tracker};
                    }
                } catch(e) {
                    console.log(e);
                    return {status: "error", code: "Unknown error"};
                }
            } else {
                return {status: "error", code: "Auth error"};
            }
            break;
        case "GET_CLASS_METADATA":
            if (api.onlineUsers[socket.id] !== undefined) {
                try {
                    let [rows, fields] = await dbPool.query(`SELECT * FROM assignment_tracker WHERE id = ${payload.classId};`);
                    let permittedUsersForClass = JSON.parse(rows[0]["permittedUsers"]);
                    if (permittedUsersForClass.includes(api.onlineUsers[socket.id].email)) {
                        let metadata = JSON.parse(rows[0]["data"]).metadata;
                        return {status: "ok", payload: metadata};
                    }
                    return {status: "error", code: "Auth error"};
                } catch(e) {
                    console.log(e);
                    return {status: "error", code: "Unknown error"};
                }
            } else {
                return {status: "error", code: "Auth error"};
            }
            break;
        case "CREATE_NEW_CLASS":
            if (api.onlineUsers[socket.id] !== undefined) {
                try {
                    let [rows, fields] = await dbPool.query(`SELECT * FROM accounts WHERE email = '${api.onlineUsers[socket.id].email}';`);

                    let userInfoObject = JSON.parse(rows[0]["info"]);
                    console.log(userInfoObject);

                    [rows, fields] = await dbPool.query(`INSERT INTO assignment_tracker VALUES (NULL, '${api.onlineUsers[socket.id].email}', '["${api.onlineUsers[socket.id].email}"]', '{"metadata":{"name":"Untitled class"}}');`);
                    userInfoObject.assignment_tracker[`${Object.keys(userInfoObject.assignment_tracker).length}`] = {
                        "id": `${rows["insertId"]}`,
                        "owned": "true"
                    }
                    console.log(userInfoObject);
                    console.log(JSON.stringify(userInfoObject));
                    const result = await dbPool.query(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject)}' WHERE email = '${api.onlineUsers[socket.id].email}';`);

                    for (let i = 0; i < Object.keys(api.onlineUsers).length; i++) {
                        console.log(api.onlineUsers[Object.keys(api.onlineUsers)[i]].email, api.onlineUsers[socket.id].email);
                        if (api.onlineUsers[Object.keys(api.onlineUsers)[i]].email === api.onlineUsers[socket.id].email) {
                            await io.to(api.onlineUsers[Object.keys(api.onlineUsers)[i]].id).emit("assignment_tracker", {payload: "PULL_CLASSES_COMMAND"}, async (err, response) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    if (response.status === "complete") {
                                        console.log("completed command");
                                    } else {
                                        //failure
                                    }
                                }
                            });
                        }
                    }
                    return {status: "ok", payload: userInfoObject.assignment_tracker};
                } catch(e) {
                    console.log(e);
                    return {status: "error", code: "Unknown error"};
                }
            } else {
                return {status: "error", code: "Auth error"};
            }
            break;
        default:
            console.log("Assignment tracker socket io payload director failure");
            return {status: "error", code: "Payload translation error"};
    }
}

async function checklist_DIRECTOR(payload, socket) {
    switch (payload.payload) {
        case "INIT":
            try {
                let authorized = await auth_backend.authAPI.signInForService(payload.email, payload.password, db.dbPool);
                if (!authorized) {
                    return {status: "error", code: "Authorization error"};
                }
                api.onlineUsers[`${socket.id}`] = {email: payload.email, id: socket.id, service: "checklist"};
                console.log(`[${socket.id}] registered as "${payload.email}" for "checklist"`);
                return {status: "ok"}
            } catch(e) {
                console.log(e);
                return {status: "error", code: "Init error"};
            }
            break;
        case "PULL_DB_DATA":
            if (api.onlineUsers[socket.id] !== undefined) {
                try {
                    const [rows, fields] = await dbPool.query(`SELECT * FROM accounts WHERE email = '${api.onlineUsers[socket.id].email}';`);
                    console.log(rows);
                    let userInfoObject = rows[0]["info"];
                    if (userInfoObject.checklist == null) {
                        userInfoObject.checklist = {
                            "0": {
                                "title": `${btoa("Untitled checklist")}`,
                                "content": {
                                    "0": {
                                        "content": `${btoa("Add items now!")}`,
                                        "completed": "false"
                                    }
                                }
                            }
                        }

                        const result = await dbPool.query(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject)}' WHERE email = '${api.onlineUsers[socket.id].email}';`);

                        return {status: "ok", payload: userInfoObject.checklist};
                    } else {
                        return {status: "ok", payload: userInfoObject.checklist};
                    }
                } catch (e) {
                    console.log(e);
                    return {status: "error", code: "Unknown error"};
                }
            } else {
                return {status: "error", code: "Auth error"};
            }
            break;
        case "PUSH_DB_DATA":
            if (api.onlineUsers[socket.id] !== undefined) {
                try {
                    let [rows, fields] = await dbPool.query(`SELECT * FROM accounts WHERE email = '${api.onlineUsers[socket.id].email}';`);
                    console.log(rows);
                    let userInfoObject = rows[0]["info"];

                    userInfoObject.checklist = payload.data;
                    console.log(payload.data);

                    [rows, fields] = await dbPool.query(`UPDATE accounts SET info = '${JSON.stringify(userInfoObject)}' WHERE email = '${api.onlineUsers[socket.id].email}';`);
                    return {status: "ok"};
                } catch (e) {
                    console.log(e);
                    return {status: "error", code: "Internal server error while pushing data"};
                }
            } else {
                return {status: "error", code: "Auth error"};
            }
            break;
        default:
            console.log("Checklist socket io payload director failure");
            return {status: "error", code: "Payload translation error"};
    }
}

function ioHandlers() {
    io.on('connection', (socket) => {
        console.log(`[${socket.id}] connected`);

        socket.on('assignment_tracker', async (payload, callback) => {
            let returnPayload = await assignment_tracker_DIRECTOR(payload, socket);
            callback(returnPayload);
        });

        socket.on('checklist', async (payload, callback) => {
            let returnPayload = await checklist_DIRECTOR(payload, socket);
            callback(returnPayload);
        });

        socket.on('disconnect', () => {
            try {
                console.log(`[${socket.id}] as "${api.onlineUsers[socket.id].email}" disconnected from "${api.onlineUsers[socket.id].service}"`);
                delete api.onlineUsers[socket.id];
            } catch (e) {
                console.log("Possible user list mismatch on disconnect", e);
            }
        });
    });
}

module.exports = {
    api
};