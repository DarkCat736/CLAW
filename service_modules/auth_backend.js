let authAPI = {
    signInForService: async function (email, passwordHash, dbPool) {
        try {
            let [rows, fields] = await dbPool.query(`SELECT * FROM accounts WHERE email = '${email}';`);

            return (passwordHash === rows[0].password);
        } catch (e) {
            //console.log(e);
            return false;
        }
    }
}

module.exports = {
    authAPI
}