// Require a logged-in user (see auth.js)
let user = Auth.current();
if (!user) { location.replace("login.html"); throw new Error("Not logged in"); }

const guides = [
 {id:1,title:"Computer Won't Turn On",category:"Hardware",description:"Your computer does not respond when you press the power button.",steps:["Check that the power cable is firmly connected to the computer and wall outlet.","If using a power strip, make sure its switch is on.","For a laptop, connect the correct charger and look for a charging light.","Try another known-working outlet if safe to do so.","If there is still no power, ask a qualified technician for help."]},
 {id:2,title:"Computer Running Slowly",category:"Software",description:"Your computer takes a long time to start or open applications.",steps:["Save your work and restart the computer.","Close applications and browser tabs you are not using.","Check available storage space in your system settings.","Install operating-system updates from the official settings app.","If the issue continues, ask a technician to check the device."]},
 {id:3,title:"No Internet Connection",category:"Network",description:"Your computer cannot connect to the internet.",steps:["Check whether Wi-Fi is enabled or the network cable is connected.","Check whether other devices can access the same network.","Turn Wi-Fi off and on, then reconnect to your network.","Restart your router only if allowed and safe.","If several devices remain offline, contact your network administrator or internet provider."]},
 {id:4,title:"Application Won't Open",category:"Software",description:"A program fails to launch or closes unexpectedly.",steps:["Restart the application and check for an error message.","Restart your computer and try again.","Install updates from the application's official source.","Use the operating system's repair option if available.","Avoid unknown repair tools; ask support if it still fails."]},
 {id:5,title:"Computer Overheating",category:"Hardware",description:"Your computer feels unusually hot or its fan is loud.",steps:["Save your work and shut down if the device is extremely hot.","Place the computer on a hard, flat surface with ventilation.","Keep air vents clear and do not block fan openings.","Do not open powered equipment or touch internal components.","If overheating continues, stop using it and contact a technician."]},
 {id:6,title:"Blue Screen or Frequent Crashes",category:"Software",description:"Your computer unexpectedly restarts or displays a system error.",steps:["Write down the error message if one appears.","Disconnect recently added accessories if safe to do so.","Restart and install official operating-system updates if the computer is stable.","Back up important files if you can do so safely.","Contact a technician if crashes repeat or files may be at risk."]},
 {id:7,title:"Monitor Has No Display",category:"Hardware",description:"The computer seems to be on, but the monitor shows a blank screen or no signal.",steps:["Make sure the monitor is powered on and its power light is lit.","Check that the video cable is firmly connected at both ends.","Use the monitor's input/source button to select the correct HDMI, DisplayPort, or other input.","If possible, test with another compatible cable or monitor.","If the screen remains blank, turn the computer off and contact a technician."]},
 {id:8,title:"Keyboard or Mouse Not Working",category:"Hardware",description:"The keyboard or mouse does not respond when you use it.",steps:["Check the USB connection or replace the wireless device's batteries if applicable.","Try a different USB port and reconnect the device.","For wireless devices, check that they are switched on and properly paired with their receiver or Bluetooth.","Restart the computer if you can do so safely.","Test with another keyboard or mouse; seek support if the problem continues."]},
 {id:9,title:"Application Not Responding",category:"Software",description:"An open program freezes and stops responding to clicks or typing.",steps:["Wait briefly to see whether the application recovers.","Save your work if the program becomes responsive again.","Close other demanding applications to free system resources.","If it remains frozen, close it using the operating system's normal task manager and reopen it.","Install official app updates and contact support if the issue keeps happening."]},
 {id:10,title:"Software Installation Error",category:"Software",description:"A program fails to install or displays an installation error.",steps:["Check that your device meets the application's system requirements.","Make sure you have enough free storage space.","Download the installer only from the official developer or trusted app store.","Restart the computer and try again using an account permitted to install software.","Record the error message and ask support for help if installation still fails."]},
 {id:11,title:"Operating System Freezing",category:"Software",description:"Windows or another operating system repeatedly freezes or stops responding.",steps:["Give the computer a short time to recover and avoid repeatedly clicking.","Disconnect recently connected accessories if it is safe to do so.","Restart using the normal system menu when possible.","After restarting, save important files and install official system updates if stable.","If freezing repeats, stop troubleshooting and ask a technician to check the device."]},
 {id:12,title:"Wi-Fi Not Connecting",category:"Network",description:"Your computer cannot join a wireless network even when Wi-Fi is available.",steps:["Make sure Wi-Fi is turned on and airplane mode is off.","Check that you selected the correct network and entered its password correctly.","Move closer to the router and try reconnecting.","Forget the network and reconnect only if you know the correct password.","If other devices also cannot connect, contact the network administrator or internet provider."]},
 {id:13,title:"Slow Internet Connection",category:"Network",description:"Websites, downloads, or online applications load much more slowly than usual.",steps:["Check whether the slowdown affects one app or all devices on the same network.","Pause large downloads or streaming that may be using bandwidth.","Move closer to the Wi-Fi router or use a network cable if available.","Restart the router only if you are allowed to and know it is safe to do so.","If speeds remain slow across devices, contact your internet provider."]},
 {id:14,title:"Network Adapter Not Detected",category:"Network",description:"The computer does not show a Wi-Fi or Ethernet adapter.",steps:["Restart the computer and check the network settings again.","If using a USB network adapter, reconnect it to another port.","Check Device Manager or system settings for a disabled adapter or warning symbol.","Install drivers only from Windows Update or the computer/network adapter manufacturer's official site.","If the adapter is still missing, ask a technician to check for a hardware or driver issue."]}
];
// Each user gets their own history, stored in this browser
let history = []; // loaded from the server below
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function safe(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function save(){}
function renderActivity(){$("#recentActivity").innerHTML=history.slice(0,3).map(h=>`<div class="activity"><div class="activity-icon ${h.result==="Resolved"?"":"failed"}">${h.result==="Resolved"?"✓":"!"}</div><div class="activity-text"><strong>${safe(h.title)}</strong><small>${safe(h.date)}</small></div><span class="result-pill ${h.result==="Resolved"?"":"failed"}">${safe(h.result)}</span></div>`).join("")||"<p>No activity recorded yet.</p>";}
function renderHistory(){
  $("#historyTable").innerHTML=history.map(h=>{
    const ok=h.result==="Resolved";
    const actions=h.id?`<button class="mini-btn" data-edit="${h.id}">${ok?"Mark Not Resolved":"Mark Resolved"}</button> <button class="mini-btn danger" data-del="${h.id}">Delete</button>`:"";
    return `<tr><td>${safe(h.title)}</td><td>${safe(h.category)}</td><td><span class="result-pill ${ok?"":"failed"}">${safe(h.result)}</span></td><td>${safe(h.date)}</td><td class="row-actions">${actions}</td></tr>`;
  }).join("")||'<tr><td colspan="5">No history yet.</td></tr>';
  $("#resolvedCount").textContent=history.filter(h=>h.result==="Resolved").length;$("#attemptCount").textContent=history.length;
}
function renderGuides(){const q=$("#guideSearch").value.trim().toLowerCase(),cat=$("#categoryFilter").value;const list=guides.filter(g=>(cat==="All"||g.category===cat)&&(`${g.title} ${g.description} ${g.category}`).toLowerCase().includes(q));$("#guideGrid").innerHTML=list.map(g=>`<article class="guide-card"><p class="guide-category">${safe(g.category.toUpperCase())}</p><h3>${safe(g.title)}</h3><p>${safe(g.description)}</p><button data-guide="${g.id}">View troubleshooting steps →</button></article>`).join("")||"<p>No guides match your search.</p>";}
function showPage(page){$$(".page").forEach(p=>p.classList.toggle("active-page",p.id===page));$$(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===page));$("#pageTitle").textContent=({dashboard:"Dashboard",guides:"Troubleshooting Guides",history:"My History",profile:"My Profile"})[page]||"Dashboard";$("#sidebar").classList.remove("open");if(page==="history")renderHistory();if(page==="guides")renderGuides();window.scrollTo({top:0,behavior:"smooth"});}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500);}
function openGuide(id){const g=guides.find(x=>x.id===Number(id));if(!g)return;$("#dialogContent").innerHTML=`<p class="dialog-category">${safe(g.category.toUpperCase())}</p><h2>${safe(g.title)}</h2><p>${safe(g.description)}</p><ol>${g.steps.map(s=>`<li>${safe(s)}</li>`).join("")}</ol><p class="muted">If the problem persists, stop and contact a qualified technician.</p><button class="button button-primary" id="resolvedBtn">Mark as Resolved</button> <button class="button" id="notResolvedBtn">Not Resolved</button>`;$("#guideDialog").showModal();$("#resolvedBtn").onclick=()=>record(g,"Resolved");$("#notResolvedBtn").onclick=()=>record(g,"Not Resolved");}
function record(g,result){const date=new Date().toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"});const entry={title:g.title,category:g.category,result,date};history.unshift(entry);Auth.api("/api/history","POST",entry).then(r=>{if(r.ok){entry.id=r.id;renderHistory();}});renderActivity();renderHistory();$("#guideDialog").close();toast("Result saved to your history.");}
$$(".nav-link").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showPage(a.dataset.page)}));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$$(".category-card").forEach(b=>b.addEventListener("click",()=>{showPage("guides");$("#categoryFilter").value=b.dataset.category;renderGuides()}));
$("#guideSearch").addEventListener("input",renderGuides);$("#categoryFilter").addEventListener("change",renderGuides);
$("#guideGrid").addEventListener("click",e=>{const b=e.target.closest("[data-guide]");if(b)openGuide(b.dataset.guide);});
$("#closeDialog").addEventListener("click",()=>$("#guideDialog").close());$("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#helpBtn").addEventListener("click",()=>toast("Choose a category, open a guide, and follow the steps in order."));
$("#logoutBtn").addEventListener("click",()=>{Auth.logout();location.replace("login.html");});
$("#clearHistory").addEventListener("click",()=>{if(!history.length||!confirm("Delete all of your history? This cannot be undone."))return;history=[];Auth.api("/api/history","DELETE");renderHistory();renderActivity();toast("History cleared.");});
// Show the logged-in user's info
function showUser(){
  $("#sidebarName").textContent = user.name;
  $("#sidebarAvatar").textContent = Auth.initials(user.name);
  $("#welcomeName").textContent = user.name.split(" ")[0];
  $("#profileName").textContent = user.name;
  $("#profileAvatar").textContent = Auth.initials(user.name);
  $("#profileEmail").textContent = user.email;
  $("#memberSince").textContent = user.joined;
}
showUser();

