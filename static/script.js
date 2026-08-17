document.addEventListener('DOMContentLoaded', () => {
    const setupForm = document.getElementById('setup-form');
    const setupScreen = document.getElementById('setup-screen');
    const ideScreen = document.getElementById('ide-screen');
    const statusBadge = document.getElementById('status-badge');
    const endSessionBtn = document.getElementById('end-session-btn');
    
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    const codeOutput = document.getElementById('code-output');
    const copyCodeBtn = document.getElementById('copy-code-btn');

    let currentCode = "";

    setupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const role = document.getElementById('role').value;
        const submitBtn = setupForm.querySelector('button');
        const originalBtnHtml = submitBtn.innerHTML;
        
        submitBtn.innerHTML = 'Connecting...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role })
            });
            
            const data = await response.json();
            
            if (data.status === 'error') {
                alert(data.reply);
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
                return;
            }
            
            // Switch screens
            setupScreen.style.opacity = '0';
            setTimeout(() => {
                setupScreen.classList.add('hidden');
                ideScreen.classList.remove('hidden');
                statusBadge.classList.remove('hidden');
                endSessionBtn.classList.remove('hidden');
                
                // Process initial AI message
                processResponse(data.reply);
                chatInput.focus();
            }, 400);
            
        } catch (error) {
            alert('Failed to initialize session.');
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.disabled = false;
        }
    });

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    endSessionBtn.addEventListener('click', () => {
        if(confirm("End current workspace session?")) {
            location.reload();
        }
    });

    copyCodeBtn.addEventListener('click', () => {
        if (!currentCode) return;
        navigator.clipboard.writeText(currentCode).then(() => {
            const originalHTML = copyCodeBtn.innerHTML;
            copyCodeBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => { copyCodeBtn.innerHTML = originalHTML; }, 2000);
        });
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendChatMessage('user', text);
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;

        const typingIndicator = showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            
            const data = await response.json();
            
            chatBox.removeChild(typingIndicator);
            
            if (data.error) {
                alert("Error: " + data.error);
                chatInput.disabled = false;
                sendBtn.disabled = false;
                return;
            }
            
            processResponse(data.reply);
            
            if (data.status !== 'completed') {
                chatInput.disabled = false;
                sendBtn.disabled = false;
                chatInput.focus();
            }
            
        } catch (error) {
            chatBox.removeChild(typingIndicator);
            appendChatMessage('bot', "Network error. Please try again.");
            chatInput.disabled = false;
            sendBtn.disabled = false;
        }
    }

    function processResponse(fullText) {
        // Look for markdown code blocks: ```abap ... ```
        const codeBlockRegex = /```(?:abap|sql|json|javascript|html|css)?\n([\s\S]*?)```/i;
        const match = fullText.match(codeBlockRegex);

        let chatText = fullText;
        
        if (match) {
            // We found code!
            const codeContent = match[1];
            currentCode = codeContent;
            
            // Remove the code block from the chat text
            chatText = fullText.replace(match[0], '\n*[Code generated in right pane]*\n').trim();
            
            // Update Code Editor Pane
            updateCodeEditor(codeContent);
        }

        // Add remaining conversational text to the left sidebar
        appendChatMessage('bot', chatText);
    }

    function updateCodeEditor(code) {
        codeOutput.textContent = code;
        codeOutput.classList.remove('hljs'); // force re-highlight
        if (window.hljs) {
            hljs.highlightElement(codeOutput);
        }
    }

    function appendChatMessage(sender, text) {
        if (!text) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        
        // Simple formatting for bold and newlines
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\n/g, '<br>');
        
        msgDiv.innerHTML = formatted;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatBox.appendChild(typingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return typingDiv;
    }
});
