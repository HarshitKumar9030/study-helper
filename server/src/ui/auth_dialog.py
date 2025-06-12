"""
Modern authentication dialog for Study Helper application.
"""
import sys
from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QPushButton, QFrame, QSpacerItem, QSizePolicy, QApplication
)
from PyQt5.QtCore import Qt, pyqtSignal, QTimer
from PyQt5.QtGui import QFont, QPixmap, QPainter, QIcon
from src.services.auth_service import AuthService
from src.utils.config import Config
from src.ui.styles import get_button_style, get_input_style, get_label_style, DARK_COLORS

class AuthDialog(QDialog):
    """Modern authentication dialog."""
    
    authentication_success = pyqtSignal(str)  # Emits JWT token
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.auth_service = AuthService()
        self.auth_token = None
        self.setup_ui()
        self.setup_styles()
        
    def setup_ui(self):
        """Setup the user interface."""
        self.setWindowTitle("Study Helper - Login")
        self.setFixedSize(400, 500)
        self.setWindowFlags(Qt.Dialog | Qt.WindowCloseButtonHint)
        
        # Main layout
        main_layout = QVBoxLayout()
        main_layout.setSpacing(0)
        main_layout.setContentsMargins(0, 0, 0, 0)
        
        # Create main container
        container = QFrame()
        container.setObjectName("container")
        container_layout = QVBoxLayout(container)
        container_layout.setContentsMargins(40, 40, 40, 40)
        container_layout.setSpacing(24)
        
        # Header
        header_layout = QVBoxLayout()
        header_layout.setSpacing(8)
        
        # Logo/Icon placeholder
        logo_label = QLabel("📚")
        logo_label.setAlignment(Qt.AlignCenter)
        logo_label.setStyleSheet("font-size: 48px; margin-bottom: 16px;")
        
        # Title
        title_label = QLabel("Study Helper")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setObjectName("title")
        
        # Subtitle
        subtitle_label = QLabel("Sign in to continue")
        subtitle_label.setAlignment(Qt.AlignCenter)
        subtitle_label.setObjectName("subtitle")
        
        header_layout.addWidget(logo_label)
        header_layout.addWidget(title_label)
        header_layout.addWidget(subtitle_label)
        
        # Form
        form_layout = QVBoxLayout()
        form_layout.setSpacing(16)
        
        # Username field
        username_label = QLabel("Username or Email")
        username_label.setObjectName("fieldLabel")
        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("Enter your username or email")
        self.username_input.setObjectName("input")
        
        # Password field
        password_label = QLabel("Password")
        password_label.setObjectName("fieldLabel")
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Enter your password")
        self.password_input.setEchoMode(QLineEdit.Password)
        self.password_input.setObjectName("input")
        
        # Remember me checkbox (placeholder for now)
        remember_layout = QHBoxLayout()
        remember_layout.addStretch()
        
        # Add form fields
        form_layout.addWidget(username_label)
        form_layout.addWidget(self.username_input)
        form_layout.addWidget(password_label)
        form_layout.addWidget(self.password_input)
        form_layout.addLayout(remember_layout)
        
        # Buttons
        button_layout = QVBoxLayout()
        button_layout.setSpacing(12)
        
        # Login button
        self.login_button = QPushButton("Sign In")
        self.login_button.setObjectName("primaryButton")
        self.login_button.clicked.connect(self.handle_login)
        
        # Register button
        self.register_button = QPushButton("Create Account")
        self.register_button.setObjectName("secondaryButton")
        self.register_button.clicked.connect(self.handle_register)
        
        # Guest mode button
        self.guest_button = QPushButton("Continue as Guest")
        self.guest_button.setObjectName("textButton")
        self.guest_button.clicked.connect(self.handle_guest_mode)
        
        button_layout.addWidget(self.login_button)
        button_layout.addWidget(self.register_button)
        button_layout.addWidget(self.guest_button)
        
        # Status label
        self.status_label = QLabel("")
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setObjectName("statusLabel")
        self.status_label.hide()
        
        # Add all sections to container
        container_layout.addLayout(header_layout)
        container_layout.addLayout(form_layout)
        container_layout.addLayout(button_layout)
        container_layout.addWidget(self.status_label)
        container_layout.addStretch()
        
        main_layout.addWidget(container)
        self.setLayout(main_layout)
        
        # Connect Enter key to login
        self.username_input.returnPressed.connect(self.handle_login)
        self.password_input.returnPressed.connect(self.handle_login)
        
    def setup_styles(self):
        """Apply modern styling."""
        colors = DARK_COLORS
        
        self.setStyleSheet(f"""
            QDialog {{
                background-color: {colors['background']};
            }}
            
            QFrame#container {{
                background-color: {colors['surface']};
                border-radius: 16px;
                border: 1px solid {colors['border']};
            }}
            
            QLabel#title {{
                color: {colors['text_primary']};
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 4px;
            }}
            
            QLabel#subtitle {{
                color: {colors['text_secondary']};
                font-size: 14px;
                font-weight: 400;
                margin-bottom: 24px;
            }}
            
            QLabel#fieldLabel {{
                color: {colors['text_primary']};
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 4px;
            }}
            
            QLineEdit#input {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 12px 16px;
                font-size: 14px;
                min-height: 20px;
            }}
            
            QLineEdit#input:focus {{
                border-color: {colors['primary']};
                outline: none;
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
            
            QPushButton#primaryButton:pressed {{
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
                border-color: {colors['border_light']};
            }}
            
            QPushButton#textButton {{
                background-color: transparent;
                color: {colors['text_secondary']};
                border: none;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 400;
                min-height: 20px;
            }}
            
            QPushButton#textButton:hover {{
                color: {colors['text_primary']};
                text-decoration: underline;
            }}
            
            QLabel#statusLabel {{
                color: {colors['error']};
                font-size: 12px;
                margin-top: 8px;
            }}
            
            QLabel#statusLabel.success {{
                color: {colors['success']};
            }}
        """)
    
    def show_status(self, message, is_error=True):
        """Show status message."""
        self.status_label.setText(message)
        if is_error:
            self.status_label.setStyleSheet(f"color: {DARK_COLORS['error']};")
        else:
            self.status_label.setStyleSheet(f"color: {DARK_COLORS['success']};")
        self.status_label.show()
        
        # Auto-hide after 5 seconds
        QTimer.singleShot(5000, self.status_label.hide)
    
    def handle_login(self):
        """Handle login attempt."""
        username = self.username_input.text().strip()
        password = self.password_input.text()
        
        if not username or not password:
            self.show_status("Please enter both username and password")
            return
        self.login_button.setText("Signing in...")
        self.login_button.setEnabled(False)
        
        try:
            # Simulate authentication (replace with actual auth logic)
            success = self.auth_service.authenticate_user(username, password)
            
            if success:
                self.show_status("Login successful!", False)
                # Store auth token and emit success signal
                self.auth_token = "authenticated_user_token"
                self.authentication_success.emit(self.auth_token)
                QTimer.singleShot(1000, self.accept)
            else:
                self.show_status("Invalid username or password")
                
        except Exception as e:
            self.show_status(f"Login error: {str(e)}")
        
        finally:
            self.login_button.setText("Sign In")
            self.login_button.setEnabled(True)
    def handle_register(self):
        """Handle registration (placeholder)."""
        self.show_status("Registration feature coming soon!", False)
    
    def handle_guest_mode(self):
        self.show_status("Registration feature coming soon!", False)
    def handle_guest_mode(self):
        """Handle guest mode."""
        self.show_status("Continuing as guest...", False)
        self.auth_token = "guest_mode"
        self.authentication_success.emit(self.auth_token)
        QTimer.singleShot(1000, self.accept)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    dialog = AuthDialog()
    dialog.show()
    sys.exit(app.exec_())
