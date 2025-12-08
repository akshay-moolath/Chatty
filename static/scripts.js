
/* Auto-connect client script (paste into your existing file) */

let ws = null;
let localName = localStorage.getItem("username") || "guest";
const RECONNECT_DELAY_MS = 2000;

const sendBtn = document.getElementById('sendBtn');
const msgInput = document.getElementById('msg');
const chat = document.getElementById('chat');
// helper UI functions (re-use your own)
function addSystem(text){
  const el = document.createElement('div'); el.className = 'system'; el.textContent = `[system] ${text}`;
  chat.appendChild(el); chat.scrollTop = chat.scrollHeight;
}
function addMessageBubble({user, text, time}, isMe){
  /* ... reuse your existing bubble code ... */
  const row = document.createElement('div');
  row.className = 'msg-row' + (isMe ? ' me' : '');
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (isMe ? 'me' : 'other');
  const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = user + (isMe ? ' (you)' : '');
  const body = document.createElement('div'); body.className = 'text'; body.textContent = text;
  const ts = document.createElement('span'); ts.className = 'ts'; ts.textContent = time ||new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  bubble.appendChild(meta); bubble.appendChild(body); bubble.appendChild(ts); row.appendChild(bubble); chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

// core connect function (sends auth message after open)
function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const token = localStorage.getItem('access_token');
  const uri = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws/chat';

  ws = new WebSocket(uri);

  ws.addEventListener('open', () => {
    // UI state
    
    msgInput.disabled = false;
sendBtn.disabled = false;   
    addSystem('Connected as ' + localName);

    // send an auth handshake instead of putting token in query string
    if (token) {
      ws.send(JSON.stringify({ type: 'auth', token: token }));
    } else {
      // if you don't use auth, you can optionally send username for display
      ws.send(JSON.stringify({ type: 'join', user: localName }));
    }
  });

  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'system') {
        addSystem(msg.text);
      } else if (msg.type === 'message') {
        const isMe = msg.user === localName;
        addMessageBubble({ user: msg.user, text: msg.text, time: msg.time }, isMe);
      } else if (msg.type === 'auth_ok') {
        addSystem('Authentication ok');
      } else if (msg.type === 'auth_failed') {
        addSystem('Auth failed — you will be disconnected');
        ws.close();
      }
    } catch (e) {
      addSystem('Non-json message: ' + ev.data);
    }
  });

  ws.addEventListener('close', () => {
    addSystem('Disconnected from server — attempting reconnect...');
    // disable UI
    nameInput.disabled = false; connectBtn.textContent = 'Connect'; msgInput.disabled = true; sendBtn.disabled = true;
    ws = null;
    // try reconnect automatically only if token exists (i.e. user is "logged in")
    if (localStorage.getItem('access_token')) {
      setTimeout(connectWebSocket, RECONNECT_DELAY_MS);
    }
  });

  ws.addEventListener('error', (ev) => {
    addSystem('Connection error');
  });
}

// auto-connect on page load if logged in
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  const storedName = localStorage.getItem("username") || "guest";
  localName = storedName;

  if (!token) {
    window.location.href = "/";
    return;
  }

  // auto-connect
  setTimeout(connectWebSocket, 100);

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("username");
      window.location.href = "/";
    });
  }

  sendBtn.addEventListener('click', () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const text = msgInput.value.trim(); if (!text) return;
  const payload = { type: 'message', user: localName, text, time:new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 };
  ws.send(JSON.stringify(payload));
  msgInput.value = '';
  // removed local echo — wait for server broadcast to display
});

  msgInput.addEventListener("keydown", e => {
    if (e.key === "Enter") sendBtn.click();
  });
});
