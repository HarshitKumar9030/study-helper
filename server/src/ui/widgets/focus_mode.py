"""
Focus Mode widget for Study Helper application.
"""
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QFrame, QLabel, 
    QPushButton, QListWidget, QListWidgetItem, QLineEdit, QComboBox,
    QSpinBox, QCheckBox, QProgressBar, QTextEdit
)
from PyQt5.QtCore import Qt, QTimer, pyqtSignal
from PyQt5.QtGui import QFont
from src.features.focus_mode import FocusMode
from src.utils.config import Config
from src.ui.styles import DARK_COLORS
import datetime

class FocusModeWidget(QWidget):
    """Focus mode interface widget."""
    
    def __init__(self):
        super().__init__()
        self.focus_mode = FocusMode()
        self.session_timer = QTimer()
        self.session_timer.timeout.connect(self.update_timer)
        self.session_time = 0
        self.setup_ui()
        self.setup_styles()
        self.load_blocked_sites()
        
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
        
        # Left panel - Timer and controls
        controls_panel = self.create_controls_panel()
        content_layout.addWidget(controls_panel, 1)
        
        # Right panel - Blocked sites management
        sites_panel = self.create_sites_panel()
        content_layout.addWidget(sites_panel, 1)
        
        layout.addLayout(content_layout)
        
    def create_header(self):
        """Create the header section."""
        frame = QFrame()
        frame.setObjectName("headerCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(8)
        
        title_label = QLabel("🎯 Focus Mode")
        title_label.setObjectName("headerTitle")
        
        subtitle_label = QLabel("Block distractions and stay focused on your goals")
        subtitle_label.setObjectName("headerSubtitle")
        
        layout.addWidget(title_label)
        layout.addWidget(subtitle_label)
        
        return frame
    
    def create_controls_panel(self):
        """Create the focus controls panel."""
        frame = QFrame()
        frame.setObjectName("controlsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(20)
        
        # Timer section
        timer_section = self.create_timer_section()
        layout.addWidget(timer_section)
        
        # Session settings
        settings_section = self.create_settings_section()
        layout.addWidget(settings_section)
        
        # Control buttons
        buttons_section = self.create_buttons_section()
        layout.addWidget(buttons_section)
        
        # Status
        self.status_label = QLabel("Focus mode is off")
        self.status_label.setObjectName("statusLabel")
        self.status_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.status_label)
        
        layout.addStretch()
        
        return frame
    
    def create_timer_section(self):
        """Create the timer display section."""
        frame = QFrame()
        frame.setObjectName("timerFrame")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(8)
        
        # Timer display
        self.timer_display = QLabel("00:00:00")
        self.timer_display.setObjectName("timerDisplay")
        self.timer_display.setAlignment(Qt.AlignCenter)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setObjectName("timerProgress")
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setMaximum(100)
        
        layout.addWidget(self.timer_display)
        layout.addWidget(self.progress_bar)
        
        return frame
    
    def create_settings_section(self):
        """Create the session settings section."""
        frame = QFrame()
        layout = QVBoxLayout(frame)
        layout.setSpacing(12)
        
        title_label = QLabel("Session Settings")
        title_label.setObjectName("sectionTitle")
        
        # Duration setting
        duration_layout = QHBoxLayout()
        duration_label = QLabel("Duration:")
        duration_label.setObjectName("settingLabel")
        
        self.duration_spinbox = QSpinBox()
        self.duration_spinbox.setObjectName("settingSpinbox")
        self.duration_spinbox.setRange(1, 480)  # 1 minute to 8 hours
        self.duration_spinbox.setValue(25)  # Default Pomodoro
        self.duration_spinbox.setSuffix(" min")
        
        duration_layout.addWidget(duration_label)
        duration_layout.addStretch()
        duration_layout.addWidget(self.duration_spinbox)
        
        # Break setting
        break_layout = QHBoxLayout()
        break_label = QLabel("Break after:")
        break_label.setObjectName("settingLabel")
        
        self.break_spinbox = QSpinBox()
        self.break_spinbox.setObjectName("settingSpinbox")
        self.break_spinbox.setRange(1, 60)
        self.break_spinbox.setValue(5)
        self.break_spinbox.setSuffix(" min")
        
        break_layout.addWidget(break_label)
        break_layout.addStretch()
        break_layout.addWidget(self.break_spinbox)
        
        # Strict mode
        self.strict_mode_checkbox = QCheckBox("Strict mode (harder to disable)")
        self.strict_mode_checkbox.setObjectName("settingCheckbox")
        
        layout.addWidget(title_label)
        layout.addLayout(duration_layout)
        layout.addLayout(break_layout)
        layout.addWidget(self.strict_mode_checkbox)
        
        return frame
    
    def create_buttons_section(self):
        """Create the control buttons section."""
        frame = QFrame()
        layout = QVBoxLayout(frame)
        layout.setSpacing(12)
        
        # Main control button
        self.main_button = QPushButton("🎯 Start Focus Session")
        self.main_button.setObjectName("primaryButton")
        self.main_button.clicked.connect(self.toggle_focus_mode)
        
        # Secondary buttons
        secondary_layout = QHBoxLayout()
        
        self.pause_button = QPushButton("⏸️ Pause")
        self.pause_button.setObjectName("secondaryButton")
        self.pause_button.clicked.connect(self.pause_session)
        self.pause_button.setEnabled(False)
        
        self.reset_button = QPushButton("🔄 Reset")
        self.reset_button.setObjectName("secondaryButton")
        self.reset_button.clicked.connect(self.reset_session)
        
        secondary_layout.addWidget(self.pause_button)
        secondary_layout.addWidget(self.reset_button)
        
        layout.addWidget(self.main_button)
        layout.addLayout(secondary_layout)
        
        return frame
    
    def create_sites_panel(self):
        """Create the blocked sites management panel."""
        frame = QFrame()
        frame.setObjectName("sitesCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)
        
        # Header
        header_layout = QHBoxLayout()
        
        title_label = QLabel("Blocked Sites")
        title_label.setObjectName("sectionTitle")
        
        add_button = QPushButton("+ Add Site")
        add_button.setObjectName("addButton")
        add_button.clicked.connect(self.add_blocked_site)
        
        header_layout.addWidget(title_label)
        header_layout.addStretch()
        header_layout.addWidget(add_button)
        
        # Add site input
        input_layout = QHBoxLayout()
        
        self.site_input = QLineEdit()
        self.site_input.setObjectName("siteInput")
        self.site_input.setPlaceholderText("Enter website URL (e.g., facebook.com)")
        self.site_input.returnPressed.connect(self.add_blocked_site)
        
        input_layout.addWidget(self.site_input)
        
        # Sites list
        self.sites_list = QListWidget()
        self.sites_list.setObjectName("sitesList")
        
        # Presets section
        presets_layout = QHBoxLayout()
        
        presets_label = QLabel("Quick presets:")
        presets_label.setObjectName("presetsLabel")
        
        social_preset_btn = QPushButton("Social Media")
        social_preset_btn.setObjectName("presetButton")
        social_preset_btn.clicked.connect(lambda: self.add_preset("social"))
        
        entertainment_preset_btn = QPushButton("Entertainment")
        entertainment_preset_btn.setObjectName("presetButton")
        entertainment_preset_btn.clicked.connect(lambda: self.add_preset("entertainment"))
        
        presets_layout.addWidget(presets_label)
        presets_layout.addWidget(social_preset_btn)
        presets_layout.addWidget(entertainment_preset_btn)
        presets_layout.addStretch()
        
        layout.addLayout(header_layout)
        layout.addLayout(input_layout)
        layout.addWidget(self.sites_list)
        layout.addLayout(presets_layout)
        
        return frame
    
    def setup_styles(self):
        """Apply styling to the focus mode widget."""
        colors = DARK_COLORS

        self.setStyleSheet(f"""
            QFrame#headerCard, QFrame#controlsCard, QFrame#sitesCard {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
            }}
            
            QFrame#timerFrame {{
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
            
            QLabel#timerDisplay {{
                color: {colors['primary']};
                font-size: 36px;
                font-weight: 700;
                font-family: 'Consolas', 'Monaco', monospace;
            }}
            
            QProgressBar#timerProgress {{
                background-color: {colors['border']};
                border: none;
                border-radius: 4px;
                height: 8px;
            }}
            
            QProgressBar#timerProgress::chunk {{
                background-color: {colors['primary']};
                border-radius: 4px;
            }}
            
            QLabel#sectionTitle {{
                color: {colors['text_primary']};
                font-size: 16px;
                font-weight: 600;
            }}
            
            QLabel#settingLabel, QLabel#presetsLabel {{
                color: {colors['text_primary']};
                font-size: 14px;
                font-weight: 400;
            }}
            
            QSpinBox#settingSpinbox {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 14px;
                min-width: 80px;
            }}
            
            QCheckBox#settingCheckbox {{
                color: {colors['text_primary']};
                font-size: 14px;
                spacing: 8px;
            }}
            
            QCheckBox#settingCheckbox::indicator {{
                width: 16px;
                height: 16px;
                border: 1px solid {colors['border']};
                border-radius: 3px;
                background-color: {colors['background']};
            }}
            
            QCheckBox#settingCheckbox::indicator:checked {{
                background-color: {colors['primary']};
                border-color: {colors['primary']};
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
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                min-height: 20px;
            }}
            
            QPushButton#secondaryButton:hover {{
                background-color: {colors['surface_hover']};
            }}
            
            QPushButton#addButton, QPushButton#presetButton {{
                background-color: {colors['success']};
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: 500;
            }}
            
            QPushButton#addButton:hover, QPushButton#presetButton:hover {{
                background-color: #059669;
            }}
            
            QLineEdit#siteInput {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 10px 12px;
                font-size: 14px;
            }}
            
            QLineEdit#siteInput:focus {{
                border-color: {colors['primary']};
            }}
            
            QListWidget#sitesList {{
                background-color: {colors['background']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 8px;
                outline: none;
            }}
            
            QListWidget#sitesList::item {{
                background-color: transparent;
                color: {colors['text_primary']};
                padding: 8px 12px;
                border-radius: 6px;
                margin: 2px 0;
            }}
            
            QListWidget#sitesList::item:hover {{
                background-color: {colors['surface_hover']};
            }}
            
            QListWidget#sitesList::item:selected {{
                background-color: {colors['error']};
                color: #FFFFFF;
            }}
            
            QLabel#statusLabel {{
                color: {colors['text_secondary']};
                font-size: 14px;
                font-weight: 500;
                padding: 8px;
                border-radius: 6px;
                background-color: {colors['background']};
            }}
        """)
    
    def load_blocked_sites(self):
        """Load blocked sites from config."""
        sites = Config.BLOCKED_SITES
        for site in sites:
            if site.strip():
                item = QListWidgetItem(f"🚫 {site.strip()}")
                self.sites_list.addItem(item)
    
    def add_blocked_site(self):
        """Add a new site to the blocked list."""
        site = self.site_input.text().strip()
        if site:
            # Remove protocol if present
            site = site.replace('https://', '').replace('http://', '').replace('www.', '')
            
            item = QListWidgetItem(f"🚫 {site}")
            self.sites_list.addItem(item)
            self.site_input.clear()
            
            # Add to focus mode
            self.focus_mode.add_blocked_site(site)
    
    def add_preset(self, preset_type):
        """Add preset sites."""
        presets = {
            'social': ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'snapchat.com'],
            'entertainment': ['youtube.com', 'netflix.com', 'hulu.com', 'disney.com', 'twitch.tv']
        }
        
        if preset_type in presets:
            for site in presets[preset_type]:
                # Check if already exists
                existing_items = [self.sites_list.item(i).text() for i in range(self.sites_list.count())]
                if f"🚫 {site}" not in existing_items:
                    item = QListWidgetItem(f"🚫 {site}")
                    self.sites_list.addItem(item)
                    self.focus_mode.add_blocked_site(site)
    
    def toggle_focus_mode(self):
        """Toggle focus mode on/off."""
        if self.focus_mode.is_active:
            self.stop_focus_mode()
        else:
            self.start_focus_mode()
    
    def start_focus_mode(self):
        """Start focus mode session."""
        duration_minutes = self.duration_spinbox.value()
        self.session_time = duration_minutes * 60  # Convert to seconds
        
        # Update blocked sites list
        sites = []
        for i in range(self.sites_list.count()):
            item_text = self.sites_list.item(i).text()
            site = item_text.replace('🚫 ', '')
            sites.append(site)
        
        try:
            success = self.focus_mode.start_session(sites, duration_minutes)
            if success:
                self.main_button.setText("🛑 Stop Focus Mode")
                self.main_button.setObjectName("warningButton")
                self.pause_button.setEnabled(True)
                self.status_label.setText(f"Focus mode active - {duration_minutes} minutes")
                self.status_label.setStyleSheet(f"color: {DARK_COLORS['success']};")
                
                # Start timer
                self.session_timer.start(1000)  # Update every second
                self.progress_bar.setMaximum(self.session_time)
                
                # Reapply styles to update button color
                self.setup_styles()
            else:
                self.status_label.setText("Failed to start focus mode")
                self.status_label.setStyleSheet(f"color: {DARK_COLORS['error']};")
        except Exception as e:
            self.status_label.setText(f"Error: {str(e)}")
            self.status_label.setStyleSheet(f"color: {DARK_COLORS['error']};")
    
    def stop_focus_mode(self):
        """Stop focus mode session."""
        self.focus_mode.stop_session()
        self.session_timer.stop()
        
        self.main_button.setText("🎯 Start Focus Session")
        self.main_button.setObjectName("primaryButton")
        self.pause_button.setEnabled(False)
        self.status_label.setText("Focus mode is off")
        self.status_label.setStyleSheet(f"color: {DARK_COLORS['text_secondary']};")
        
        self.timer_display.setText("00:00:00")
        self.progress_bar.setValue(0)
        
        # Reapply styles
        self.setup_styles()
    
    def pause_session(self):
        """Pause/resume the current session."""
        if self.session_timer.isActive():
            self.session_timer.stop()
            self.pause_button.setText("▶️ Resume")
            self.status_label.setText("Session paused")
        else:
            self.session_timer.start(1000)
            self.pause_button.setText("⏸️ Pause")
            self.status_label.setText("Focus mode active")
    
    def reset_session(self):
        """Reset the current session."""
        if self.focus_mode.is_active:
            self.stop_focus_mode()
        
        duration_minutes = self.duration_spinbox.value()
        self.session_time = duration_minutes * 60
        self.timer_display.setText("00:00:00")
        self.progress_bar.setValue(0)
    
    def update_timer(self):
        """Update the timer display."""
        if self.session_time > 0:
            self.session_time -= 1
            
            # Update display
            hours = self.session_time // 3600
            minutes = (self.session_time % 3600) // 60
            seconds = self.session_time % 60
            
            time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
            self.timer_display.setText(time_str)
            
            # Update progress
            total_time = self.duration_spinbox.value() * 60
            progress = total_time - self.session_time
            self.progress_bar.setValue(progress)
            
            if self.session_time == 0:
                self.session_completed()
    
    def session_completed(self):
        """Handle session completion."""
        self.stop_focus_mode()
        self.status_label.setText("Session completed! Great job! 🎉")
        self.status_label.setStyleSheet(f"color: {DARK_COLORS['success']};")
        
        # Show break suggestion
        break_minutes = self.break_spinbox.value()
        # Could add break timer here
    
    def keyPressEvent(self, event):
        """Handle key press events."""
        if event.key() == Qt.Key_Delete and self.sites_list.currentItem():
            # Remove selected site
            current_row = self.sites_list.currentRow()
            if current_row >= 0:
                item = self.sites_list.takeItem(current_row)
                if item:
                    site = item.text().replace('🚫 ', '')
                    self.focus_mode.remove_blocked_site(site)
        
        super().keyPressEvent(event)
