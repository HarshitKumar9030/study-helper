"""
Settings widget for Study Helper application.
"""
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QFrame, QLabel, 
    QPushButton, QLineEdit, QSpinBox, QCheckBox, QComboBox, QSlider,
    QTextEdit, QListWidget, QListWidgetItem, QTabWidget, QScrollArea
)
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QFont
from src.utils.config import Config
from src.ui.styles import DARK_COLORS

class SettingsWidget(QWidget):
    """Settings interface widget."""
    
    settings_changed = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.setup_ui()
        self.setup_styles()
        self.load_settings()
        
    def setup_ui(self):
        """Setup the user interface."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(24)
        
        # Header
        header_frame = self.create_header()
        layout.addWidget(header_frame)
        
        # Settings tabs
        self.tabs = QTabWidget()
        self.tabs.setObjectName("settingsTabs")
        
        # Add tabs
        self.tabs.addTab(self.create_general_tab(), "⚙️ General")
        self.tabs.addTab(self.create_voice_tab(), "🎤 Voice")
        self.tabs.addTab(self.create_focus_tab(), "🎯 Focus Mode")
        self.tabs.addTab(self.create_appearance_tab(), "🎨 Appearance")
        self.tabs.addTab(self.create_advanced_tab(), "🔧 Advanced")
        
        layout.addWidget(self.tabs)
        
    def create_header(self):
        """Create the header section."""
        frame = QFrame()
        frame.setObjectName("headerCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(8)
        
        title_label = QLabel("⚙️ Settings")
        title_label.setObjectName("headerTitle")
        
        subtitle_label = QLabel("Customize your Study Helper experience")
        subtitle_label.setObjectName("headerSubtitle")
        
        layout.addWidget(title_label)
        layout.addWidget(subtitle_label)
        
        return frame
    
    def create_general_tab(self):
        """Create general settings tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(24)
        
        # App settings
        app_section = self.create_app_settings()
        layout.addWidget(app_section)
        
        # Notifications
        notifications_section = self.create_notifications_settings()
        layout.addWidget(notifications_section)
        
        # Data and privacy
        data_section = self.create_data_settings()
        layout.addWidget(data_section)
        
        layout.addStretch()
        
        return widget
    
    def create_voice_tab(self):
        """Create voice settings tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(24)
        
        # Voice recognition
        recognition_section = self.create_voice_recognition_settings()
        layout.addWidget(recognition_section)
        
        # Text-to-speech
        tts_section = self.create_tts_settings()
        layout.addWidget(tts_section)
        
        layout.addStretch()
        
        return widget
    
    def create_focus_tab(self):
        """Create focus mode settings tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(24)
        
        # Focus mode settings
        focus_section = self.create_focus_mode_settings()
        layout.addWidget(focus_section)
        
        # Blocked sites management
        sites_section = self.create_blocked_sites_settings()
        layout.addWidget(sites_section)
        
        layout.addStretch()
        
        return widget
    
    def create_appearance_tab(self):
        """Create appearance settings tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(24)
        
        # Theme settings
        theme_section = self.create_theme_settings()
        layout.addWidget(theme_section)
        
        # UI customization
        ui_section = self.create_ui_settings()
        layout.addWidget(ui_section)
        
        layout.addStretch()
        
        return widget
    
    def create_advanced_tab(self):
        """Create advanced settings tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(24)
        
        # API settings
        api_section = self.create_api_settings()
        layout.addWidget(api_section)
        
        # Debug settings
        debug_section = self.create_debug_settings()
        layout.addWidget(debug_section)
        
        layout.addStretch()
        
        return widget
    
    def create_app_settings(self):
        """Create app settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Application Settings")
        title_label.setObjectName("sectionTitle")
        
        # Auto-start
        self.autostart_checkbox = QCheckBox("Start with system")
        self.autostart_checkbox.setObjectName("settingCheckbox")
        
        # Minimize to tray
        self.minimize_tray_checkbox = QCheckBox("Minimize to system tray")
        self.minimize_tray_checkbox.setObjectName("settingCheckbox")
        
        # Auto-save interval
        autosave_layout = QHBoxLayout()
        autosave_label = QLabel("Auto-save interval:")
        autosave_label.setObjectName("settingLabel")
        
        self.autosave_spinbox = QSpinBox()
        self.autosave_spinbox.setObjectName("settingSpinbox")
        self.autosave_spinbox.setRange(1, 60)
        self.autosave_spinbox.setValue(5)
        self.autosave_spinbox.setSuffix(" minutes")
        
        autosave_layout.addWidget(autosave_label)
        autosave_layout.addStretch()
        autosave_layout.addWidget(self.autosave_spinbox)
        
        layout.addWidget(title_label)
        layout.addWidget(self.autostart_checkbox)
        layout.addWidget(self.minimize_tray_checkbox)
        layout.addLayout(autosave_layout)
        
        return frame
    
    def create_notifications_settings(self):
        """Create notifications settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Notifications")
        title_label.setObjectName("sectionTitle")
        
        # Enable notifications
        self.notifications_checkbox = QCheckBox("Enable notifications")
        self.notifications_checkbox.setObjectName("settingCheckbox")
        self.notifications_checkbox.setChecked(True)
        
        # Session reminders
        self.session_reminders_checkbox = QCheckBox("Session start/end reminders")
        self.session_reminders_checkbox.setObjectName("settingCheckbox")
        self.session_reminders_checkbox.setChecked(True)
        
        # Break reminders
        self.break_reminders_checkbox = QCheckBox("Break reminders")
        self.break_reminders_checkbox.setObjectName("settingCheckbox")
        self.break_reminders_checkbox.setChecked(True)
        
        layout.addWidget(title_label)
        layout.addWidget(self.notifications_checkbox)
        layout.addWidget(self.session_reminders_checkbox)
        layout.addWidget(self.break_reminders_checkbox)
        
        return frame
    
    def create_data_settings(self):
        """Create data and privacy settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Data & Privacy")
        title_label.setObjectName("sectionTitle")
        
        # Data collection
        self.analytics_checkbox = QCheckBox("Send anonymous usage analytics")
        self.analytics_checkbox.setObjectName("settingCheckbox")
        
        # Export/Import buttons
        buttons_layout = QHBoxLayout()
        
        export_button = QPushButton("Export Data")
        export_button.setObjectName("secondaryButton")
        
        import_button = QPushButton("Import Data")
        import_button.setObjectName("secondaryButton")
        
        clear_data_button = QPushButton("Clear All Data")
        clear_data_button.setObjectName("warningButton")
        
        buttons_layout.addWidget(export_button)
        buttons_layout.addWidget(import_button)
        buttons_layout.addWidget(clear_data_button)
        buttons_layout.addStretch()
        
        layout.addWidget(title_label)
        layout.addWidget(self.analytics_checkbox)
        layout.addLayout(buttons_layout)
        
        return frame
    
    def create_voice_recognition_settings(self):
        """Create voice recognition settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Voice Recognition")
        title_label.setObjectName("sectionTitle")
        
        # Enable voice
        self.voice_enabled_checkbox = QCheckBox("Enable voice recognition")
        self.voice_enabled_checkbox.setObjectName("settingCheckbox")
        self.voice_enabled_checkbox.setChecked(Config.VOICE_ENABLED)
        
        # Microphone sensitivity
        sensitivity_layout = QVBoxLayout()
        sensitivity_label = QLabel("Microphone sensitivity:")
        sensitivity_label.setObjectName("settingLabel")
        
        self.sensitivity_slider = QSlider(Qt.Horizontal)
        self.sensitivity_slider.setObjectName("settingSlider")
        self.sensitivity_slider.setRange(1, 10)
        self.sensitivity_slider.setValue(5)
        
        sensitivity_layout.addWidget(sensitivity_label)
        sensitivity_layout.addWidget(self.sensitivity_slider)
        
        # Test microphone button
        test_mic_button = QPushButton("Test Microphone")
        test_mic_button.setObjectName("secondaryButton")
        
        layout.addWidget(title_label)
        layout.addWidget(self.voice_enabled_checkbox)
        layout.addLayout(sensitivity_layout)
        layout.addWidget(test_mic_button)
        
        return frame
    
    def create_tts_settings(self):
        """Create text-to-speech settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Text-to-Speech")
        title_label.setObjectName("sectionTitle")
        
        # Voice rate
        rate_layout = QHBoxLayout()
        rate_label = QLabel("Speech rate:")
        rate_label.setObjectName("settingLabel")
        
        self.voice_rate_spinbox = QSpinBox()
        self.voice_rate_spinbox.setObjectName("settingSpinbox")
        self.voice_rate_spinbox.setRange(50, 300)
        self.voice_rate_spinbox.setValue(Config.VOICE_RATE)
        self.voice_rate_spinbox.setSuffix(" WPM")
        
        rate_layout.addWidget(rate_label)
        rate_layout.addStretch()
        rate_layout.addWidget(self.voice_rate_spinbox)
        
        # Voice volume
        volume_layout = QVBoxLayout()
        volume_label = QLabel("Volume:")
        volume_label.setObjectName("settingLabel")
        
        self.volume_slider = QSlider(Qt.Horizontal)
        self.volume_slider.setObjectName("settingSlider")
        self.volume_slider.setRange(0, 100)
        self.volume_slider.setValue(int(Config.VOICE_VOLUME * 100))
        
        volume_layout.addWidget(volume_label)
        volume_layout.addWidget(self.volume_slider)
        
        # Test speech button
        test_speech_button = QPushButton("Test Speech")
        test_speech_button.setObjectName("secondaryButton")
        
        layout.addWidget(title_label)
        layout.addLayout(rate_layout)
        layout.addLayout(volume_layout)
        layout.addWidget(test_speech_button)
        
        return frame
    
    def create_focus_mode_settings(self):
        """Create focus mode settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Focus Mode Settings")
        title_label.setObjectName("sectionTitle")
        
        # Default duration
        duration_layout = QHBoxLayout()
        duration_label = QLabel("Default session duration:")
        duration_label.setObjectName("settingLabel")
        
        self.default_duration_spinbox = QSpinBox()
        self.default_duration_spinbox.setObjectName("settingSpinbox")
        self.default_duration_spinbox.setRange(5, 480)
        self.default_duration_spinbox.setValue(25)
        self.default_duration_spinbox.setSuffix(" minutes")
        
        duration_layout.addWidget(duration_label)
        duration_layout.addStretch()
        duration_layout.addWidget(self.default_duration_spinbox)
        
        # Default break
        break_layout = QHBoxLayout()
        break_label = QLabel("Default break duration:")
        break_label.setObjectName("settingLabel")
        
        self.default_break_spinbox = QSpinBox()
        self.default_break_spinbox.setObjectName("settingSpinbox")
        self.default_break_spinbox.setRange(1, 60)
        self.default_break_spinbox.setValue(5)
        self.default_break_spinbox.setSuffix(" minutes")
        
        break_layout.addWidget(break_label)
        break_layout.addStretch()
        break_layout.addWidget(self.default_break_spinbox)
        
        # Strict mode
        self.strict_mode_checkbox = QCheckBox("Enable strict mode by default")
        self.strict_mode_checkbox.setObjectName("settingCheckbox")
        
        layout.addWidget(title_label)
        layout.addLayout(duration_layout)
        layout.addLayout(break_layout)
        layout.addWidget(self.strict_mode_checkbox)
        
        return frame
    
    def create_blocked_sites_settings(self):
        """Create blocked sites settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Default Blocked Sites")
        title_label.setObjectName("sectionTitle")
        
        # Sites list
        self.blocked_sites_list = QListWidget()
        self.blocked_sites_list.setObjectName("settingsList")
        self.blocked_sites_list.setMaximumHeight(150)
        
        # Add/remove buttons
        buttons_layout = QHBoxLayout()
        
        add_site_button = QPushButton("+ Add Site")
        add_site_button.setObjectName("addButton")
        
        remove_site_button = QPushButton("- Remove Site")
        remove_site_button.setObjectName("removeButton")
        
        reset_defaults_button = QPushButton("Reset to Defaults")
        reset_defaults_button.setObjectName("secondaryButton")
        
        buttons_layout.addWidget(add_site_button)
        buttons_layout.addWidget(remove_site_button)
        buttons_layout.addWidget(reset_defaults_button)
        buttons_layout.addStretch()
        
        layout.addWidget(title_label)
        layout.addWidget(self.blocked_sites_list)
        layout.addLayout(buttons_layout)
        
        return frame
    
    def create_theme_settings(self):
        """Create theme settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Theme & Colors")
        title_label.setObjectName("sectionTitle")
        
        # Theme selection
        theme_layout = QHBoxLayout()
        theme_label = QLabel("Theme:")
        theme_label.setObjectName("settingLabel")
        
        self.theme_combo = QComboBox()
        self.theme_combo.setObjectName("settingCombo")
        self.theme_combo.addItems(["Dark", "Light", "Auto"])
        self.theme_combo.setCurrentText("Dark")
        
        theme_layout.addWidget(theme_label)
        theme_layout.addStretch()
        theme_layout.addWidget(self.theme_combo)
        
        # Accent color (placeholder)
        accent_layout = QHBoxLayout()
        accent_label = QLabel("Accent color:")
        accent_label.setObjectName("settingLabel")
        
        accent_button = QPushButton("🔵 Blue")
        accent_button.setObjectName("colorButton")
        
        accent_layout.addWidget(accent_label)
        accent_layout.addStretch()
        accent_layout.addWidget(accent_button)
        
        layout.addWidget(title_label)
        layout.addLayout(theme_layout)
        layout.addLayout(accent_layout)
        
        return frame
    
    def create_ui_settings(self):
        """Create UI settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Interface")
        title_label.setObjectName("sectionTitle")
        
        # Window size
        size_layout = QGridLayout()
        
        width_label = QLabel("Window width:")
        width_label.setObjectName("settingLabel")
        
        self.window_width_spinbox = QSpinBox()
        self.window_width_spinbox.setObjectName("settingSpinbox")
        self.window_width_spinbox.setRange(800, 2560)
        self.window_width_spinbox.setValue(Config.WINDOW_WIDTH)
        
        height_label = QLabel("Window height:")
        height_label.setObjectName("settingLabel")
        
        self.window_height_spinbox = QSpinBox()
        self.window_height_spinbox.setObjectName("settingSpinbox")
        self.window_height_spinbox.setRange(600, 1440)
        self.window_height_spinbox.setValue(Config.WINDOW_HEIGHT)
        
        size_layout.addWidget(width_label, 0, 0)
        size_layout.addWidget(self.window_width_spinbox, 0, 1)
        size_layout.addWidget(height_label, 1, 0)
        size_layout.addWidget(self.window_height_spinbox, 1, 1)
        
        # UI options
        self.animations_checkbox = QCheckBox("Enable animations")
        self.animations_checkbox.setObjectName("settingCheckbox")
        self.animations_checkbox.setChecked(True)
        
        layout.addWidget(title_label)
        layout.addLayout(size_layout)
        layout.addWidget(self.animations_checkbox)
        
        return frame
    
    def create_api_settings(self):
        """Create API settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("API Configuration")
        title_label.setObjectName("sectionTitle")
        
        # Google AI API Key
        api_key_layout = QVBoxLayout()
        api_key_label = QLabel("Google AI API Key:")
        api_key_label.setObjectName("settingLabel")
        
        self.api_key_input = QLineEdit()
        self.api_key_input.setObjectName("settingInput")
        self.api_key_input.setPlaceholderText("Enter your Google AI API key...")
        self.api_key_input.setEchoMode(QLineEdit.Password)
        
        api_key_layout.addWidget(api_key_label)
        api_key_layout.addWidget(self.api_key_input)
        
        # Model selection
        model_layout = QHBoxLayout()
        model_label = QLabel("Gemini model:")
        model_label.setObjectName("settingLabel")
        
        self.model_combo = QComboBox()
        self.model_combo.setObjectName("settingCombo")
        self.model_combo.addItems([
            "gemini-2.0-flash-exp",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
        ])
        self.model_combo.setCurrentText(Config.GEMINI_MODEL)
        
        model_layout.addWidget(model_label)
        model_layout.addStretch()
        model_layout.addWidget(self.model_combo)
        
        # Test connection button
        test_button = QPushButton("Test Connection")
        test_button.setObjectName("secondaryButton")
        
        layout.addWidget(title_label)
        layout.addLayout(api_key_layout)
        layout.addLayout(model_layout)
        layout.addWidget(test_button)
        
        return frame
    
    def create_debug_settings(self):
        """Create debug settings section."""
        frame = QFrame()
        frame.setObjectName("settingsCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 16, 20, 16)
        layout.setSpacing(16)
        
        title_label = QLabel("Debug & Logging")
        title_label.setObjectName("sectionTitle")
        
        # Debug mode
        self.debug_checkbox = QCheckBox("Enable debug mode")
        self.debug_checkbox.setObjectName("settingCheckbox")
        self.debug_checkbox.setChecked(Config.DEBUG)
        
        # Log level
        log_level_layout = QHBoxLayout()
        log_level_label = QLabel("Log level:")
        log_level_label.setObjectName("settingLabel")
        
        self.log_level_combo = QComboBox()
        self.log_level_combo.setObjectName("settingCombo")
        self.log_level_combo.addItems(["DEBUG", "INFO", "WARNING", "ERROR"])
        self.log_level_combo.setCurrentText(Config.LOG_LEVEL)
        
        log_level_layout.addWidget(log_level_label)
        log_level_layout.addStretch()
        log_level_layout.addWidget(self.log_level_combo)
        
        # Buttons
        buttons_layout = QHBoxLayout()
        
        view_logs_button = QPushButton("View Logs")
        view_logs_button.setObjectName("secondaryButton")
        
        clear_logs_button = QPushButton("Clear Logs")
        clear_logs_button.setObjectName("warningButton")
        
        buttons_layout.addWidget(view_logs_button)
        buttons_layout.addWidget(clear_logs_button)
        buttons_layout.addStretch()
        
        layout.addWidget(title_label)
        layout.addWidget(self.debug_checkbox)
        layout.addLayout(log_level_layout)
        layout.addLayout(buttons_layout)
        
        return frame
    
    def setup_styles(self):
        """Apply styling to the settings widget."""
        colors = DARK_COLORS
        
        self.setStyleSheet(f"""
            QFrame#headerCard {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
            }}
            
            QTabWidget#settingsTabs {{
                background-color: transparent;
                border: none;
            }}
            
            QTabWidget#settingsTabs::pane {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
                margin-top: 8px;
            }}
            
            QTabWidget#settingsTabs::tab-bar {{
                alignment: left;
            }}
            
            QTabBar::tab {{
                background-color: {colors['background']};
                color: {colors['text_secondary']};
                border: 1px solid {colors['border']};
                border-bottom: none;
                border-radius: 8px 8px 0px 0px;
                padding: 12px 20px;
                margin-right: 4px;
                font-size: 14px;
                font-weight: 500;
            }}
            
            QTabBar::tab:selected {{
                background-color: {colors['surface']};
                color: {colors['text_primary']};
                border-color: {colors['border']};
            }}
            
            QTabBar::tab:hover:!selected {{
                background-color: {colors['surface_hover']};
                color: {colors['text_primary']};
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
            
            QFrame#settingsCard {{
                background-color: {colors['background']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
            }}
            
            QLabel#sectionTitle {{
                color: {colors['text_primary']};
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
            }}
            
            QLabel#settingLabel {{
                color: {colors['text_primary']};
                font-size: 14px;
                font-weight: 400;
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
                background-color: {colors['surface']};
            }}
            
            QCheckBox#settingCheckbox::indicator:checked {{
                background-color: {colors['primary']};
                border-color: {colors['primary']};
            }}
            
            QSpinBox#settingSpinbox {{
                background-color: {colors['surface']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 14px;
                min-width: 100px;
            }}
            
            QComboBox#settingCombo {{
                background-color: {colors['surface']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 14px;
                min-width: 120px;
            }}
            
            QLineEdit#settingInput {{
                background-color: {colors['surface']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 14px;
            }}
            
            QLineEdit#settingInput:focus {{
                border-color: {colors['primary']};
            }}
            
            QSlider#settingSlider {{
                height: 20px;
            }}
            
            QSlider#settingSlider::groove:horizontal {{
                background-color: {colors['border']};
                height: 4px;
                border-radius: 2px;
            }}
            
            QSlider#settingSlider::handle:horizontal {{
                background-color: {colors['primary']};
                width: 16px;
                height: 16px;
                border-radius: 8px;
                margin: -6px 0;
            }}
            
            QSlider#settingSlider::sub-page:horizontal {{
                background-color: {colors['primary']};
                border-radius: 2px;
            }}
            
            QListWidget#settingsList {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 4px;
                outline: none;
            }}
            
            QListWidget#settingsList::item {{
                background-color: transparent;
                color: {colors['text_primary']};
                padding: 6px 8px;
                border-radius: 4px;
                margin: 1px 0;
            }}
            
            QListWidget#settingsList::item:hover {{
                background-color: {colors['surface_hover']};
            }}
            
            QListWidget#settingsList::item:selected {{
                background-color: {colors['primary']};
                color: #FFFFFF;
            }}
            
            QPushButton#secondaryButton {{
                background-color: {colors['surface']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
            }}
            
            QPushButton#secondaryButton:hover {{
                background-color: {colors['surface_hover']};
            }}
            
            QPushButton#addButton {{
                background-color: {colors['success']};
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 500;
            }}
            
            QPushButton#removeButton {{
                background-color: {colors['error']};
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 500;
            }}
            
            QPushButton#warningButton {{
                background-color: {colors['warning']};
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 500;
            }}
            
            QPushButton#colorButton {{
                background-color: {colors['primary']};
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
            }}
        """)
    
    def load_settings(self):
        """Load current settings."""
        # Load blocked sites
        for site in Config.BLOCKED_SITES:
            if site.strip():
                item = QListWidgetItem(site.strip())
                self.blocked_sites_list.addItem(item)
        
        # Load API key if available
        if Config.GOOGLE_AI_API_KEY:
            self.api_key_input.setText(Config.GOOGLE_AI_API_KEY)
    
    def save_settings(self):
        """Save current settings."""
        # This would save settings to config file or database
        self.settings_changed.emit()
    
    def refresh(self):
        """Refresh the settings."""
        self.load_settings()
