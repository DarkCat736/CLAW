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
    onlineUsers: {}
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