"""
Scheduler widget for Study Helper application.
"""
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QFrame, QLabel, 
    QPushButton, QListWidget, QListWidgetItem, QCalendarWidget,
    QTimeEdit, QLineEdit, QTextEdit, QComboBox, QScrollArea
)
from PyQt5.QtCore import Qt, QDate, QTime, pyqtSignal
from PyQt5.QtGui import QFont
from src.features.scheduler import Scheduler
from src.ui.styles import DARK_COLORS
import datetime

class SchedulerWidget(QWidget):
    """Scheduler interface widget."""
    
    def __init__(self):
        super().__init__()
        self.scheduler = Scheduler()
        self.setup_ui()
        self.setup_styles()
        self.load_schedule()
        
    def setup_ui(self):
        """Setup the user interface."""
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(24)
        
        # Left panel - Calendar and add task
        left_panel = self.create_left_panel()
        layout.addWidget(left_panel, 1)
        
        # Right panel - Schedule list and details
        right_panel = self.create_right_panel()
        layout.addWidget(right_panel, 1)
        
    def create_left_panel(self):
        """Create the left panel with calendar and task creation."""
        frame = QFrame()
        frame.setObjectName("leftPanel")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(24)
        
        # Calendar section
        calendar_frame = self.create_calendar_section()
        layout.addWidget(calendar_frame)
        
        # Add task section
        add_task_frame = self.create_add_task_section()
        layout.addWidget(add_task_frame)
        
        return frame
    
    def create_calendar_section(self):
        """Create the calendar section."""
        frame = QFrame()
        frame.setObjectName("calendarCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        title_label = QLabel("📅 Calendar")
        title_label.setObjectName("sectionTitle")
        
        self.calendar = QCalendarWidget()
        self.calendar.setObjectName("calendar")
        self.calendar.selectionChanged.connect(self.on_date_selected)
        
        # Today button
        today_button = QPushButton("Go to Today")
        today_button.setObjectName("secondaryButton")
        today_button.clicked.connect(self.go_to_today)
        
        layout.addWidget(title_label)
        layout.addWidget(self.calendar)
        layout.addWidget(today_button)
        
        return frame
    
    def create_add_task_section(self):
        """Create the add task section."""
        frame = QFrame()
        frame.setObjectName("addTaskCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        title_label = QLabel("➕ Add Task")
        title_label.setObjectName("sectionTitle")
        
        # Task title
        self.task_title_input = QLineEdit()
        self.task_title_input.setObjectName("taskInput")
        self.task_title_input.setPlaceholderText("Enter task title...")
        
        # Task description
        self.task_description_input = QTextEdit()
        self.task_description_input.setObjectName("taskDescription")
        self.task_description_input.setPlaceholderText("Task description (optional)...")
        self.task_description_input.setMaximumHeight(80)
        
        # Time and priority
        time_priority_layout = QHBoxLayout()
        
        # Time
        time_layout = QVBoxLayout()
        time_label = QLabel("Time:")
        time_label.setObjectName("fieldLabel")
        
        self.task_time_edit = QTimeEdit()
        self.task_time_edit.setObjectName("timeEdit")
        self.task_time_edit.setTime(QTime.currentTime())
        
        time_layout.addWidget(time_label)
        time_layout.addWidget(self.task_time_edit)
        
        # Priority
        priority_layout = QVBoxLayout()
        priority_label = QLabel("Priority:")
        priority_label.setObjectName("fieldLabel")
        
        self.priority_combo = QComboBox()
        self.priority_combo.setObjectName("priorityCombo")
        self.priority_combo.addItems(["Low", "Medium", "High", "Urgent"])
        self.priority_combo.setCurrentText("Medium")
        
        priority_layout.addWidget(priority_label)
        priority_layout.addWidget(self.priority_combo)
        
        time_priority_layout.addLayout(time_layout)
        time_priority_layout.addLayout(priority_layout)
        
        # Add button
        add_button = QPushButton("Add Task")
        add_button.setObjectName("primaryButton")
        add_button.clicked.connect(self.add_task)
        
        layout.addWidget(title_label)
        layout.addWidget(self.task_title_input)
        layout.addWidget(self.task_description_input)
        layout.addLayout(time_priority_layout)
        layout.addWidget(add_button)
        
        return frame
    
    def create_right_panel(self):
        """Create the right panel with schedule list."""
        frame = QFrame()
        frame.setObjectName("rightPanel")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(24)
        
        # Today's schedule
        today_frame = self.create_today_schedule()
        layout.addWidget(today_frame)
        
        # Upcoming tasks
        upcoming_frame = self.create_upcoming_tasks()
        layout.addWidget(upcoming_frame)
        
        return frame
    
    def create_today_schedule(self):
        """Create today's schedule section."""
        frame = QFrame()
        frame.setObjectName("todayCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        # Header
        header_layout = QHBoxLayout()
        
        title_label = QLabel("Today's Schedule")
        title_label.setObjectName("sectionTitle")
        
        date_label = QLabel(datetime.date.today().strftime("%B %d, %Y"))
        date_label.setObjectName("dateLabel")
        
        header_layout.addWidget(title_label)
        header_layout.addStretch()
        header_layout.addWidget(date_label)
        
        # Tasks list
        self.today_tasks_list = QListWidget()
        self.today_tasks_list.setObjectName("tasksList")
        
        layout.addLayout(header_layout)
        layout.addWidget(self.today_tasks_list)
        
        return frame
    
    def create_upcoming_tasks(self):
        """Create upcoming tasks section."""
        frame = QFrame()
        frame.setObjectName("upcomingCard")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        # Header
        header_layout = QHBoxLayout()
        
        title_label = QLabel("Upcoming Tasks")
        title_label.setObjectName("sectionTitle")
        
        view_all_button = QPushButton("View All")
        view_all_button.setObjectName("linkButton")
        
        header_layout.addWidget(title_label)
        header_layout.addStretch()
        header_layout.addWidget(view_all_button)
        
        # Tasks list
        self.upcoming_tasks_list = QListWidget()
        self.upcoming_tasks_list.setObjectName("tasksList")
        
        layout.addLayout(header_layout)
        layout.addWidget(self.upcoming_tasks_list)
        
        return frame
    
    def setup_styles(self):
        """Apply styling to the scheduler widget."""
        colors = DARK_COLORS
        
        self.setStyleSheet(f"""
            QFrame#leftPanel, QFrame#rightPanel {{
                background-color: transparent;
            }}
            
            QFrame#calendarCard, QFrame#addTaskCard, QFrame#todayCard, QFrame#upcomingCard {{
                background-color: {colors['surface']};
                border: 1px solid {colors['border']};
                border-radius: 12px;
            }}
            
            QLabel#sectionTitle {{
                color: {colors['text_primary']};
                font-size: 16px;
                font-weight: 600;
            }}
            
            QLabel#dateLabel {{
                color: {colors['text_secondary']};
                font-size: 14px;
                font-weight: 400;
            }}
            
            QLabel#fieldLabel {{
                color: {colors['text_primary']};
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 4px;
            }}
            
            QCalendarWidget#calendar {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
            }}
            
            QCalendarWidget#calendar QAbstractItemView {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                selection-background-color: {colors['primary']};
            }}
            
            QLineEdit#taskInput {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 10px 12px;
                font-size: 14px;
            }}
            
            QLineEdit#taskInput:focus {{
                border-color: {colors['primary']};
            }}
            
            QTextEdit#taskDescription {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 14px;
            }}
            
            QTextEdit#taskDescription:focus {{
                border-color: {colors['primary']};
            }}
            
            QTimeEdit#timeEdit {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 14px;
            }}
            
            QComboBox#priorityCombo {{
                background-color: {colors['background']};
                color: {colors['text_primary']};
                border: 1px solid {colors['border']};
                border-radius: 6px;
                padding: 6px 8px;
                font-size: 14px;
                min-width: 80px;
            }}
            
            QComboBox#priorityCombo::drop-down {{
                border: none;
                width: 20px;
            }}
            
            QComboBox#priorityCombo::down-arrow {{
                image: none;
                border: none;
                width: 0px;
                height: 0px;
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
            }}
            
            QPushButton#secondaryButton:hover {{
                background-color: {colors['surface_hover']};
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
            
            QListWidget#tasksList {{
                background-color: {colors['background']};
                border: 1px solid {colors['border']};
                border-radius: 8px;
                padding: 8px;
                outline: none;
            }}
            
            QListWidget#tasksList::item {{
                background-color: transparent;
                color: {colors['text_primary']};
                padding: 12px;
                border-radius: 6px;
                margin: 2px 0;
                border-left: 3px solid transparent;
            }}
            
            QListWidget#tasksList::item:hover {{
                background-color: {colors['surface_hover']};
            }}
            
            QListWidget#tasksList::item:selected {{
                background-color: {colors['primary']};
                color: #FFFFFF;
            }}
        """)
    def load_schedule(self):
        """Load schedule data."""
        try:
            # Load today's tasks
            today_str = datetime.date.today().strftime("%Y-%m-%d")
            today_tasks = self.scheduler.get_tasks_for_date(today_str)
            self.populate_tasks_list(self.today_tasks_list, today_tasks)
            
            # Load upcoming tasks
            upcoming_tasks = self.scheduler.get_upcoming_tasks()
            self.populate_tasks_list(self.upcoming_tasks_list, upcoming_tasks[:5])  # Show only 5
            
        except Exception as e:
            print(f"Error loading schedule: {e}")
            self.add_sample_tasks()
    
    def add_sample_tasks(self):
        """Add sample tasks for demonstration."""
        sample_tasks = [
            {"title": "Study Math - Calculus", "time": "09:00", "priority": "High", "completed": False},
            {"title": "Physics Lab Report", "time": "11:30", "priority": "Medium", "completed": True},
            {"title": "English Essay Draft", "time": "14:00", "priority": "High", "completed": False},
            {"title": "Chemistry Review", "time": "16:30", "priority": "Medium", "completed": False},
        ]
        
        for task in sample_tasks:
            self.add_task_to_list(self.today_tasks_list, task)
        
        upcoming_sample = [
            {"title": "History Presentation", "date": "Tomorrow", "priority": "Urgent"},
            {"title": "Biology Quiz Prep", "date": "Dec 15", "priority": "High"},
            {"title": "Project Meeting", "date": "Dec 16", "priority": "Medium"},
        ]
        
        for task in upcoming_sample:
            item_text = f"📋 {task['title']}\n📅 {task['date']} • Priority: {task['priority']}"
            item = QListWidgetItem(item_text)
            
            # Set priority color
            if task['priority'] == 'Urgent':
                item.setData(Qt.UserRole, 'urgent')
            elif task['priority'] == 'High':
                item.setData(Qt.UserRole, 'high')
            
            self.upcoming_tasks_list.addItem(item)
    
    def populate_tasks_list(self, list_widget, tasks):
        """Populate a task list with tasks."""
        list_widget.clear()
        for task in tasks:
            self.add_task_to_list(list_widget, task)
    
    def add_task_to_list(self, list_widget, task):
        """Add a single task to a list widget."""
        status_icon = "✅" if task.get('completed', False) else "⏰"
        priority_emoji = {
            'Urgent': '🔴',
            'High': '🟡',
            'Medium': '🟢',
            'Low': '⚪'
        }.get(task.get('priority', 'Medium'), '🟢')
        
        item_text = f"{status_icon} {task['title']}\n⏰ {task['time']} {priority_emoji} {task.get('priority', 'Medium')}"
        item = QListWidgetItem(item_text)
        
        # Store task data
        item.setData(Qt.UserRole, task)
        
        list_widget.addItem(item)
    
    def add_task(self):
        """Add a new task."""
        title = self.task_title_input.text().strip()
        if not title:
            return
        
        description = self.task_description_input.toPlainText().strip()
        time = self.task_time_edit.time().toString("HH:mm")
        priority = self.priority_combo.currentText()
        date = self.calendar.selectedDate().toPyDate()
        
        task = {
            'title': title,
            'description': description,
            'time': time,
            'priority': priority,
            'date': date,
            'completed': False
        }
        
        try:
            # Add to scheduler
            self.scheduler.add_task(task)
            
            # Add to appropriate list
            if date == datetime.date.today():
                self.add_task_to_list(self.today_tasks_list, task)
            
            # Clear form
            self.task_title_input.clear()
            self.task_description_input.clear()
            self.task_time_edit.setTime(QTime.currentTime())
            self.priority_combo.setCurrentText("Medium")
            
        except Exception as e:
            print(f"Error adding task: {e}")
    
    def on_date_selected(self):
        """Handle date selection in calendar."""
        selected_date = self.calendar.selectedDate().toPyDate()
        # Could load tasks for selected date here
        pass
    
    def go_to_today(self):
        """Navigate calendar to today."""
        self.calendar.setSelectedDate(QDate.currentDate())
    
    def refresh(self):
        """Refresh the scheduler data."""
        self.load_schedule()
