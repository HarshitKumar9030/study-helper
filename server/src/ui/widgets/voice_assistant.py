"""
Voice Assistant widget for Study Helper application.
"""
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFrame, QLabel, 
    QPushButton, QTextEdit, QScrollArea, QListWidget, QListWidgetItem
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QTimer
from PyQt5.QtGui import QFont
from src.features.voice_assistant import VoiceAssistant
from src.ui.styles import DARK_COLORS
import threading

class VoiceWorkerThread(QThread):
    """Worker thread for voice recognition."""
    
    result_ready = pyqtSignal(str)
    error_occurred = pyqtSignal(str)
    
    def __init__(self, voice_assistant):
        super().__init__()
        self.voice_assistant = voice_assistant
        self.is_listening = False
    
    def run(self):
        """Run voice recognition."""
        try:
            self.is_listening = True
            result = self.voice_assistant.listen_for_speech()
            if result:
                self.result_ready.emit(result)
            else:
                self.error_occurred.emit("No speech detected")
        except Exception as e:
            self.error_occurred.emit(str(e))
        finally:
            self.is_listening = False

class VoiceAssistantWidget(QWidget):
    """Voice assistant interface widget."""
    
    def __init__(self):
        super().__init__()
        self.voice_assistant = VoiceAssistant()
        self.worker_thread = None
        self.setup_ui()
        self.setup_styles()
        
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
        
        # Left panel - Controls
        controls_panel = self.create_controls_panel()
        content_layout.addWidget(controls_panel, 1)
        
        # Right panel - History
        history_panel = self.create_history_panel()
        content_layout.addWidget(history_panel, 1)
        
        layout.addLayout(content_layout)
        layout.addStretch()
        
    def create_header(self):
        """Create the header section."""
        frame = QFrame()
        frame.setObjectName("headerCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(8)
        
        title_label = QLabel("🎤 Voice Assistant")
        title_label.setObjectName("headerTitle")
        
        subtitle_label = QLabel("Speak naturally to control your study session")
        subtitle_label.setObjectName("headerSubtitle")
        
        layout.addWidget(title_label)
        layout.addWidget(subtitle_label)
        
        return frame
    
    def create_controls_panel(self):
        """Create the voice controls panel."""
        frame = QFrame()
        frame.setObjectName("controlsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(20)
        
        # Status section
        status_section = QVBoxLayout()
        
        self.status_label = QLabel("Ready to listen")
        self.status_label.setObjectName("statusLabel")
        
        self.status_indicator = QLabel("🔴")
        self.status_indicator.setObjectName("statusIndicator")
        self.status_indicator.setAlignment(Qt.AlignCenter)
        
        status_section.addWidget(self.status_label)
        status_section.addWidget(self.status_indicator)
        
        # Control buttons
        button_layout = QVBoxLayout()
        button_layout.setSpacing(12)
        
        self.listen_button = QPushButton("🎤 Start Listening")
        self.listen_button.setObjectName("primaryButton")
        self.listen_button.clicked.connect(self.toggle_listening)
        
        self.settings_button = QPushButton("⚙️ Voice Settings")
        self.settings_button.setObjectName("secondaryButton")
        self.settings_button.clicked.connect(self.open_voice_settings)
        
        button_layout.addWidget(self.listen_button)
        button_layout.addWidget(self.settings_button)
        
        # Last recognized text
        self.last_text_label = QLabel("Last recognized:")
        self.last_text_label.setObjectName("sectionLabel")
        
        self.recognized_text = QTextEdit()
        self.recognized_text.setObjectName("recognizedText")
        self.recognized_text.setReadOnly(True)
        self.recognized_text.setMaximumHeight(100)
        self.recognized_text.setPlaceholderText("Your speech will appear here...")       
        layout.addLayout(status_section)
        layout.addLayout(button_layout)
        layout.addWidget(self.last_text_label)
        layout.addWidget(self.recognized_text)
        layout.addStretch()
        
        return frame
    
    def create_history_panel(self):
        """Create the voice history panel."""
        frame = QFrame()
        frame.setObjectName("historyCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)
        
        # Header
        header_layout = QHBoxLayout()
        
        title_label = QLabel("Voice Commands History")
        title_label.setObjectName("sectionTitle")
        
        clear_button = QPushButton("Clear")
        clear_button.setObjectName("linkButton")
        clear_button.clicked.connect(self.clear_history)
        
        header_layout.addWidget(title_label)
        header_layout.addStretch()
        header_layout.addWidget(clear_button)
        
        # History list
        self.history_list = QListWidget()
        self.history_list.setObjectName("historyList")
        
        # Add some example history items
        example_items = [
            "Set timer for 25 minutes",
            "Start focus mode",
            "What's my schedule today?",
            "Block social media sites"
        ]
        for item_text in example_items:
            item = QListWidgetItem(f"🎙️ {item_text}")
            self.history_list.addItem(item)
            item = QListWidgetItem(f"🎙️ {item_text}")
            self.history_list.addItem(item)
        
        layout.addLayout(header_layout)
        layout.addWidget(self.history_list)
        
        return frame
    
    def setup_styles(self):
        """Apply styling to the voice assistant widget."""
        colors = DARK_COLORS
        
        self.setStyleSheet(f"""
            QFrame#headerCard, QFrame#controlsCard, QFrame#historyCard {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
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
            
            QLabel#statusLabel {{
                color: {colors['text_primary']};
                font-size: 16px;
                font-weight: 500;
                text-align: center;
            }}
            
            QLabel#statusIndicator {{
                font-size: 24px;
                padding: 8px;
            }}
            
            QPushButton#primaryButton {{
                background-color: {colors['primary']};
                color: #FFFFFF;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 500;
                min-height: 20px;
            }}
            
            QPushButton#primaryButton:hover {{
                background-color: {colors['primary_hover']};
            }}
            
            QPushButton#secondaryButton {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 500;
                min-height: 20px;
            }}
            
            QPushButton#secondaryButton:hover {{
                background-color: {colors['surface_hover']};
            }}
            
            QLabel#sectionLabel, QLabel#sectionTitle {{
                color: {colors['text_primary']};
                font-size: 14px;
                font-weight: 500;
            }}
            
            QTextEdit#recognizedText {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 12px;
                font-size: 14px;
            }}
            
            QPushButton#linkButton {{
                background-color: transparent;
                color: {colors['primary']};
                border: none;
                font-size: 12px;
                font-weight: 500;
                padding: 4px 8px;
            }}
            
            QPushButton#linkButton:hover {{
                color: {colors['primary_hover']};
                text-decoration: underline;
            }}
            
            QListWidget#historyList {{
                background-color: {colors['background']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 8px;
                outline: none;
            }}
            
            QListWidget#historyList::item {{
                background-color: transparent;
                color: {colors['text_primary']};
                padding: 8px 12px;
                border-radius: 6px;
                margin: 2px 0;
            }}
            
            QListWidget#historyList::item:hover {{
                background-color: {colors['surface_hover']};
            }}
            
            QListWidget#historyList::item:selected {{
                background-color: {colors['primary']};
                color: #FFFFFF;
            }}
        """)
    
    def toggle_listening(self):
        """Toggle voice listening."""
        if self.worker_thread and self.worker_thread.is_listening:
            self.stop_listening()
        else:
            self.start_listening()
    
    def start_listening(self):
        """Start voice recognition."""
        if not self.voice_assistant.is_available:
            self.recognized_text.setText("Voice recognition not available. Please check your microphone.")
            return
        
        self.listen_button.setText("🛑 Stop Listening")
        self.listen_button.setObjectName("warningButton")
        self.status_label.setText("Listening...")
        self.status_indicator.setText("🟢")
        
        # Start worker thread
        self.worker_thread = VoiceWorkerThread(self.voice_assistant)
        self.worker_thread.result_ready.connect(self.on_speech_recognized)
        self.worker_thread.error_occurred.connect(self.on_speech_error)
        self.worker_thread.finished.connect(self.on_listening_finished)
        self.worker_thread.start()
    
    def stop_listening(self):
        """Stop voice recognition."""
        if self.worker_thread:
            self.worker_thread.terminate()
            self.worker_thread.wait()
        
        self.on_listening_finished()
    
    def on_speech_recognized(self, text):
        """Handle recognized speech."""
        self.recognized_text.setText(text)
        
        # Add to history
        item = QListWidgetItem(f"🎙️ {text}")
        self.history_list.insertItem(0, item)
        
        # Process the command
        self.process_voice_command(text)
    
    def on_speech_error(self, error_msg):
        """Handle speech recognition error."""
        self.recognized_text.setText(f"Error: {error_msg}")
    
    def on_listening_finished(self):
        """Handle listening finished."""
        self.listen_button.setText("🎤 Start Listening")
        self.listen_button.setObjectName("primaryButton")
        self.status_label.setText("Ready to listen")
        self.status_indicator.setText("🔴")
        
        # Reapply styles
        self.setup_styles()
    
    def process_voice_command(self, command):
        """Process voice command."""
        try:
            response = self.voice_assistant.process_command(command)
            if response:
                # Add response to history or show notification
                pass
        except Exception as e:
            print(f"Error processing voice command: {e}")
    
    def clear_history(self):
        """Clear voice command history."""
        self.history_list.clear()
    
    def open_voice_settings(self):
        """Open voice settings dialog."""
        # Placeholder for voice settings dialog
        pass
