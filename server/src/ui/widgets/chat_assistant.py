"""
Chat Assistant widget for Study Helper application.
"""
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFrame, QLabel, 
    QPushButton, QTextEdit, QLineEdit, QScrollArea, QListWidget, QListWidgetItem
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QTimer
from PyQt5.QtGui import QFont, QTextCursor
from src.features.chat_assistant import ChatAssistant
from src.ui.styles import DARK_COLORS
import datetime

class ChatWorkerThread(QThread):
    """Worker thread for chat processing."""
    
    response_ready = pyqtSignal(str)
    error_occurred = pyqtSignal(str)
    
    def __init__(self, chat_assistant, message):
        super().__init__()
        self.chat_assistant = chat_assistant
        self.message = message
    
    def run(self):
        """Process chat message."""
        try:
            response = self.chat_assistant.get_response(self.message)
            self.response_ready.emit(response)
        except Exception as e:
            self.error_occurred.emit(str(e))

class ChatAssistantWidget(QWidget):
    """Chat assistant interface widget."""
    
    def __init__(self):
        super().__init__()
        self.chat_assistant = ChatAssistant()
        self.worker_thread = None
        self.chat_history = []
        self.setup_ui()
        self.setup_styles()
        self.add_welcome_message()
        
    def setup_ui(self):
        """Setup the user interface."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(24)
        
        # Header
        header_frame = self.create_header()
        layout.addWidget(header_frame)
        
        # Main content
        content_layout = QHBoxLayout()
        content_layout.setSpacing(24)
        
        # Left panel - Chat
        chat_panel = self.create_chat_panel()
        content_layout.addWidget(chat_panel, 2)
        
        # Right panel - Quick actions and suggestions
        actions_panel = self.create_actions_panel()
        content_layout.addWidget(actions_panel, 1)
        
        layout.addLayout(content_layout)
        
    def create_header(self):
        """Create the header section."""
        frame = QFrame()
        frame.setObjectName("headerCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(8)
        
        title_label = QLabel("💬 Chat Assistant")
        title_label.setObjectName("headerTitle")
        
        subtitle_label = QLabel("Get help with your studies, ask questions, and receive personalized advice")
        subtitle_label.setObjectName("headerSubtitle")
        
        layout.addWidget(title_label)
        layout.addWidget(subtitle_label)
        
        return frame
    
    def create_chat_panel(self):
        """Create the main chat panel."""
        frame = QFrame()
        frame.setObjectName("chatCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        # Chat display
        self.chat_display = QTextEdit()
        self.chat_display.setObjectName("chatDisplay")
        self.chat_display.setReadOnly(True)
        
        # Input area
        input_frame = self.create_input_area()
        
        layout.addWidget(self.chat_display)
        layout.addWidget(input_frame)
        
        return frame
    
    def create_input_area(self):
        """Create the chat input area."""
        frame = QFrame()
        frame.setObjectName("inputFrame")
        layout = QHBoxLayout(frame)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)
        
        # Message input
        self.message_input = QLineEdit()
        self.message_input.setObjectName("messageInput")
        self.message_input.setPlaceholderText("Type your message here...")
        self.message_input.returnPressed.connect(self.send_message)
        
        # Send button
        self.send_button = QPushButton("Send")
        self.send_button.setObjectName("sendButton")
        self.send_button.clicked.connect(self.send_message)
        
        # Clear button
        clear_button = QPushButton("Clear")
        clear_button.setObjectName("clearButton")
        clear_button.clicked.connect(self.clear_chat)
        
        layout.addWidget(self.message_input)
        layout.addWidget(self.send_button)
        layout.addWidget(clear_button)
        
        return frame
    
    def create_actions_panel(self):
        """Create the quick actions panel."""
        frame = QFrame()
        frame.setObjectName("actionsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        # Quick actions
        actions_section = self.create_quick_actions()
        layout.addWidget(actions_section)
        
        # Suggestions
        suggestions_section = self.create_suggestions()
        layout.addWidget(suggestions_section)
        
        layout.addStretch()
        
        return frame
    
    def create_quick_actions(self):
        """Create quick actions section."""
        frame = QFrame()
        layout = QVBoxLayout(frame)
        layout.setSpacing(12)
        
        title_label = QLabel("Quick Actions")
        title_label.setObjectName("sectionTitle")
        
        # Action buttons
        actions = [
            ("📚 Study Help", "I need help with my studies"),
            ("📝 Homework Tips", "Give me tips for doing homework effectively"),
            ("⏰ Time Management", "How can I manage my time better?"),
            ("🎯 Set Goals", "Help me set study goals"),
            ("🧠 Memory Tips", "Give me tips to improve my memory"),
        ]
        
        for icon_text, message in actions:
            button = QPushButton(icon_text)
            button.setObjectName("actionButton")
            button.clicked.connect(lambda checked, msg=message: self.send_quick_message(msg))
            layout.addWidget(button)
        
        layout.insertWidget(0, title_label)
        
        return frame
    
    def create_suggestions(self):
        """Create suggestions section."""
        frame = QFrame()
        layout = QVBoxLayout(frame)
        layout.setSpacing(12)
        
        title_label = QLabel("Suggestions")
        title_label.setObjectName("sectionTitle")
        
        # Suggestions list
        self.suggestions_list = QListWidget()
        self.suggestions_list.setObjectName("suggestionsList")
        
        # Add sample suggestions
        suggestions = [
            "What's the Pomodoro Technique?",
            "How to create a study schedule?",
            "Best note-taking methods",
            "How to avoid procrastination?",
            "Effective reading strategies"
        ]
        
        for suggestion in suggestions:
            item = QListWidgetItem(f"💡 {suggestion}")
            self.suggestions_list.addItem(item)
        
        # Connect click to send message
        self.suggestions_list.itemClicked.connect(self.on_suggestion_clicked)
        
        layout.addWidget(title_label)
        layout.addWidget(self.suggestions_list)
        
        return frame
    
    def setup_styles(self):
        """Apply styling to the chat assistant widget."""
        colors = DARK_COLORS
        
        self.setStyleSheet(f"""
            QFrame#headerCard, QFrame#chatCard, QFrame#actionsCard {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
            }}
            
            QFrame#inputFrame {{
                background-color: {colors['background']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
            }}
            
            QLabel#headerTitle {{
                color: {colors['text_primary']};
                font-size: 20px;
                font-weight: 600;
            }}
            
            QLabel#headerSubtitle {{
                color: {colors['text_secondary']};
                font-size: 14px;
                font-weight: 400;
            }}
            
            QLabel#sectionTitle {{
                color: {colors['text_primary']};
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }}
            
            QTextEdit#chatDisplay {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 16px;
                font-size: 14px;
                font-family: 'Segoe UI', Arial, sans-serif;
            }}
            
            QLineEdit#messageInput {{
                background-color: transparent;
                color: {colors['text_primary']};
                border: none;
                padding: 8px 12px;
                font-size: 14px;
            }}
            
            QPushButton#sendButton {{
                background-color: {colors['primary']};
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                min-width: 60px;
            }}
            
            QPushButton#sendButton:hover {{
                background-color: {colors['primary_hover']};
            }}
            
            QPushButton#clearButton {{
                background-color: {colors['secondary']};
                color: {colors['text_primary']};
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 14px;
                font-weight: 500;
            }}
            
            QPushButton#clearButton:hover {{
                background-color: {colors['border_light']};
            }}
            
            QPushButton#actionButton {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 10px 12px;
                font-size: 13px;
                font-weight: 400;
                text-align: left;
            }}
            
            QPushButton#actionButton:hover {{
                background-color: {colors['surface_hover']};
                border-color: {colors['primary']};
                color: {colors['primary']};
            }}
            
            QListWidget#suggestionsList {{
                background-color: {colors['background']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 8px;
                outline: none;
                max-height: 200px;
            }}
            
            QListWidget#suggestionsList::item {{
                background-color: transparent;
                color: {colors['text_secondary']};
                padding: 8px 12px;
                border-radius: 6px;
                margin: 2px 0;
                font-size: 12px;
            }}
            
            QListWidget#suggestionsList::item:hover {{
                background-color: {colors['surface_hover']};
                color: {colors['text_primary']};
                cursor: pointer;
            }}
            
            QListWidget#suggestionsList::item:selected {{
                background-color: {colors['primary']};
                color: #FFFFFF;
            }}
        """)
    
    def add_welcome_message(self):
        """Add welcome message to chat."""
        welcome_msg = """
        <div style='padding: 12px; background-color: #3B82F6; border-radius: 8px; margin-bottom: 16px; color: white;'>
        <strong>🤖 Study Assistant</strong><br>
        Hello! I'm here to help you with your studies. You can ask me questions about:
        <ul>
        <li>Study techniques and methods</li>
        <li>Time management and scheduling</li>
        <li>Subject-specific help</li>
        <li>Motivation and goal setting</li>
        <li>Learning strategies</li>
        </ul>
        How can I assist you today?
        </div>
        """
        self.chat_display.setHtml(welcome_msg)
    
    def send_message(self):
        """Send a message."""
        message = self.message_input.text().strip()
        if not message:
            return
        
        self.send_quick_message(message)
        self.message_input.clear()
    
    def send_quick_message(self, message):
        """Send a quick message."""
        # Add user message to chat
        self.add_message_to_chat(message, is_user=True)
        
        # Disable input while processing
        self.message_input.setEnabled(False)
        self.send_button.setEnabled(False)
        self.send_button.setText("...")
        
        # Start worker thread for AI response
        self.worker_thread = ChatWorkerThread(self.chat_assistant, message)
        self.worker_thread.response_ready.connect(self.on_response_ready)
        self.worker_thread.error_occurred.connect(self.on_response_error)
        self.worker_thread.finished.connect(self.on_response_finished)
        self.worker_thread.start()
    
    def add_message_to_chat(self, message, is_user=True):
        """Add a message to the chat display."""
        timestamp = datetime.datetime.now().strftime("%H:%M")
        
        if is_user:
            message_html = f"""
            <div style='margin-bottom: 16px; text-align: right;'>
                <div style='display: inline-block; background-color: #3B82F6; color: white; padding: 12px 16px; border-radius: 18px 18px 4px 18px; max-width: 70%; word-wrap: break-word;'>
                    {message}
                </div>
                <div style='font-size: 11px; color: #9CA3AF; margin-top: 4px;'>
                    You • {timestamp}
                </div>
            </div>
            """
        else:
            message_html = f"""
            <div style='margin-bottom: 16px;'>
                <div style='display: inline-block; background-color: #374151; color: #F9FAFB; padding: 12px 16px; border-radius: 18px 18px 18px 4px; max-width: 70%; word-wrap: break-word;'>
                    {message}
                </div>
                <div style='font-size: 11px; color: #9CA3AF; margin-top: 4px;'>
                    Assistant • {timestamp}
                </div>
            </div>
            """
        
        # Append to chat display
        cursor = self.chat_display.textCursor()
        cursor.movePosition(QTextCursor.End)
        cursor.insertHtml(message_html)
        
        # Scroll to bottom
        scrollbar = self.chat_display.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
        
        # Store in history
        self.chat_history.append({
            'message': message,
            'is_user': is_user,
            'timestamp': timestamp
        })
    
    def on_response_ready(self, response):
        """Handle AI response."""
        self.add_message_to_chat(response, is_user=False)
    
    def on_response_error(self, error_msg):
        """Handle AI response error."""
        error_response = f"Sorry, I encountered an error: {error_msg}"
        self.add_message_to_chat(error_response, is_user=False)
    
    def on_response_finished(self):
        """Handle response completion."""
        self.message_input.setEnabled(True)
        self.send_button.setEnabled(True)
        self.send_button.setText("Send")
        self.message_input.setFocus()
    
    def on_suggestion_clicked(self, item):
        """Handle suggestion click."""
        suggestion_text = item.text().replace('💡 ', '')
        self.send_quick_message(suggestion_text)
    
    def clear_chat(self):
        """Clear the chat display."""
        self.chat_display.clear()
        self.chat_history.clear()
        self.add_welcome_message()
    
    def refresh(self):
        """Refresh the chat assistant."""
        # Could reload suggestions or update status
        pass
