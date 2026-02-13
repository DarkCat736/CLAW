# CLAW - <i>v0.2.1 (BETA VERSION)</i>
A platform for students to stay organized and work together! Currently CLAW has a fully functional checklist, an assignment tracker in development, and many more features including Team Projects on the way in the future!

<b><i>UPDATE NOTICE!!!</i></b> The MYSQL_DB_HOST and MYSQL_DB_NAME fields are now required in the .env file for the BETA version of CLAW. Check the BETA setup instructions for more details.

<b><i>UPDATE NOTICE!!!</i></b> The `info` column on the `accounts` table has been changed to be a `JSON` column. This needs to be updated for data to be properly exchanged.  Check the BETA setup instructions for more details. In addition to this, all data stored for the checklist service is now unreadable by the program. All user inputted data needs to be formatted in Base64. You can either restart checklists and enter data again or manually go through and translate the user inputted fields in the JSON to Base64.

<i>Official BETA host: [YOUR DATA IS NOT GUANTEED AT THIS SITE! Use at your own risk.](https://beta.claw.kittentech.org)</i>

<i>If the official host is inaccessible please wait at least 20 minutes before making a bug report. The server automatically restarts after 15 minutes of network failures which generally fixes most connection issues.</i>

<i>Known issues: [read here](https://github.com/DarkCat736/CLAW/issues/1)</i>

<b>Setup:</b>

[This guide](https://github.com/DarkCat736/CLAW/wiki/CLAW-BETA-Setup) has setup instructions.

<hr>
<i>WARNING: If you host CLAW using a program such as apache, you may have to add to your VirtualHost configuration to allow encoded slashes in URLs (Example fix: `AllowEncodedSlashes NoDecode`). CLAW's authorization API <b>WILL NOT WORK</b> and will return 404 errors without these changes.</i>
