// BCTS server: serves the website files in this folder and stores everything in a SQLite database (bcts.db).
// Run: node server.js   then open http://localhost:3000   (no npm install needed; needs Node.js 22.5 or newer)
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const PORT = process.env.PORT || 3000;

// ---------- Database ----------
const sql = new DatabaseSync(path.join(__dirname, process.env.DB_FILE || "bcts.db"));
sql.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY, name TEXT NOT NULL, salt TEXT,
    password_hash TEXT NOT NULL DEFAULT '', provider TEXT, joined TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    title TEXT, category TEXT, result TEXT, date TEXT);
`);
const q = {
  userByEmail: sql.prepare("SELECT * FROM users WHERE email = ?"),
  addUser: sql.prepare("INSERT INTO users (email, name, salt, password_hash, provider, joined) VALUES (?, ?, ?, ?, ?, ?)"),
  addSession: sql.prepare("INSERT INTO sessions (token, email) VALUES (?, ?)"),
  userByToken: sql.prepare("SELECT u.* FROM users u JOIN sessions s ON s.email = u.email WHERE s.token = ?"),
  delSession: sql.prepare("DELETE FROM sessions WHERE token = ?"),
  history: sql.prepare("SELECT id, title, category, result, date FROM history WHERE email = ? ORDER BY id DESC"),
  addHistory: sql.prepare("INSERT INTO history (email, title, category, result, date) VALUES (?, ?, ?, ?, ?)"),
  clearHistory: sql.prepare("DELETE FROM history WHERE email = ?"),
  updateName: sql.prepare("UPDATE users SET name = ? WHERE email = ?"),
  updatePassword: sql.prepare("UPDATE users SET salt = ?, password_hash = ? WHERE email = ?"),
  delOtherSessions: sql.prepare("DELETE FROM sessions WHERE email = ? AND token <> ?"),
  updateHistory: sql.prepare("UPDATE history SET result = ? WHERE id = ? AND email = ?"),
  delHistoryOne: sql.prepare("DELETE FROM history WHERE id = ? AND email = ?"),
  delUser: sql.prepare("DELETE FROM users WHERE email = ?"),
  anyUser: sql.prepare("SELECT 1 FROM users LIMIT 1"),
};

// One-time import of the old data.json (accounts + history), if it exists
const oldFile = path.join(__dirname, "data.json");
if (fs.existsSync(oldFile) && !q.anyUser.get()) {
  try {
    const d = JSON.parse(fs.readFileSync(oldFile, "utf8"));
    for (const u of d.users || []) {
      q.addUser.run(u.email, u.name, u.salt || null, u.passwordHash || "", u.provider || null, u.joined || "");
      for (const h of [...(u.history || [])].reverse()) q.addHistory.run(u.email, h.title, h.category, h.result, h.date);
    }
    for (const [t, e] of Object.entries(d.sessions || {})) if (q.userByEmail.get(e)) q.addSession.run(t, e);
    fs.renameSync(oldFile, oldFile + ".migrated");
    console.log("Imported your old accounts from data.json into the database.");
  } catch (e) { console.log("Could not import data.json:", e.message); }
}

// ---------- Helpers ----------
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString("hex");
// Accepted email providers (add more here). School emails (.edu / .edu.ph) are also accepted.
const DOMAINS = ["gmail.com","googlemail.com","yahoo.com","yahoo.com.ph","ymail.com","outlook.com","outlook.ph","hotmail.com","live.com","msn.com","icloud.com","me.com","aol.com","proton.me","protonmail.com"];
const validEmail = e => {
  if (!/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e)) return false;
  const d = e.split("@")[1];
  return DOMAINS.includes(d) || /\.edu(\.[a-z]{2})?$/.test(d);
};
const joined = () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
const startSession = u => {
  const token = crypto.randomBytes(24).toString("hex");
  q.addSession.run(token, u.email);
  return { token, user: { name: u.name, email: u.email, joined: u.joined } };
};
const newUser = (email, name, pw, provider) => {
  const salt = crypto.randomBytes(16).toString("hex"), u = { email, name, joined: joined() };
  q.addUser.run(email, name, salt, hash(pw, salt), provider, u.joined);
  return u;
};
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png" };

// ---------- Server ----------
http.createServer((req, res) => {
  const out = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

  if (!req.url.startsWith("/api/")) {               // serve the website files from this folder
    const name = path.basename(decodeURIComponent(req.url.split("?")[0])) || "login.html";
    const ext = path.extname(name), p = path.join(__dirname, name);
    if (!TYPES[ext] || name === "server.js" || !fs.existsSync(p)) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[ext] });
    return fs.createReadStream(p).pipe(res);
  }

  let raw = ""; req.on("data", c => raw += c);
  req.on("end", () => {
    try {
      let b = {}; try { b = JSON.parse(raw || "{}"); } catch {}
      const tok = (req.headers.authorization || "").replace("Bearer ", "");
      const me = q.userByToken.get(tok);
      const key = req.method + " " + req.url, email = String(b.email || "").trim().toLowerCase();

      if (key === "POST /api/register") {
        const name = String(b.name || "").trim(), pw = String(b.password || "");
        if (!name) return out(400, { error: "Enter your full name." });
        if (!validEmail(email)) return out(400, { error: "Use a valid email from a real provider, e.g. name@gmail.com." });
        if (pw.length < 6) return out(400, { error: "Use at least 6 characters for your password." });
        if (q.userByEmail.get(email)) return out(409, { error: "An account with this email already exists. Try logging in." });
        return out(200, startSession(newUser(email, name, pw, null)));
      }
      if (key === "POST /api/login") {
        const u = q.userByEmail.get(email);
        if (!u || !u.password_hash || hash(String(b.password || ""), u.salt) !== u.password_hash) return out(400, { error: "Email or password is incorrect." });
        return out(200, startSession(u));
      }
      if (key === "POST /api/social") {                // DEMO: not real Google/Facebook; the account has its own password
        const pw = String(b.password || "");
        if (!["google", "facebook"].includes(b.provider) || !validEmail(email)) return out(400, { error: "Enter a valid email address." });
        const u = q.userByEmail.get(email);
        if (!u) {
          if (pw.length < 6) return out(400, { error: "Use at least 6 characters for the password." });
          return out(200, startSession(newUser(email, email.split("@")[0], pw, b.provider)));
        }
        if (!u.password_hash) return out(400, { error: "This account was made without a password. Use another email." });
        if (hash(pw, u.salt) !== u.password_hash) return out(400, { error: "Email or password is incorrect." });
        return out(200, startSession(u));
      }
      if (key === "POST /api/logout") { q.delSession.run(tok); return out(200, {}); }

      if (!me) return out(401, { error: "Not logged in." });
      if (key === "GET /api/history") return out(200, { history: q.history.all(me.email) });
      if (key === "POST /api/history") {                // CREATE a history entry
        const info = q.addHistory.run(me.email, String(b.title), String(b.category), String(b.result), String(b.date));
        return out(200, { id: Number(info.lastInsertRowid) });
      }
      if (key === "DELETE /api/history") { q.clearHistory.run(me.email); return out(200, {}); }
      if (key === "PUT /api/profile") {                // UPDATE the user's name
        const name = String(b.name || "").trim();
        if (!name || name.length > 60) return out(400, { error: "Enter your full name (up to 60 characters)." });
        q.updateName.run(name, me.email);
        return out(200, { user: { name, email: me.email, joined: me.joined } });
      }
      if (key === "PUT /api/password") {               // UPDATE the password
        const cur = String(b.currentPassword || ""), next = String(b.newPassword || "");
        if (!me.password_hash || hash(cur, me.salt) !== me.password_hash) return out(400, { error: "Your current password is incorrect." });
        if (next.length < 6) return out(400, { error: "Use at least 6 characters for the new password." });
        const salt = crypto.randomBytes(16).toString("hex");
        q.updatePassword.run(salt, hash(next, salt), me.email);
        q.delOtherSessions.run(me.email, tok);         // log out the user's other devices
        return out(200, {});
      }
      if (key === "DELETE /api/account") {             // DELETE the account (sessions and history go with it: ON DELETE CASCADE)
        if (!me.password_hash || hash(String(b.password || ""), me.salt) !== me.password_hash) return out(400, { error: "Your password is incorrect." });
        q.delUser.run(me.email);
        return out(200, {});
      }
      const m = req.url.match(/^\/api\/history\/(\d+)$/);
      if (m && req.method === "PUT") {                 // UPDATE one history entry's result
        const result = String(b.result || "");
        if (!["Resolved", "Not Resolved"].includes(result)) return out(400, { error: "Result must be Resolved or Not Resolved." });
        return q.updateHistory.run(result, Number(m[1]), me.email).changes ? out(200, {}) : out(404, { error: "Entry not found." });
      }
      if (m && req.method === "DELETE") {              // DELETE one history entry
        return q.delHistoryOne.run(Number(m[1]), me.email).changes ? out(200, {}) : out(404, { error: "Entry not found." });
      }
      out(404, { error: "Not found" });
    } catch (e) { console.error(e); out(500, { error: "Server error." }); }
  });
}).listen(PORT, () => console.log("BCTS running at http://localhost:" + PORT + "  (database: bcts.db)"));
