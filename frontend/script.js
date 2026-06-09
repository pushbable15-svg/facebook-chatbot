// WebSocket connection
let ws = null;
let wsConnected = false;
let wsReconnectAttempts = 0;
const wsMaxReconnectAttempts = 5;

// DOM Elements
const statusText = document.getElementById('statusText');
const statusIndicator = document.getElementById('statusIndicator');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const threadIDInput = document.getElementById('threadIDInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChat');
const messageCount = document.getElementById('messageCount');
const uptime = document.getElementById('uptime');
const memory = document.getElementById('memory');
const wsClients = document.getElementById('wsClients');

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
clearChatBtn.addEventListener('click', clearChat);

document.getElementById('enableAutoResponse').addEventListener('click', () => enableAutoResponse());
document.getElementById('disableAutoResponse').addEventListener('click', () => disableAutoResponse());
document.getElementById('setAutoReact').addEventListener('click', () => setAutoReact());
document.getElementById('addAutoResponse').addEventListener('click', () => addAutoResponse());

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    updateStatus();
    setInterval(updateStatus, 5000);
});

// ==================== WebSocket ====================

function getWebSocketUrl() {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//localhost:3001`;
    }
    // For production
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host.split(':')[0]}:3001`;
}

function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return; // Already connecting or connected
    }

    const wsUrl = getWebSocketUrl();
    console.log('Attempting WebSocket connection to:', wsUrl);

    try {
        ws = new WebSocket(wsUrl);

        ws.addEventListener('open', () => {
            wsConnected = true;
            wsReconnectAttempts = 0;
            updateConnectionStatus(true);
            console.log('WebSocket connected');
        });

        ws.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        });

        ws.addEventListener('close', () => {
            wsConnected = false;
            updateConnectionStatus(false);
            console.log('WebSocket disconnected');
            // Attempt reconnection with exponential backoff
            if (wsReconnectAttempts < wsMaxReconnectAttempts) {
                const delay = Math.pow(2, wsReconnectAttempts) * 1000; // Exponential backoff
                wsReconnectAttempts++;
                console.log(`Attempting to reconnect in ${delay}ms (attempt ${wsReconnectAttempts}/${wsMaxReconnectAttempts})`);
                setTimeout(connectWebSocket, delay);
            }
        });

        ws.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        });
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        updateConnectionStatus(false);
    }
}

function handleWebSocketMessage(data) {
    if (data.type === 'message') {
        displayMessage(data.data);
    } else if (data.type === 'connected') {
        console.log('Connected to bot:', data.message);
    }
}

// ==================== UI Functions ====================

function updateConnectionStatus(connected) {
    if (connected) {
        statusText.textContent = 'Connected';
        statusIndicator.querySelector('.status-dot').style.backgroundColor = '#31a24c';
    } else {
        statusText.textContent = 'Disconnected';
        statusIndicator.querySelector('.status-dot').style.backgroundColor = '#f02849';
    }
}

function displayMessage(message) {
    try {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message.text || '';

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = message.timestamp || new Date().toLocaleTimeString();

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);

        // Remove placeholder if exists
        const placeholder = chatMessages.querySelector('.message-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Update message count
        updateStats();
    } catch (error) {
        console.error('Error displaying message:', error);
    }
}

function sendMessage() {
    const message = messageInput.value.trim();
    const threadID = threadIDInput.value.trim() || 'default_thread';

    if (!message) {
        alert('Please enter a message');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    fetch('/api/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            threadID: threadID,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                messageInput.value = '';
                console.log('Message sent successfully');
            } else {
                alert('Error sending message: ' + (data.error || 'Unknown error'));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error sending message: ' + error.message);
        })
        .finally(() => {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        });
}

function clearChat() {
    if (confirm('Are you sure you want to clear all messages?')) {
        chatMessages.innerHTML = '<div class="message-placeholder"><p>Chat cleared. Waiting for new messages...</p></div>';
        updateStats();
    }
}

// ==================== API Functions ====================

function enableAutoResponse() {
    fetch('/api/auto-response/enable', { method: 'POST' })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Auto response enabled');
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        });
}

function disableAutoResponse() {
    fetch('/api/auto-response/disable', { method: 'POST' })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Auto response disabled');
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        });
}

function setAutoReact() {
    const type = document.getElementById('autoReactType').value;

    fetch('/api/auto-react/set-type', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: type }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Auto react type set to: ' + type);
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        });
}

function addAutoResponse() {
    const trigger = document.getElementById('responseTrigger').value.trim();
    const responses = document.getElementById('responseText').value.trim().split('\n').filter((r) => r.trim());

    if (!trigger || responses.length === 0) {
        alert('Please fill in trigger and response');
        return;
    }

    fetch('/api/auto-response/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            trigger: trigger,
            responses: responses,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Auto response added');
                document.getElementById('responseTrigger').value = '';
                document.getElementById('responseText').value = '';
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        });
}

// ==================== Status Update ====================

function updateStatus() {
    fetch('/api/status')
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then((data) => {
            uptime.textContent = formatUptime(data.uptime);
            memory.textContent = data.memoryUsage.toFixed(2) + 'MB';
            wsClients.textContent = data.websocketClients || 0;
        })
        .catch((error) => console.error('Error fetching status:', error));

    updateStats();
}

function updateStats() {
    fetch('/api/messages')
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then((data) => {
            messageCount.textContent = data.count || 0;
        })
        .catch((error) => console.error('Error fetching messages:', error));
}

function formatUptime(seconds) {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}
