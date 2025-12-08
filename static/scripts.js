let ws = null;

const chatBox = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const messageInput = document.getElementById("message");
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text) {
    const p = document.createElement("p");
    p.textContent = text;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

connectBtn.onclick = () => {
    if (ws) return; // already connected

    const username = usernameInput.value.trim() || "guest";

    ws = new WebSocket("ws://127.0.0.1:8000/ws/chat");

    ws.onopen = () => {
        addMessage("[system] Connected as " + username);
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "system") {
            addMessage("[system] " + msg.text);
        } else if (msg.type === "message") {
            addMessage(msg.user + ": " + msg.text);
        }
    };

    ws.onclose = () => {
        addMessage("[system] Disconnected");
        ws = null;
    };

    sendBtn.onclick = () => {
        if (!ws) return;

        const text = messageInput.value.trim();
        if (!text) return;

        const username = usernameInput.value.trim() || "guest";
        ws.send(JSON.stringify({
            type: "message",
            user: username,
            text: text
        }));

        messageInput.value = "";
    };
};