// ---- UPDATE / DELETE history entries (buttons in the history table) ----
$("#historyTable").addEventListener("click",async e=>{
  const ed=e.target.closest("[data-edit]"), del=e.target.closest("[data-del]");
  if(ed){
    const h=history.find(x=>x.id===Number(ed.dataset.edit)); if(!h)return;
    const result=h.result==="Resolved"?"Not Resolved":"Resolved";
    const r=await Auth.api("/api/history/"+h.id,"PUT",{result});
    if(r.ok){h.result=result;renderHistory();renderActivity();toast("Result updated.");}else toast(r.error||"Could not update the entry.");
  }
  if(del){
    const h=history.find(x=>x.id===Number(del.dataset.del)); if(!h)return;
    if(!confirm('Delete "'+h.title+'" from your history?'))return;
    const r=await Auth.api("/api/history/"+h.id,"DELETE");
    if(r.ok){history=history.filter(x=>x!==h);renderHistory();renderActivity();toast("Entry deleted.");}else toast(r.error||"Could not delete the entry.");
  }
});

// ---- Profile: UPDATE name, UPDATE password, DELETE account ----
function openForm(title,intro,fields,submitLabel,onSubmit,danger){
  $("#dialogContent").innerHTML=`<h2>${safe(title)}</h2><p class="muted">${safe(intro)}</p><div class="form-error" id="formError" role="alert"></div><form id="dlgForm" novalidate>${fields}<button class="button ${danger?"button-danger":"button-primary"}" type="submit">${safe(submitLabel)}</button> <button class="button" type="button" id="dlgCancel">Cancel</button></form>`;
  $("#guideDialog").showModal();
  $("#dlgCancel").onclick=()=>$("#guideDialog").close();
  $("#dlgForm").onsubmit=async e=>{
    e.preventDefault();
    const err=await onSubmit(new FormData(e.target));
    if(err){$("#formError").textContent=err;$("#formError").classList.add("show");}else $("#guideDialog").close();
  };
  const first=$("#dlgForm input"); if(first)first.focus();
}
const field=(label,name,type,value)=>`<label class="form-label" for="f_${name}">${label}</label><input class="form-input" id="f_${name}" name="${name}" type="${type}" value="${safe(value||"")}" autocomplete="off">`;

