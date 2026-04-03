const API_KEY = "noa123";
let recognition;
let callMode = false;

// 🎤 PEDIR PERMISO AL MICROFONO (Crucial para APK)
async function requestMicPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Cerramos el stream tras obtener permiso
        console.log("Micrófono detectado y listo.");
        return true;
    } catch (err) {
        console.error("Error al acceder al micrófono:", err);
        alert("Permiso de micrófono denegado. Actívalo en los ajustes de la App.");
        return false;
    }
}

// ✍️ ENVIAR MENSAJE
async function sendText() {
    const input = document.getElementById("textInput");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    input.style.height = "auto";
    
    await processAI(text);
}

function addMessage(text, sender) {
    const chat = document.getElementById("chatArea");
    const welcome = document.getElementById("welcomeScreen");
    if (welcome) welcome.style.display = "none";

    const div = document.createElement("div");
    div.classList.add("msg", sender === "user" ? "user-msg" : "ai-msg");
    div.innerText = text;
    chat.insertBefore(div, document.getElementById("typingIndicator"));
    chat.scrollTop = chat.scrollHeight;
}

// 🎧 LÓGICA DE ESCUCHA
async function audioMode() {
    const hasPermission = await requestMicPermission();
    if (hasPermission) listen();
}

function listen() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return alert("Tu dispositivo no soporta reconocimiento de voz.");

    recognition = new Speech();
    recognition.lang = "es-ES";
    recognition.continuous = false;

    recognition.onstart = () => {
        document.getElementById("micBtn").style.color = "#FF453A";
        document.getElementById("typingIndicator").classList.add("active");
    };

    recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        addMessage(text, "user");
        await processAI(text);
    };

    recognition.onend = () => {
        document.getElementById("micBtn").style.color = "white";
        document.getElementById("typingIndicator").classList.remove("active");
        if (callMode) listen(); // Si es llamada, vuelve a escuchar automáticamente
    };

    recognition.start();
}

async function processAI(text) {
    const server = document.getElementById("serverInput").value.trim();
    if (!server) return alert("Configura la URL en el engranaje ⚙️");
    
    document.getElementById("typingIndicator").classList.add("active");

    try {
        const res = await fetch(`${server}/api`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
            body: JSON.stringify({ prompt: text, mode: callMode ? "call" : "text" })
        });

        if (callMode) {
            const blob = await res.blob();
            const audio = new Audio(URL.createObjectURL(blob));
            document.getElementById("typingIndicator").classList.remove("active");
            audio.play();
            audio.onended = () => { if (callMode) listen(); };
        } else {
            const data = await res.json();
            document.getElementById("typingIndicator").classList.remove("active");
            addMessage(data.reply, "ai");
        }
    } catch (e) {
        document.getElementById("typingIndicator").classList.remove("active");
        addMessage("Error de conexión.", "ai");
    }
}

// 📞 LLAMADA
function startCall() {
    callMode = true;
    document.getElementById("callBtn").style.display = "none";
    document.getElementById("stopBtn").style.display = "block";
    audioMode();
}

function stopCall() {
    callMode = false;
    if (recognition) recognition.stop();
    document.getElementById("callBtn").style.display = "block";
    document.getElementById("stopBtn").style.display = "none";
}

function toggleConfig() {
    document.getElementById("configModal").classList.toggle("active");
}

function clearChat() {
    if(confirm("¿Borrar chat?")) {
        location.reload();
    }
}

// Auto-expandir textarea
document.getElementById("textInput").addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight) + "px";
});