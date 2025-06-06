
import threading
import time
import tkinter as tk
from tkinter import ttk, scrolledtext
import customtkinter as ctk
from typing import List, Dict, Any, Optional

from src.utils.logger import get_logger

logger = get_logger(__name__)

class ChatAssistant:
    def __init__(self, config, auth_service):
        self.config = config
        self.auth_service = auth_service
        self.chat_window = None
        self.chat_history = []
        
        logger.info("Chat Assistant initialized")
    
    def show_interface(self):
        if self.chat_window and self.chat_window.winfo_exists():
            self.chat_window.lift()
            return
        
        self.create_chat_window()
    
    def create_chat_window(self):
        self.chat_window = ctk.CTkToplevel()
        self.chat_window.title("Chat Assistant")
        self.chat_window.geometry("600x500")
        
        # Main container
        main_frame = ctk.CTkFrame(self.chat_window)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Title
        title_label = ctk.CTkLabel(
            main_frame,
            text="💬 Chat Assistant",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        title_label.pack(pady=10)
        
        self.chat_display = ctk.CTkTextbox(
            main_frame,
            height=300,
            state="disabled",
            wrap="word"
        )
        self.chat_display.pack(fill="both", expand=True, padx=10, pady=5)
        
        input_frame = ctk.CTkFrame(main_frame)
        input_frame.pack(fill="x", padx=10, pady=5)
        
        self.message_entry = ctk.CTkEntry(
            input_frame,
            placeholder_text="Type your message here...",
            font=ctk.CTkFont(size=12)
        )
        self.message_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        
        send_button = ctk.CTkButton(
            input_frame,
            text="Send",
            command=self.send_message,
            width=80
        )
        send_button.pack(side="right")
        
        self.message_entry.bind("<Return>", lambda e: self.send_message())
        
        self.add_message("Assistant", "Hello! I'm your Study Helper assistant. How can I help you today?")
        
        logger.info("Chat interface created")
    
    def send_message(self):
        message = self.message_entry.get().strip()
        if not message:
            return
        
        self.add_message("You", message)
        
        self.message_entry.delete(0, 'end')
        
        threading.Thread(target=self.process_message, args=(message,), daemon=True).start()
    
    def add_message(self, sender: str, message: str):
        """Add a message to the chat display."""
        timestamp = time.strftime("%H:%M:%S")
        
        self.chat_history.append({
            'sender': sender,
            'message': message,
            'timestamp': time.time()
        })
        
        self.chat_display.configure(state="normal")
        
        if sender == "You":
            prefix = f"[{timestamp}] You: "
            self.chat_display.insert("end", prefix, "user")
        else:
            prefix = f"[{timestamp}] Assistant: "
            self.chat_display.insert("end", prefix, "assistant")
        
        self.chat_display.insert("end", f"{message}\n\n")
        
        self.chat_display.see("end")
        self.chat_display.configure(state="disabled")
    
    def process_message(self, message: str):
        """Process user message and generate response."""
        try:
            self.auth_service.send_activity_log('chat_message', {
                'message': message,
                'timestamp': time.time()
            })
            
            response = self.generate_response(message)
            
            self.chat_window.after(0, lambda: self.add_message("Assistant", response))
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            error_response = "Sorry, I encountered an error processing your message. Please try again."
            self.chat_window.after(0, lambda: self.add_message("Assistant", error_response))
    
    def generate_response(self, message: str) -> str:
        """Generate a response to user message."""
        message_lower = message.lower().strip()
        
        if any(word in message_lower for word in ['hello', 'hi', 'hey']):
            user = self.auth_service.get_current_user()
            name = user.get('name', 'there') if user else 'there'
            return f"Hello {name}! How can I help you with your studies today?"
        
        elif any(word in message_lower for word in ['time', 'what time']):
            current_time = time.strftime("%I:%M %p")
            current_date = time.strftime("%A, %B %d, %Y")
            return f"It's currently {current_time} on {current_date}"
        
        elif any(word in message_lower for word in ['focus', 'focus mode']):
            return """Focus Mode helps you stay productive by blocking distracting websites. 
            
You can:
• Say "start focus mode" to begin blocking distractions
• Say "stop focus mode" to end the session
• Customize which sites to block in the settings

Would you like me to start focus mode for you?"""
        
        elif any(word in message_lower for word in ['schedule', 'calendar', 'plan']):
            return """I can help you with scheduling your study sessions!
            
You can:
• View today's schedule
• Add new study tasks
• See analytics about your study habits
• Get AI-powered schedule optimization

Would you like to open the Smart Scheduler?"""
        
        elif any(word in message_lower for word in ['voice', 'speak', 'listen']):
            return """I have voice capabilities too! You can:
            
• Say "Study Helper" to wake up the voice assistant
• Give voice commands for hands-free control
• Listen to spoken responses and notifications

The voice assistant works alongside this chat interface."""
        
        elif any(word in message_lower for word in ['help', 'what can you do', 'capabilities']):
            return """I'm your Study Helper assistant! Here's what I can do:

🎯 **Focus Mode**: Block distracting websites during study sessions
📅 **Smart Scheduling**: Create and optimize your study schedule  
🎤 **Voice Control**: Respond to voice commands
💬 **Chat Support**: Answer questions and provide guidance
📊 **Analytics**: Track your productivity and study patterns

Try asking me about any of these features, or say specific commands like:
• "Start focus mode"
• "Show my schedule" 
• "What time is it?"
• "Help with [subject]"

What would you like to explore first?"""
        
        elif any(word in message_lower for word in ['study tips', 'how to study', 'study better']):
            return """Here are some effective study tips:

📚 **Active Learning**: Don't just read - summarize, teach others, create flashcards
⏰ **Pomodoro Technique**: Study for 25min, break for 5min, repeat
🎯 **Eliminate Distractions**: Use Focus Mode to block social media
📝 **Take Notes by Hand**: Improves retention compared to typing
🔄 **Spaced Repetition**: Review material at increasing intervals
😴 **Get Enough Sleep**: 7-9 hours for memory consolidation
🏃 **Exercise Regularly**: Improves brain function and focus

Would you like me to help you implement any of these strategies?"""
        
        elif any(word in message_lower for word in ['motivation', 'motivated', 'lazy']):
            return """Staying motivated can be challenging! Here are some strategies:

🎯 **Set Clear Goals**: Break big tasks into smaller, achievable steps
🏆 **Celebrate Small Wins**: Acknowledge progress, no matter how small
👥 **Find Study Buddies**: Accountability partners keep you on track
📊 **Track Progress**: Visual progress helps maintain momentum
🎵 **Create Rituals**: Consistent study environment and routine
💪 **Start Small**: Even 5 minutes is better than nothing
🌟 **Remember Your Why**: Connect studies to your bigger life goals

I can help you stay on track with reminders and progress tracking. What's your biggest motivation challenge?"""
        
        else:
            # Default response with suggestions
            return f"""I understand you're asking about "{message}". 

While I may not have specific information about that topic, I can help you with:

• **Study techniques** and productivity tips
• **Time management** and scheduling
• **Focus strategies** and distraction blocking
• **Goal setting** and progress tracking

Try asking more specific questions like:
• "How can I study [subject] better?"
• "Help me plan my study schedule"
• "What are good study techniques?"
• "How do I stay focused while studying?"

What would you like to know more about?"""
    
    def get_chat_history(self) -> List[Dict[str, Any]]:
        """Get the chat history."""
        return self.chat_history.copy()
    
    def clear_chat(self):
        """Clear the chat history and display."""
        self.chat_history.clear()
        
        if self.chat_display:
            self.chat_display.configure(state="normal")
            self.chat_display.delete("1.0", "end")
            self.chat_display.configure(state="disabled")
            
            # Add welcome message
            self.add_message("Assistant", "Chat cleared! How can I help you?")
        
        logger.info("Chat history cleared")
