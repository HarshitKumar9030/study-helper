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
from src.ui.styles import DARK_COLORS, LIGHT_COLORS
import datetime
import json

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
        self.current_theme = "dark"
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
        colors = DARK_COLORS if self.current_theme == 'dark' else LIGHT_COLORS
        
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
        
        # Get theme colors
        colors = DARK_COLORS if self.current_theme == 'dark' else LIGHT_COLORS
        
        if is_user:
            message_html = f"""
            <div style='margin-bottom: 16px; text-align: right;'>
                <div style='display: inline-block; background-color: {colors['primary']}; color: white; padding: 12px 16px; border-radius: 18px 18px 4px 18px; max-width: 70%; word-wrap: break-word;'>
                    {message}
                </div>
                <div style='font-size: 11px; color: {colors['text_secondary']}; margin-top: 4px;'>
                    You • {timestamp}
                </div>
            </div>
            """
        else:
            # For assistant messages, handle both plain text and HTML
            formatted_message = message
            if not ('<p>' in message or '<ul>' in message or '<strong>' in message):
                # Plain text - wrap in paragraph
                formatted_message = f"<p>{message}</p>"
                
            message_html = f"""
            <div style='margin-bottom: 16px;'>
                <div style='display: inline-block; background-color: {colors['surface']}; color: {colors['text_primary']}; padding: 12px 16px; border-radius: 18px 18px 18px 4px; max-width: 70%; word-wrap: break-word; border: 1px solid {colors['border']};'>
                    {formatted_message}
                </div>
                <div style='font-size: 11px; color: {colors['text_secondary']}; margin-top: 4px;'>
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
        # Try to parse as JSON first
        try:
            # Handle JSON responses (check for JSON structure)
            response_stripped = response.strip()
            if (response_stripped.startswith('{') and response_stripped.endswith('}')) or \
               (response_stripped.startswith('[') and response_stripped.endswith(']')):
                data = json.loads(response_stripped)
                
                # Handle different JSON response formats
                if isinstance(data, dict):
                    if 'message' in data or 'content' in data or 'response' in data:
                        formatted_response = self.format_structured_response(data)
                        self.add_message_to_chat(formatted_response, is_user=False)
                        return
                    elif 'text' in data:
                        # Simple text response in JSON
                        self.add_message_to_chat(data['text'], is_user=False)
                        return
                elif isinstance(data, list) and len(data) > 0:
                    # Handle array responses
                    formatted_response = self.format_list_response(data)
                    self.add_message_to_chat(formatted_response, is_user=False)
                    return
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
        
        # Try to detect and format markdown-like responses
        if self.has_markdown_elements(response):
            formatted_response = self.format_markdown_response(response)
            self.add_message_to_chat(formatted_response, is_user=False)
            return
        
        # Fallback to plain text response
        self.add_message_to_chat(response, is_user=False)
    
    def format_structured_response(self, data):
        """Format a structured JSON response into HTML."""
        html_parts = []
        
        # Handle different possible message keys
        message_content = data.get('message') or data.get('content') or data.get('response') or data.get('text', '')
        if message_content:
            html_parts.append(f"<p>{message_content}</p>")
        
        # Suggestions
        if 'suggestions' in data and data['suggestions']:
            html_parts.append("<br><strong>💡 Study Tips:</strong>")
            html_parts.append("<ul>")
            for suggestion in data['suggestions']:
                html_parts.append(f"<li>{suggestion}</li>")
            html_parts.append("</ul>")
        
        # Action Items
        if 'actionItems' in data and data['actionItems']:
            html_parts.append("<br><strong>📋 Action Items:</strong>")
            html_parts.append("<ul>")
            for item in data['actionItems']:
                if isinstance(item, str):
                    html_parts.append(f"<li>{item}</li>")
                elif isinstance(item, dict):
                    title = item.get('title', 'Task')
                    description = item.get('description', '')
                    priority = item.get('priority', 'medium')
                    time_estimate = item.get('estimatedTime', '')
                    
                    priority_emoji = {
                        'high': '🔴',
                        'medium': '🟡', 
                        'low': '🟢'
                    }.get(priority.lower(), '🔵')
                    
                    item_text = f"{priority_emoji} <strong>{title}</strong>"
                    if description:
                        item_text += f": {description}"
                    if time_estimate:
                        item_text += f" <em>({time_estimate} min)</em>"
                    
                    html_parts.append(f"<li>{item_text}</li>")
            html_parts.append("</ul>")
        
        # Study tips (alternative to suggestions)
        if 'tips' in data and data['tips']:
            html_parts.append("<br><strong>📚 Study Tips:</strong>")
            html_parts.append("<ul>")
            for tip in data['tips']:
                html_parts.append(f"<li>{tip}</li>")
            html_parts.append("</ul>")
        
        # Resources
        if 'resources' in data and data['resources']:
            html_parts.append("<br><strong>📖 Resources:</strong>")
            html_parts.append("<ul>")
            for resource in data['resources']:
                if isinstance(resource, str):
                    html_parts.append(f"<li>{resource}</li>")
                elif isinstance(resource, dict) and 'name' in resource:
                    name = resource['name']
                    url = resource.get('url', '')
                    if url:
                        html_parts.append(f"<li><a href='{url}' target='_blank'>{name}</a></li>")
                    else:
                        html_parts.append(f"<li>{name}</li>")
            html_parts.append("</ul>")
        
        # Confidence level (if available)
        if 'confidence' in data and isinstance(data['confidence'], (int, float)) and data['confidence'] < 0.7:
            html_parts.append("<br><small><em>Note: This response has lower confidence. Please verify the information.</em></small>")
        
        return "".join(html_parts) if html_parts else "<p>No content available</p>"
    
    def format_list_response(self, data_list):
        """Format a list response into HTML."""
        html_parts = ["<ul>"]
        for item in data_list:
            if isinstance(item, str):
                html_parts.append(f"<li>{item}</li>")
            elif isinstance(item, dict):
                # Try to format structured list items
                title = item.get('title') or item.get('name') or str(item)
                description = item.get('description', '')
                if description:
                    html_parts.append(f"<li><strong>{title}</strong>: {description}</li>")
                else:
                    html_parts.append(f"<li>{title}</li>")
        html_parts.append("</ul>")
        return "".join(html_parts)
    
    def has_markdown_elements(self, text):
        """Check if text contains markdown-like elements."""
        markdown_patterns = [
            '**', '*', '##', '#', '- ', '* ', '1. ', '2. ', '3. ',
            '[', '](', '`', '```', '---', '___'
        ]
        return any(pattern in text for pattern in markdown_patterns)
    
    def format_markdown_response(self, text):
        """Convert basic markdown elements to HTML."""
        # Convert headers
        text = text.replace('### ', '<h3>').replace('## ', '<h2>').replace('# ', '<h1>')
        
        # Convert bold text
        import re
        text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
        
        # Convert inline code
        text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
        
        # Convert lists
        lines = text.split('\n')
        in_list = False
        result_lines = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('- ') or line.startswith('* '):
                if not in_list:
                    result_lines.append('<ul>')
                    in_list = True
                result_lines.append(f'<li>{line[2:]}</li>')
            elif line.startswith(('1. ', '2. ', '3. ', '4. ', '5. ')):
                if not in_list:
                    result_lines.append('<ol>')
                    in_list = True
                result_lines.append(f'<li>{line[3:]}</li>')
            else:
                if in_list:
                    result_lines.append('</ul>' if lines[result_lines.__len__()-1].startswith('<li>') else '</ol>')
                    in_list = False
                if line:
                    result_lines.append(f'<p>{line}</p>')
                else:
                    result_lines.append('<br>')
        
        if in_list:
            result_lines.append('</ul>')
        
        return ''.join(result_lines)

    def clear_chat(self):
        """Clear the chat display."""
        self.chat_display.clear()
        self.chat_history.clear()
        self.add_welcome_message()
    
    def refresh(self):
        """Refresh the chat assistant."""
        # Could reload suggestions or update status
        pass
    
    def update_theme(self, theme):
        """Update the widget theme."""
        self.current_theme = theme
        self.setup_styles()
        
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