$("#editProfileBtn").addEventListener("click",()=>openForm("Edit profile","Change the name shown on your dashboard.",field("Full name","name","text",user.name),"Save changes",async f=>{
  const name=f.get("name").trim();
  if(!name)return "Enter your full name.";
  const r=await Auth.updateProfile(name);
  if(!r.ok)return r.error||"Could not save your profile.";
  user=Auth.current();showUser();toast("Profile updated.");
}));

$("#changePwBtn").addEventListener("click",()=>openForm("Change password","Your other logged-in devices will be signed out.",
  field("Current password","current","password")+field("New password","next","password")+field("Confirm new password","confirm","password"),"Change password",async f=>{
  if(!f.get("current"))return "Enter your current password.";
  if(f.get("next").length<6)return "Use at least 6 characters for the new password.";
  if(f.get("next")!==f.get("confirm"))return "The new passwords do not match.";
  const r=await Auth.changePassword(f.get("current"),f.get("next"));
  if(!r.ok)return r.error||"Could not change the password.";
  toast("Password changed.");
}));

$("#deleteAccountBtn").addEventListener("click",()=>openForm("Delete account","This permanently deletes your account and all of your history. This cannot be undone.",
  field("Enter your password to confirm","password","password"),"Delete my account",async f=>{
  if(!f.get("password"))return "Enter your password to confirm.";
  const r=await Auth.deleteAccount(f.get("password"));
  if(!r.ok)return r.error||"Could not delete the account.";
  location.replace("login.html");
},true));

renderGuides();
Auth.api("/api/history").then(d=>{history=d.history||[];renderActivity();renderHistory();});
