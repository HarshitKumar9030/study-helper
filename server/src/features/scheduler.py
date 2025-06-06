import threading
import time
import tkinter as tk
from tkinter import ttk
import customtkinter as ctk
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from src.utils.logger import get_logger

logger = get_logger(__name__)

class SmartScheduler:    
    def __init__(self, config, auth_service):
        self.config = config
        self.auth_service = auth_service
        self.schedule_window = None
        self.tasks = []
        self.learning_data = {}
        
        logger.info("Smart Scheduler initialized")
    
    def show_interface(self):
        if self.schedule_window and self.schedule_window.winfo_exists():
            self.schedule_window.lift()
            return
        
        self.create_scheduler_window()
    
    def create_scheduler_window(self):
        self.schedule_window = ctk.CTkToplevel()
        self.schedule_window.title("Smart Scheduler")
        self.schedule_window.geometry("800x600")
        
        main_frame = ctk.CTkFrame(self.schedule_window)
        main_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        title_label = ctk.CTkLabel(
            main_frame,
            text="📅 Smart Scheduler",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(pady=20)
        
        tabview = ctk.CTkTabview(main_frame)
        tabview.pack(fill="both", expand=True, padx=20, pady=10)
        
        today_tab = tabview.add("Today's Schedule")
        self.create_today_tab(today_tab)
        
        add_tab = tabview.add("Add Task")
        self.create_add_task_tab(add_tab)
        
        analytics_tab = tabview.add("Analytics")
        self.create_analytics_tab(analytics_tab)
        
        logger.info("Scheduler interface created")
    
    def create_today_tab(self, parent):
        """Create today's schedule tab."""
        schedule_frame = ctk.CTkFrame(parent)
        schedule_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        schedule_label = ctk.CTkLabel(
            schedule_frame,
            text="Today's Study Schedule",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        schedule_label.pack(pady=10)
        
        # TODO: Add actual schedule display
        placeholder_label = ctk.CTkLabel(
            schedule_frame,
            text="📚 No tasks scheduled for today\nClick 'Add Task' to create your study plan!",
            font=ctk.CTkFont(size=14)
        )
        placeholder_label.pack(pady=50)
    
    def create_add_task_tab(self, parent):
        form_frame = ctk.CTkFrame(parent)
        form_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        ctk.CTkLabel(form_frame, text="Task Name:", font=ctk.CTkFont(size=14)).pack(pady=5)
        self.task_name_entry = ctk.CTkEntry(form_frame, placeholder_text="e.g., Study Mathematics")
        self.task_name_entry.pack(pady=5, padx=20, fill="x")
        
        ctk.CTkLabel(form_frame, text="Subject:", font=ctk.CTkFont(size=14)).pack(pady=5)
        self.subject_entry = ctk.CTkEntry(form_frame, placeholder_text="e.g., Mathematics")
        self.subject_entry.pack(pady=5, padx=20, fill="x")
        
        ctk.CTkLabel(form_frame, text="Duration (minutes):", font=ctk.CTkFont(size=14)).pack(pady=5)
        self.duration_entry = ctk.CTkEntry(form_frame, placeholder_text="e.g., 60")
        self.duration_entry.pack(pady=5, padx=20, fill="x")
        
        ctk.CTkLabel(form_frame, text="Priority:", font=ctk.CTkFont(size=14)).pack(pady=5)
        self.priority_var = ctk.StringVar(value="Medium")
        priority_menu = ctk.CTkOptionMenu(form_frame, variable=self.priority_var, 
                                        values=["Low", "Medium", "High", "Urgent"])
        priority_menu.pack(pady=5, padx=20, fill="x")
        
        add_button = ctk.CTkButton(
            form_frame,
            text="➕ Add Task",
            command=self.add_task,
            font=ctk.CTkFont(size=14)
        )
        add_button.pack(pady=20)
    
    def create_analytics_tab(self, parent):
        analytics_frame = ctk.CTkFrame(parent)
        analytics_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        analytics_label = ctk.CTkLabel(
            analytics_frame,
            text="📊 Study Analytics",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        analytics_label.pack(pady=10)
        
        # TODO: Add actual analytics
        placeholder_label = ctk.CTkLabel(
            analytics_frame,
            text="📈 Analytics will appear here once you start studying!",
            font=ctk.CTkFont(size=14)
        )
        placeholder_label.pack(pady=50)
    
    def add_task(self):
        task_name = self.task_name_entry.get().strip()
        subject = self.subject_entry.get().strip()
        duration_str = self.duration_entry.get().strip()
        priority = self.priority_var.get()
        
        if not task_name or not subject or not duration_str:
            return
        
        try:
            duration = int(duration_str)
        except ValueError:
            # Show error message
            return
        
        task = {
            'name': task_name,
            'subject': subject,
            'duration': duration,
            'priority': priority,
            'created_at': time.time(),
            'completed': False
        }
        
        self.tasks.append(task)
        
        self.auth_service.send_activity_log('task_added', task)
        
        self.task_name_entry.delete(0, 'end')
        self.subject_entry.delete(0, 'end')
        self.duration_entry.delete(0, 'end')
        
        logger.info(f"Task added: {task_name}")
    
    def get_schedule(self, date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        if date is None:
            date = datetime.now()
        
        # TODO: Implement smart scheduling algorithm
        return self.tasks
    
    def optimize_schedule(self):
        # TODO: Implement machine learning-based optimization
        logger.info("Schedule optimization triggered")
    
    def record_study_session(self, task_id: str, duration: float, effectiveness: float):
        session_data = {
            'task_id': task_id,
            'duration': duration,
            'effectiveness': effectiveness,
            'timestamp': time.time()
        }
        
        if task_id not in self.learning_data:
            self.learning_data[task_id] = []
        
        self.learning_data[task_id].append(session_data)
        
        self.auth_service.send_activity_log('study_session_completed', session_data)
        
        logger.info(f"Study session recorded: {task_id}")
    
    def get_productivity_insights(self) -> Dict[str, Any]:
        # TODO: Analyze learning data and provide insights
        return {
            'total_sessions': len(self.learning_data),
            'average_effectiveness': 0.8,
            'best_time_of_day': '10:00 AM',
            'most_productive_subject': 'Mathematics'
        }
