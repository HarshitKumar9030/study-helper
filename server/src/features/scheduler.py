"""
Scheduler service for managing study tasks and schedules.
"""
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from utils.config import Config
from utils.logger import get_logger

class Scheduler:
    """Scheduler for managing study tasks and scheduling."""
    
    def __init__(self):
        """Initialize the scheduler."""
        self.config = Config()
        self.logger = get_logger(__name__)
        self.tasks = []
        self.schedule_file = "data/schedule.json"
        
        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(self.schedule_file), exist_ok=True)
        
        # Load existing tasks
        self._load_tasks()
        
        self.logger.info("Scheduler initialized")
    
    def _load_tasks(self):
        """Load tasks from file."""
        try:
            if os.path.exists(self.schedule_file):
                with open(self.schedule_file, 'r') as f:
                    self.tasks = json.load(f)
                self.logger.info(f"Loaded {len(self.tasks)} tasks")
            else:
                self.tasks = []
        except Exception as e:
            self.logger.error(f"Error loading tasks: {e}")
            self.tasks = []
    
    def _save_tasks(self):
        """Save tasks to file."""
        try:
            with open(self.schedule_file, 'w') as f:
                json.dump(self.tasks, f, indent=2)
            self.logger.info("Tasks saved successfully")
        except Exception as e:
            self.logger.error(f"Error saving tasks: {e}")
    
    def add_task(self, task_data: Dict):
        """Add a new task."""
        task = {
            "id": len(self.tasks) + 1,
            "title": task_data.get("title", ""),
            "description": task_data.get("description", ""),
            "due_date": task_data.get("due_date", ""),
            "priority": task_data.get("priority", "medium"),
            "completed": False,
            "created_at": datetime.now().isoformat()
        }
        
        self.tasks.append(task)
        self._save_tasks()
        
        self.logger.info(f"Added task: {task['title']}")
        return task
    
    def get_tasks(self, completed: Optional[bool] = None) -> List[Dict]:
        """Get tasks, optionally filtered by completion status."""
        if completed is None:
            return self.tasks.copy()
        else:
            return [task for task in self.tasks if task.get("completed", False) == completed]
    
    def complete_task(self, task_id: int) -> bool:
        """Mark a task as completed."""
        for task in self.tasks:
            if task["id"] == task_id:
                task["completed"] = True
                task["completed_at"] = datetime.now().isoformat()
                self._save_tasks()
                self.logger.info(f"Completed task: {task['title']}")
                return True
        return False
    
    def delete_task(self, task_id: int) -> bool:
        """Delete a task."""
        for i, task in enumerate(self.tasks):
            if task["id"] == task_id:
                deleted_task = self.tasks.pop(i)
                self._save_tasks()
                self.logger.info(f"Deleted task: {deleted_task['title']}")
                return True
        return False
    
    def get_today_tasks(self) -> List[Dict]:
        """Get tasks due today."""
        today = datetime.now().strftime("%Y-%m-%d")
        return [task for task in self.tasks if task.get("due_date") == today and not task.get("completed", False)]
    
    def get_upcoming_tasks(self, days: int = 7) -> List[Dict]:
        """Get tasks due in the next N days."""
        upcoming_tasks = []
        today = datetime.now().date()
        
        for task in self.tasks:
            if task.get("completed", False):
                continue
                
            due_date_str = task.get("due_date")
            if due_date_str:
                try:
                    due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
                    if today <= due_date <= today + timedelta(days=days):
                        upcoming_tasks.append(task)
                except ValueError:
                    continue
        
        # Sort by due date
        upcoming_tasks.sort(key=lambda x: x.get("due_date", ""))
        return upcoming_tasks
    
    def suggest_study_schedule(self) -> List[Dict]:
        """Suggest a study schedule based on tasks."""
        pending_tasks = self.get_tasks(completed=False)
        if not pending_tasks:
            return []
        
        # Simple scheduling algorithm
        schedule = []
        current_time = datetime.now()
        
        for task in pending_tasks[:5]:  # Limit to 5 tasks
            suggestion = {
                "task": task,
                "suggested_time": current_time.strftime("%H:%M"),
                "duration": "30 minutes",  # Default duration
                "priority": task.get("priority", "medium")
            }
            schedule.append(suggestion)
            current_time += timedelta(minutes=45)  # 30 min task + 15 min break
        
        return schedule
    
    def get_tasks_for_date(self, date_str: str) -> List[Dict]:
        """Get tasks for a specific date."""
        return [task for task in self.tasks if task.get("due_date") == date_str]
    
    def get_weekly_schedule(self) -> Dict[str, List[Dict]]:
        """Get tasks organized by day for the current week."""
        today = datetime.now()
        start_of_week = today - timedelta(days=today.weekday())
        
        weekly_schedule = {}
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            date_str = day.strftime("%Y-%m-%d")
            weekly_schedule[date_str] = self.get_tasks_for_date(date_str)
        
        return weekly_schedule
    
    def get_upcoming_tasks(self, days: int = 7) -> List[Dict]:
        """Get upcoming tasks within the specified number of days."""
        today = datetime.now()
        upcoming = []
        
        for i in range(1, days + 1):
            future_date = today + timedelta(days=i)
            date_str = future_date.strftime("%Y-%m-%d")
            tasks_for_date = self.get_tasks_for_date(date_str)
            upcoming.extend(tasks_for_date)
        
        # Sort by due date and priority
        upcoming.sort(key=lambda x: (x.get("due_date", ""), 
                                   {"high": 0, "medium": 1, "low": 2}.get(x.get("priority", "medium").lower(), 1)))
        
        return upcoming