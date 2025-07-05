# CLAW
A platform for students to stay organized and work together

<i>Demo of an old commit: https://claw.kittentech.org</i>

<b>Setup:</b>

1. Install MySQL server and run `CREATE DATABASE claw;` in the MySQL console
2. Run `CREATE TABLE accounts (email text, password text, name text, info text);SET GLOBAL wait_timeout = 10;` in the MySQL console
3. Create the "claw_user" account using `CREATE USER 'claw_user'@'localhost' IDENTIFIED BY 'claw_password';GRANT ALL PRIVILEGES ON claw.* TO 'claw_user'@'localhost';FLUSH PRIVILEGES;` <i>NOTE: You should change 'claw_password' to a more secure password. This is just an example.</i>
4. Download the repository and run `npm install`
5. Update line eight and nine of `index.js` to match your MySQL account username and password  
6. Start server with `node index.js`
7. Go to `localhost:9876` and you're all set!

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

<i>Checklist Service JSON Data Format</i>

```json5
{
  "0": { //represents an entire checklist
    "title": "Untitled checklist", //checklist title
    "content": { //checklist items
      "0": { //represents one checklist item
        "content": "Add items now!", //item content
        "completed": "false" //item completion status
      }
    }
  }
}
```
