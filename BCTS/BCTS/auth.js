/* BCTS authentication: talks to server.js, which saves accounts in data.json.
   Open the site through http://localhost:3000 (not by double-clicking the HTML). */
const Auth = {
  TOKEN: "ctmsToken",
  USER: "ctmsUser",
  DOMAINS: ["gmail.com","googlemail.com","yahoo.com","yahoo.com.ph","ymail.com","outlook.com","outlook.ph","hotmail.com","live.com","msn.com","icloud.com","me.com","aol.com","proton.me","protonmail.com"],

  validEmail(e) {
    e = e.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e)) return false;
    const d = e.split("@")[1];
    return this.DOMAINS.includes(d) || /\.edu(\.[a-z]{2})?$/.test(d);
  },

  async api(url, method = "GET", body) {
    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.getItem(this.TOKEN) || "") },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401 && localStorage.getItem(this.TOKEN)) { this.logout(); location.replace("login.html"); }
      return { ...data, ok: r.ok };
    } catch {
      return { ok: false, error: "Cannot reach the server. Run 'node server.js' and open http://localhost:3000." };
    }
  },

  current() {
    if (!localStorage.getItem(this.TOKEN)) return null;
    try { return JSON.parse(localStorage.getItem(this.USER)); } catch { return null; }
  },

  start(d) {
    if (d.ok) { localStorage.setItem(this.TOKEN, d.token); localStorage.setItem(this.USER, JSON.stringify(d.user)); }
    return d;
  },

  async register(name, email, password) { return this.start(await this.api("/api/register", "POST", { name, email, password })); },
  async login(email, password) { return this.start(await this.api("/api/login", "POST", { email, password })); },
  async social(provider, email, password) { return this.start(await this.api("/api/social", "POST", { provider, email, password })); },

  // UPDATE profile name
  async updateProfile(name) {
    const d = await this.api("/api/profile", "PUT", { name });
    if (d.ok) localStorage.setItem(this.USER, JSON.stringify(d.user));
    return d;
  },
  // UPDATE password
  changePassword(currentPassword, newPassword) { return this.api("/api/password", "PUT", { currentPassword, newPassword }); },
  // DELETE account
  async deleteAccount(password) {
    const d = await this.api("/api/account", "DELETE", { password });
    if (d.ok) { localStorage.removeItem(this.TOKEN); localStorage.removeItem(this.USER); }
    return d;
  },

  logout() {
    const t = localStorage.getItem(this.TOKEN);
    localStorage.removeItem(this.TOKEN); localStorage.removeItem(this.USER);
    if (t) fetch("/api/logout", { method: "POST", headers: { Authorization: "Bearer " + t } });
  },

  initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
};
