"""
Dashboard widget for Study Helper application.
"""
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QFrame, 
    QLabel, QPushButton, QProgressBar, QScrollArea
)
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QFont
from src.utils.config import Config
from src.ui.styles import DARK_COLORS, LIGHT_COLORS
import datetime

class DashboardWidget(QWidget):
    """Modern dashboard widget with overview cards and statistics."""
    
    def __init__(self, auth_token=None):
        super().__init__()
        self.auth_token = auth_token
        self.current_theme = "dark"  # Default theme
        self.setup_ui()
        self.setup_styles()
        self.load_data()
        
        # Auto-refresh timer
        self.refresh_timer = QTimer()
        self.refresh_timer.timeout.connect(self.refresh_data)
        self.refresh_timer.start(30000)  # Refresh every 30 seconds
    
    def update_theme(self, theme):
        """Update widget theme."""
        self.current_theme = theme
        self.setup_styles()
        
    def setup_ui(self):
        """Setup the user interface."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(24)
        
        # Welcome section
        welcome_section = self.create_welcome_section()
        layout.addWidget(welcome_section)
        
        # Stats cards
        stats_section = self.create_stats_section()
        layout.addWidget(stats_section)
        
        # Recent activity
        activity_section = self.create_activity_section()
        layout.addWidget(activity_section)
        
        layout.addStretch()
    
    def create_welcome_section(self):
        """Create welcome section with greeting and quick stats."""
        frame = QFrame()
        frame.setObjectName("welcomeCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(12)
        
        # Greeting
        current_time = datetime.datetime.now()
        if current_time.hour < 12:
            greeting = "Good morning!"
        elif current_time.hour < 17:
            greeting = "Good afternoon!"
        else:
            greeting = "Good evening!"
            
        greeting_label = QLabel(greeting)
        greeting_label.setObjectName("greeting")
        
        # Status message
        if self.auth_token == "guest_mode":
            status_msg = "You're using Study Helper in guest mode."
        else:
            status_msg = "Ready to boost your productivity?"
        
        status_label = QLabel(status_msg)
        status_label.setObjectName("statusMessage")
        
        # Today's date
        date_str = current_time.strftime("%A, %B %d, %Y")
        date_label = QLabel(date_str)
        date_label.setObjectName("dateLabel")
        
        layout.addWidget(greeting_label)
        layout.addWidget(status_label)
        layout.addWidget(date_label)
        
        return frame
    
    def create_stats_section(self):
        """Create statistics cards section."""
        frame = QFrame()
        layout = QGridLayout(frame)
        layout.setSpacing(16)
        
        # Stats data (placeholder - would come from database)
        stats = [
            {"title": "Study Sessions Today", "value": "3", "subtitle": "+2 vs yesterday", "color": "primary"},
            {"title": "Focus Time", "value": "2h 45m", "subtitle": "This session", "color": "success"},
            {"title": "Tasks Completed", "value": "7", "subtitle": "This week", "color": "warning"},
            {"title": "Streak", "value": "12 days", "subtitle": "Keep it up!", "color": "primary"}
        ]
        
        for i, stat in enumerate(stats):
            card = self.create_stat_card(stat)
            row = i // 2
            col = i % 2
            layout.addWidget(card, row, col)
        
        return frame
    
    def create_stat_card(self, stat_data):
        """Create a single statistics card."""
        card = QFrame()
        card.setObjectName("statCard")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(8)
        
        # Value
        value_label = QLabel(stat_data["value"])
        value_label.setObjectName("statValue")
        
        # Title
        title_label = QLabel(stat_data["title"])
        title_label.setObjectName("statTitle")
        
        # Subtitle
        subtitle_label = QLabel(stat_data["subtitle"])
        subtitle_label.setObjectName("statSubtitle")
        
        layout.addWidget(value_label)
        layout.addWidget(title_label)
        layout.addWidget(subtitle_label)
        
        return card
    
    def create_activity_section(self):
        """Create recent activity section."""
        frame = QFrame()
        frame.setObjectName("activityCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)
        
        # Header
        header_layout = QHBoxLayout()
        
        title_label = QLabel("Recent Activity")
        title_label.setObjectName("sectionTitle")
        
        view_all_btn = QPushButton("View All")
        view_all_btn.setObjectName("linkButton")
        
        header_layout.addWidget(title_label)
        header_layout.addStretch()
        header_layout.addWidget(view_all_btn)
        
        # Activity list
        activities = [
            {"icon": "🎯", "text": "Started focus session", "time": "2 minutes ago"},
            {"icon": "✅", "text": "Completed Math homework", "time": "1 hour ago"},
            {"icon": "📝", "text": "Added new study schedule", "time": "3 hours ago"},
            {"icon": "💬", "text": "Used chat assistant", "time": "5 hours ago"},
        ]
        
        for activity in activities:
            activity_item = self.create_activity_item(activity)
            layout.addWidget(activity_item)
        
        layout.insertLayout(0, header_layout)
        
        return frame
    
    def create_activity_item(self, activity_data):
        """Create a single activity item."""
        item_frame = QFrame()
        layout = QHBoxLayout(item_frame)
        layout.setContentsMargins(0, 8, 0, 8)
        layout.setSpacing(12)
        
        # Icon
        icon_label = QLabel(activity_data["icon"])
        icon_label.setObjectName("activityIcon")
        
        # Text
        text_label = QLabel(activity_data["text"])
        text_label.setObjectName("activityText")
        
        # Time
        time_label = QLabel(activity_data["time"])
        time_label.setObjectName("activityTime")
        
        layout.addWidget(icon_label)
        layout.addWidget(text_label)
        layout.addStretch()
        layout.addWidget(time_label)
        
        return item_frame
    
    def setup_styles(self):
        """Apply styling to the dashboard."""
        colors = DARK_COLORS if self.current_theme == "dark" else LIGHT_COLORS
        
        self.setStyleSheet(f"""
            QFrame#welcomeCard, QFrame#activityCard {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
            }}
            
            QFrame#statCard {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
                min-height: 120px;
            }}
            
            QFrame#statCard:hover {{
                background-color: {colors['surface_hover']};
                border-color: {colors['border_light']};
            }}
            
            QLabel#greeting {{
                color: {colors['text_primary']};
                font-size: 24px;
                font-weight: 600;
            }}
            
            QLabel#statusMessage {{
                color: {colors['text_secondary']};
                font-size: 16px;
                font-weight: 400;
            }}
            
            QLabel#dateLabel {{
                color: {colors['text_secondary']};
                font-size: 14px;
                font-weight: 400;
            }}
            
            QLabel#statValue {{
                color: {colors['primary']};
                font-size: 32px;
                font-weight: 700;
            }}
            
            QLabel#statTitle {{
                color: {colors['text_primary']};
                font-size: 14px;
                font-weight: 500;
            }}
            
            QLabel#statSubtitle {{
                color: {colors['text_secondary']};
                font-size: 12px;
                font-weight: 400;
            }}
            
            QLabel#sectionTitle {{
                color: {colors['text_primary']};
                font-size: 18px;
                font-weight: 600;
            }}
            
            QPushButton#linkButton {{
                background-color: transparent;
                color: {colors['primary']};
                border: none;
                font-size: 14px;
                font-weight: 500;
                padding: 4px 8px;
            }}
            
            QPushButton#linkButton:hover {{
                color: {colors['primary_hover']};
                text-decoration: underline;
            }}
            
            QLabel#activityIcon {{
                color: {colors['text_secondary']};
                font-size: 16px;
                min-width: 24px;
            }}
            
            QLabel#activityText {{
                color: {colors['text_primary']};
                font-size: 14px;
                font-weight: 400;
            }}
            
            QLabel#activityTime {{
                color: {colors['text_secondary']};
                font-size: 12px;
                font-weight: 400;
            }}
        """)
    
    def load_data(self):
        """Load dashboard data."""
        # In a real app, this would fetch data from the database
        pass
    
    def refresh_data(self):
        """Refresh dashboard data."""
        # Update any dynamic content
        pass
    
    def refresh(self):
        """Public method to refresh the dashboard."""
        self.refresh_data()
