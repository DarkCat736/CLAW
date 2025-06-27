# CLAW
A platform for students to stay organized and work together

<b>Setup:</b>

1. Install MySQL server and run `CREATE DATABASE claw;` in the MySQL console
2. run `CREATE TABLE accounts (email text, password text, name text, info text);` in the MySQL console
3. Download the repository and run `npm install`
4. Update line six of `index.js` to match your MySQL root account password 
5. Start server with `node index.js`
6. Go to `localhost:9876` and you're all set!

<b>INNER WORKINGS </b>(if I don't write this stuff down I'm guaranteed to forget it lol):

<i>MySQL DB</i>

```
claw (db)
|_ accounts (table)
   |_ email (TEXT)
   |_ password (TEXT)
   |_ name (TEXT)
   |_ info (TEXT)
```

<i>Client Side API Map</i>

```
CLAW_ClientAPI (root object)
|_ init (function)
|_ checkServiceAvailability (function)
|_ service
   |_ account
      |_ init (function)
      |_ tabController
         |_ selectedTab (var)
         |_ selectTab (function)
|_ auth
   |_ init (function)
   |_ loggedIn (var)
   |_ name (var)
   |_ email (var)
   |_ password (var)
   |_ canvasAPIAvailable (var)
   |_ signUp (function)
```
