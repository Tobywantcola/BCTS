// Login page logic. Needs js/auth.js to be loaded first.
if (Auth.current()) location.replace("index.html");

const $ = s => document.querySelector(s);
let signup = false;

const showError = m => {
  $("#error").textContent = m;
  $("#error").classList.add("show");
};

function setMode(isSignup) {
  signup = isSignup;
  $("#error").classList.remove("show");
  $("#tabLogin").classList.toggle("active", !signup);
  $("#tabSignup").classList.toggle("active", signup);
  $("#nameField").classList.toggle("hidden", !signup);
  $("#forgotWrap").classList.toggle("hidden", signup);
  $("#submit").textContent = signup ? "Create account" : "Submit";
  $("#password").autocomplete = signup ? "new-password" : "current-password";
  $("#switchText").textContent = signup ? "Already have an account?" : "Don't have an account?";
  $("#switchBtn").textContent = signup ? "Log in" : "Create an account";
}

$("#tabLogin").addEventListener("click", () => setMode(false));
$("#tabSignup").addEventListener("click", () => setMode(true));
$("#switchBtn").addEventListener("click", () => setMode(!signup));

$("#forgot").addEventListener("click", () =>
  showError("Password reset needs a server. In this demo, create a new account instead.")
);

// Demo social login (see Auth.social in auth.js)
let provider = null;
const dlg = $("#socialDialog"), sErr = $("#socialError");
document.querySelectorAll("[data-provider]").forEach(btn =>
  btn.addEventListener("click", () => {
    provider = btn.dataset.provider;
    $("#socialTitle").textContent = "Continue with " + (provider === "google" ? "Google" : "Facebook");
    $("#socialEmail").value = ""; $("#socialPassword").value = ""; sErr.classList.remove("show");
    dlg.showModal(); $("#socialEmail").focus();
  })
);
$("#socialCancel").addEventListener("click", () => dlg.close());
$("#socialForm").addEventListener("submit", async e => {
  e.preventDefault();
  const em = $("#socialEmail").value;
  const show = m => { sErr.textContent = m; sErr.classList.add("show"); };
  if (!Auth.validEmail(em)) return show("Enter a valid email, e.g. name@gmail.com.");
  if (!$("#socialPassword").value) return show("Enter your password.");
  const r = await Auth.social(provider, em, $("#socialPassword").value);
  r.ok ? location.replace("index.html") : show(r.error);
});

$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  $("#error").classList.remove("show");

  const name = $("#name").value;
  const email = $("#email").value;
  const pw = $("#password").value;

  if (signup && !name.trim()) return showError("Enter your full name.");
  if (!Auth.validEmail(email)) return showError("Use a valid email from a real provider, e.g. name@gmail.com or name@yahoo.com.");
  if (!pw) return showError("Enter your password.");
  if (signup && pw.length < 6) return showError("Use at least 6 characters for your password.");

  const result = signup ? await Auth.register(name, email, pw) : await Auth.login(email, pw);
  result.ok ? location.replace("index.html") : showError(result.error);
});
