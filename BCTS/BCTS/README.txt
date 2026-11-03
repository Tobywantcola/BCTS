BCTS - Basic Computer Troubleshooting System

1. Install Node.js (version 22.5 or newer) from https://nodejs.org (one time only).
2. Extract this zip, then double-click start.bat (Windows) or start.command (Mac).
   Or run:  node server.js   and open http://localhost:3000
3. Accounts and history are saved in the SQLite database file bcts.db
   (created automatically). Keep the whole folder together and back up bcts.db.
   If you have an old data.json from an earlier version, put it in this folder:
   it is imported into the database the first time the server starts.

CRUD features
  Create  - register an account; record a troubleshooting result
  Read    - view guides, your history, your profile
  Update  - edit your name, change your password, change a history result
  Delete  - delete one history entry, clear all history, delete your account
