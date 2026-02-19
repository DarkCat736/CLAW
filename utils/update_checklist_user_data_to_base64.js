const mysql = require('mysql2/promise');
require('dotenv').config();
const readline = require('node:readline/promises');

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
    connectionLimit: 1
});

async function main() {
    await warnings();

    let [rows, fields] = await dbPool.query(`SELECT * FROM accounts;`);

    for (let i = 0; i < rows.length; i++) {
        if (rows[i].info.checklist !== undefined) {
            let convertedChecklistData = await convertToBase64(rows[i].info.checklist);
            try {
                rows[i].info.checklist = convertedChecklistData;
                [r, f] = await dbPool.query(`UPDATE accounts SET info = '${JSON.stringify(rows[i].info)}' WHERE email = '${rows[i].email}';`);
            } catch (e) {
                console.log(e);
            }
        }
    }

    console.log();
    console.log("All rows updated successfully! The script will now close...");
    process.exit();
}

async function warnings() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('');
    console.log('This script will access the database listed in the .env file (which you should\'ve copied from your root directory to this directory), and then update all user data for the checklist service to Base64.');
    console.log('BE WARNED: Any data that is ALREADY Base64 encoded will be DESTROYED. Only use this tool if all checklist user data is currently stored in PLAIN TEXT!');
    console.log('Any data loss due to not reading the above warning is not our fault.');
    console.log('');
    await rl.question('Press enter to continue, or CTRL+C to stop the script execution.');
    rl.close();

    console.log('');
    console.log('Please be patient... depending on database size this may take a while. DO NOT CLOSE THIS PROGRAM WHILE UPDATING IS IN PROGRESS!');
}

async function convertToBase64(checklistData) {
    let editedChecklistData = checklistData;

    for (let checklistIndex = 0; checklistIndex < Object.keys(checklistData).length; checklistIndex++) {
        editedChecklistData[checklistIndex].title = btoa(editedChecklistData[checklistIndex].title);
        for (let itemIndex = 0; itemIndex < Object.keys(checklistData[checklistIndex].content).length; itemIndex++) {
            editedChecklistData[checklistIndex].content[itemIndex].content = btoa(editedChecklistData[checklistIndex].content[itemIndex].content);
        }
    }

    return editedChecklistData;
}

main();