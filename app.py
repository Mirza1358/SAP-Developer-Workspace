from flask import Flask, request, jsonify, render_template, session
import os
import uuid
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24) # Required for secure sessions

# Store chat objects and history in memory for active sessions
active_chats = {}

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing!")
    return Groq(api_key=api_key)

SYSTEM_INSTRUCTION = """
You are a highly skilled SAP Support Engineer and ABAP Expert assisting junior employees and functional consultants. 
Your goal is to provide precise, accurate, and helpful answers regarding SAP T-Codes, functional modules (like FI/CO, MM, SD), and ABAP programming.
When asked for ABAP code, you MUST use modern ABAP 7.4+ syntax (e.g., inline declarations, VALUE operators, modern Open SQL).
CRITICAL: When you write any ABAP code, you MUST wrap it entirely inside a markdown code block starting with ```abap and ending with ```. Do not put explanations inside the code block.
When asked about functional processes, explain the business process briefly, provide the exact T-Code, and mention key underlying tables if relevant.
Do not provide generic programming advice; tailor everything to SAP best practices.
Keep your responses professional, elegant, and concise.
"""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start_session():
    data = request.json
    name = data.get('name')
    role = data.get('role', 'SAP Consultant')
    
    # Create a unique session ID
    session_id = str(uuid.uuid4())
    session['session_id'] = session_id
    
    # Initialize the chat history for Groq
    messages = [
        {"role": "system", "content": SYSTEM_INSTRUCTION},
        {"role": "user", "content": f"Hello, my name is {name} and my role is {role}. I need your help with SAP and ABAP today."}
    ]
    
    # Trigger the first question by sending a prompt as the user
    try:
        client = get_groq_client()
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama3-8b-8192",
        )
        response_text = chat_completion.choices[0].message.content
        
        # Add the assistant's response to the history
        messages.append({"role": "assistant", "content": response_text})
        
        # Store session data
        active_chats[session_id] = {
            'name': name,
            'role': role,
            'history': messages
        }
        
        return jsonify({"reply": response_text, "status": "ongoing"})
    except Exception as e:
        error_message = str(e)
        if "rate limit" in error_message.lower():
            return jsonify({"reply": "Groq API Rate Limit Reached. Please wait a moment before starting the session.", "status": "error"}), 429
        return jsonify({"reply": f"An error occurred connecting to the AI: {error_message}", "status": "error"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    session_id = session.get('session_id')
    if not session_id or session_id not in active_chats:
        return jsonify({"error": "Session expired or invalid"}), 400
        
    user_message = request.json.get('message')
    chat_data = active_chats[session_id]
    
    # Log candidate's response
    chat_data['history'].append({"role": "user", "content": user_message})
    
    
    # Continue chat
    try:
        client = get_groq_client()
        chat_completion = client.chat.completions.create(
            messages=chat_data['history'],
            model="llama3-8b-8192",
        )
        response_text = chat_completion.choices[0].message.content
        
        chat_data['history'].append({"role": "assistant", "content": response_text})
        return jsonify({"reply": response_text, "status": "ongoing"})
    except Exception as e:
        error_message = str(e)
        if "rate limit" in error_message.lower() or "429" in error_message:
            # We must remove the last user message from history so they can retry it
            chat_data['history'].pop()
            return jsonify({"reply": "Oops! We hit the API rate limit. Please wait 10 seconds before sending your next answer!", "status": "error"}), 429
        
        chat_data['history'].pop() # Remove last message on error so they can retry
        print("GROQ ERROR:", error_message)
        return jsonify({"error": f"An error occurred with the AI: {error_message}"}), 500

def save_transcript(session_id):
    chat_data = active_chats[session_id]
    
    # Create a safe filename
    safe_name = "".join(c for c in chat_data['name'] if c.isalnum() or c in (' ', '_')).replace(' ', '_')
    filename = f"{safe_name}_sap_transcript.txt"
    filepath = os.path.join('/tmp', filename)
    
    with open(filepath, 'w') as f:
        f.write("=== SAP Support Transcript ===\n")
        f.write(f"Name: {chat_data['name']}\n")
        f.write(f"Role: {chat_data['role']}\n")
        f.write("============================\n\n")
        
        for entry in chat_data['history']:
            if entry['role'] == 'system':
                continue
            role_label = "SAP Assistant" if entry['role'] == 'assistant' else chat_data['name']
            f.write(f"{role_label}: {entry['content']}\n\n")

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(debug=True, port=5000)
