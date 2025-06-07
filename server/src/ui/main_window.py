import sys
from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QStackedWidget,
    QFrame, QPushButton, QLabel, QScrollArea, QSplitter, QApplication
)
from PyQt5.QtCore import Qt, pyqtSignal, QTimer
from PyQt5.QtGui import QFont, QIcon
from src.utils.config import Config
from src.ui.styles import (
    get_main_window_style, get_sidebar_button_style, 
    get_button_style, get_label_style, DARK_COLORS
)
from src.ui.widgets.dashboard import DashboardWidget
from src.ui.widgets.voice_assistant import VoiceAssistantWidget
from src.ui.widgets.focus_mode import FocusModeWidget
from src.ui.widgets.scheduler import SchedulerWidget
from src.ui.widgets.chat_assistant import ChatAssistantWidget
from src.ui.widgets.settings import SettingsWidget

class MainWindow(QMainWindow):
    """Modern main window for Study Helper."""
    
    def __init__(self, auth_token=None):
        super().__init__()
        self.auth_token = auth_token
        self.current_page = "dashboard"
        self.setup_ui()
        self.setup_styles()
        self.setup_connections()
        
    def setup_ui(self):
        """Setup the user interface."""
        self.setWindowTitle(f"{Config.APP_NAME} v{Config.VERSION}")
        self.setGeometry(100, 100, Config.WINDOW_WIDTH, Config.WINDOW_HEIGHT)
        self.setMinimumSize(1000, 700)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Create splitter for resizable panels
        splitter = QSplitter(Qt.Horizontal)
        
        # Sidebar
        self.sidebar = self.create_sidebar()
        splitter.addWidget(self.sidebar)
        
        # Content area
        self.content_area = self.create_content_area()
        splitter.addWidget(self.content_area)
        
        # Set splitter sizes (sidebar : content = 1 : 4)
        splitter.setSizes([250, 1000])
        splitter.setCollapsible(0, False)  # Sidebar not collapsible
        splitter.setCollapsible(1, False)  # Content not collapsible
        
        main_layout.addWidget(splitter)
        
    def create_sidebar(self):
        """Create the sidebar with navigation."""
        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(250)
        
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(16, 24, 16, 24)
        layout.setSpacing(8)
        
        # App header
        header_layout = QVBoxLayout()
        header_layout.setSpacing(8)
        
        # App title
        app_title = QLabel("Study Helper")
        app_title.setObjectName("appTitle")
        
        # User info (if authenticated)
        if self.auth_token and self.auth_token != "guest_mode":
            user_label = QLabel("Welcome back!")
        else:
            user_label = QLabel("Guest Mode")
        user_label.setObjectName("userLabel")
        
        header_layout.addWidget(app_title)
        header_layout.addWidget(user_label)
        
        layout.addLayout(header_layout)
        layout.addSpacing(24)
        
        # Navigation buttons
        self.nav_buttons = {}
        nav_items = [
            ("dashboard", "📊", "Dashboard"),
            ("voice", "🎤", "Voice Assistant"),
            ("focus", "🎯", "Focus Mode"),
            ("scheduler", "📅", "Scheduler"),
            ("chat", "💬", "Chat Assistant"),
            ("settings", "⚙️", "Settings")
        ]
        
        for key, icon, text in nav_items:
            button = QPushButton(f"{icon}  {text}")
            button.setObjectName("navButton")
            button.setCheckable(True)
            button.clicked.connect(lambda checked, k=key: self.switch_page(k))
            self.nav_buttons[key] = button
            layout.addWidget(button)
        
        # Set dashboard as active by default
        self.nav_buttons["dashboard"].setChecked(True)
        
        layout.addStretch()
        
        # Footer
        footer_layout = QVBoxLayout()
        footer_layout.setSpacing(4)
        
        version_label = QLabel(f"v{Config.VERSION}")
        version_label.setObjectName("versionLabel")
        
        status_label = QLabel("🟢 Online" if self.auth_token != "guest_mode" else "🔸 Guest")
        status_label.setObjectName("statusLabel")
        
        footer_layout.addWidget(version_label)
        footer_layout.addWidget(status_label)
        
        layout.addLayout(footer_layout)
        
        return sidebar
    
    def create_content_area(self):
        """Create the main content area."""
        content_frame = QFrame()
        content_frame.setObjectName("content")
        
        layout = QVBoxLayout(content_frame)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(0)
        
        # Header bar
        header_bar = self.create_header_bar()
        layout.addWidget(header_bar)
        layout.addSpacing(24)
        
        # Stacked widget for different pages
        self.stacked_widget = QStackedWidget()
        
        # Create and add page widgets
        self.pages = {
            "dashboard": DashboardWidget(self.auth_token),
            "voice": VoiceAssistantWidget(),
            "focus": FocusModeWidget(),
            "scheduler": SchedulerWidget(),
            "chat": ChatAssistantWidget(),
            "settings": SettingsWidget()
        }
        
        for page_widget in self.pages.values():
            self.stacked_widget.addWidget(page_widget)
        
        layout.addWidget(self.stacked_widget)
        
        return content_frame
    
    def create_header_bar(self):
        """Create the header bar with title and actions."""
        header_frame = QFrame()
        header_layout = QHBoxLayout(header_frame)
        header_layout.setContentsMargins(0, 0, 0, 0)
        header_layout.setSpacing(16)
        
        # Page title
        self.page_title = QLabel("Dashboard")
        self.page_title.setObjectName("pageTitle")
        
        header_layout.addWidget(self.page_title)
        header_layout.addStretch()
        
        # Quick actions
        self.quick_focus_btn = QPushButton("🎯 Quick Focus")
        self.quick_focus_btn.setObjectName("quickActionBtn")
        self.quick_focus_btn.clicked.connect(lambda: self.switch_page("focus"))
        
        self.notifications_btn = QPushButton("🔔")
        self.notifications_btn.setObjectName("iconBtn")
        
        header_layout.addWidget(self.quick_focus_btn)
        header_layout.addWidget(self.notifications_btn)
        
        return header_frame
    
    def setup_styles(self):
        """Apply modern styling."""
        colors = DARK_COLORS
        
        # Main window style
        self.setStyleSheet(get_main_window_style('dark') + f"""
            
            /* Sidebar styles */
            QFrame#sidebar {{
                background-color: {colors['surface']};
                border-right: 1px solid {colors['border']};
            }}
            
            QLabel#appTitle {{
                color: {colors['text_primary']};
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 4px;
            }}
            
            QLabel#userLabel {{
                color: {colors['text_secondary']};
                font-size: 12px;
                font-weight: 400;
            }}
            
            QPushButton#navButton {{
                background-color: transparent;
                color: {colors['text_secondary']};
                border: none;
                border-radius: 8px;
                padding: 12px 16px;
                text-align: left;
                font-size: 14px;
                font-weight: 400;
                min-height: 20px;
            }}
            
            QPushButton#navButton:hover {{
                background-color: {colors['surface_hover']};
                color: {colors['text_primary']};
            }}
            
            QPushButton#navButton:checked {{
                background-color: {colors['primary']};
                color: #FFFFFF;
            }}
            
            QPushButton#navButton:checked:hover {{
                background-color: {colors['primary_hover']};
            }}
            
            QLabel#versionLabel, QLabel#statusLabel {{
                color: {colors['text_secondary']};
                font-size: 11px;
            }}
            
            /* Content area styles */
            QFrame#content {{
                background-color: {colors['background']};
            }}
            
            QLabel#pageTitle {{
                color: {colors['text_primary']};
                font-size: 28px;
                font-weight: 600;
            }}
            
            QPushButton#quickActionBtn {{
                background-color: {colors['primary']};
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 500;
            }}
            
            QPushButton#quickActionBtn:hover {{
                background-color: {colors['primary_hover']};
            }}
            
            QPushButton#iconBtn {{
                background-color: {colors['surface']};
                color: {colors['text_secondary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 14px;
                min-width: 20px;
            }}
            
            QPushButton#iconBtn:hover {{
                background-color: {colors['surface_hover']};
                color: {colors['text_primary']};
            }}
        """)
    
    def setup_connections(self):
        pass
    
    def switch_page(self, page_key):
        """Switch to a different page."""
        if page_key not in self.pages:
            return
        
        for key, button in self.nav_buttons.items():
            button.setChecked(key == page_key)
        
        titles = {
            "dashboard": "Dashboard",
            "voice": "Voice Assistant",
            "focus": "Focus Mode",
            "scheduler": "Scheduler",
            "chat": "Chat Assistant",
            "settings": "Settings"
        }
        self.page_title.setText(titles.get(page_key, "Unknown"))
        
        page_widget = self.pages[page_key]
        self.stacked_widget.setCurrentWidget(page_widget)
        self.current_page = page_key
        
        if hasattr(page_widget, 'refresh'):
            page_widget.refresh()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow("dummy_token")
    window.show()
    sys.exit(app.exec_())
