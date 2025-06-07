"""
Main application module for Study Helper.
"""
import sys
import os
import signal
from typing import Optional
from utils.config import Config
from utils.logger import get_logger

# Initialize logger
logger = get_logger(__name__)

class StudyHelperApp:
    """Main Study Helper application class."""
    
    def __init__(self):
        """Initialize the application."""
        self.config = Config()
        self.gui_app = None
        self.console_mode = False
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        logger.info(f"Study Helper v{self.config.VERSION} initialized")
        logger.info(f"GUI Mode Available: {self.config.GUI_MODE}")
    
    def _signal_handler(self, signum, frame):
        """Handle system signals gracefully."""
        logger.info("Received termination signal. Shutting down...")
        self.shutdown()
        sys.exit(0)
    
    def run(self):
        """Run the application."""
        try:
            if self.config.GUI_MODE:
                self._run_gui()
            else:
                self._run_console()
        except Exception as e:
            logger.error(f"Application error: {str(e)}")
            if self.config.GUI_MODE:
                logger.info("Falling back to console mode...")
                self._run_console()
            else:                raise
    
    def _run_gui(self):
        """Run the GUI application."""
        try:
            from PyQt5.QtWidgets import QApplication
            from PyQt5.QtCore import Qt
            from ui.main_window import MainWindow
            from ui.auth_dialog import AuthDialog
            
            # Set High DPI scaling before creating QApplication
            QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
            QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
            
            # Create QApplication
            app = QApplication(sys.argv)
            app.setApplicationName(self.config.APP_NAME)
            app.setApplicationVersion(self.config.VERSION)
            
            self.gui_app = app
            
            # Show authentication dialog
            auth_dialog = AuthDialog()
            if auth_dialog.exec_() == auth_dialog.Accepted:
                # User authenticated, show main window
                main_window = MainWindow()
                main_window.show()
                
                logger.info("GUI application started successfully")
                sys.exit(app.exec_())
            else:
                logger.info("Authentication cancelled")
                sys.exit(0)
                
        except ImportError as e:
            logger.error(f"GUI dependencies not available: {str(e)}. Please install PyQt5: pip install PyQt5")
            logger.info("Falling back to console mode...")
            self._run_console()
            return
        except Exception as e:
            logger.error(f"GUI startup error: {str(e)}")
            raise
    
    def _run_console(self):
        """Run the console application."""
        self.console_mode = True
        logger.info("Starting console mode...")
        
        print(f"\\n{'='*60}")
        print(f"Welcome to {self.config.APP_NAME} v{self.config.VERSION}")
        print(f"Console Mode")
        print(f"{'='*60}")
        
        from features.voice_assistant import VoiceAssistant
        from features.focus_mode import FocusMode
        from features.scheduler import Scheduler
        from features.chat_assistant import ChatAssistant
        
        voice_assistant = VoiceAssistant()
        focus_mode = FocusMode()
        scheduler = Scheduler()
        chat_assistant = ChatAssistant()
        
        # Main console loop
        while True:
            try:
                print("\\nAvailable commands:")
                print("1. Voice Assistant")
                print("2. Focus Mode")
                print("3. Scheduler")
                print("4. Chat Assistant")
                print("5. Settings")
                print("6. Exit")
                
                choice = input("\\nEnter your choice (1-6): ").strip()
                
                if choice == '1':
                    self._console_voice_assistant(voice_assistant)
                elif choice == '2':
                    self._console_focus_mode(focus_mode)
                elif choice == '3':
                    self._console_scheduler(scheduler)
                elif choice == '4':
                    self._console_chat_assistant(chat_assistant)
                elif choice == '5':
                    self._console_settings()
                elif choice == '6':
                    print("Goodbye!")
                    break
                else:
                    print("Invalid choice. Please try again.")
                    
            except KeyboardInterrupt:
                print("\\nGoodbye!")
                break
            except Exception as e:
                logger.error(f"Console error: {str(e)}")
                print(f"Error: {str(e)}")
    
    def _console_voice_assistant(self, voice_assistant):
        """Console interface for voice assistant."""
        print("\\n--- Voice Assistant ---")
        print("1. Start listening")
        print("2. Text to speech")
        print("3. Back to main menu")
        
        choice = input("Enter your choice: ").strip()
        
        if choice == '1':
            print("Listening... (Press Ctrl+C to stop)")
            try:
                result = voice_assistant.listen()
                if result:
                    print(f"You said: {result}")
            except KeyboardInterrupt:
                print("\\nStopped listening.")
        elif choice == '2':
            text = input("Enter text to speak: ")
            voice_assistant.speak(text)
    
    def _console_focus_mode(self, focus_mode):
        """Console interface for focus mode."""
        print("\\n--- Focus Mode ---")
        print("1. Start focus session")
        print("2. View blocked sites")
        print("3. Add blocked site")
        print("4. Remove blocked site")
        print("5. Back to main menu")
        
        choice = input("Enter your choice: ").strip()
        
        if choice == '1':
            duration = input("Enter session duration in minutes (default 25): ").strip()
            duration = int(duration) if duration.isdigit() else 25
            print(f"Starting {duration}-minute focus session...")
            focus_mode.start_session(duration)
        elif choice == '2':
            sites = focus_mode.get_blocked_sites()
            print(f"Blocked sites: {', '.join(sites)}")
        elif choice == '3':
            site = input("Enter site to block: ").strip()
            focus_mode.add_blocked_site(site)
            print(f"Added {site} to blocked sites.")
        elif choice == '4':
            site = input("Enter site to unblock: ").strip()
            focus_mode.remove_blocked_site(site)
            print(f"Removed {site} from blocked sites.")
    
    def _console_scheduler(self, scheduler):
        """Console interface for scheduler."""
        print("\\n--- Scheduler ---")
        print("1. Add task")
        print("2. View tasks")
        print("3. Complete task")
        print("4. Back to main menu")
        
        choice = input("Enter your choice: ").strip()
        
        if choice == '1':
            title = input("Task title: ").strip()
            description = input("Task description (optional): ").strip()
            due_date = input("Due date (YYYY-MM-DD, optional): ").strip()
            
            task_data = {"title": title}
            if description:
                task_data["description"] = description
            if due_date:
                task_data["due_date"] = due_date
                
            scheduler.add_task(task_data)
            print("Task added successfully!")
        elif choice == '2':
            tasks = scheduler.get_tasks()
            if tasks:
                print("\\nYour tasks:")
                for i, task in enumerate(tasks, 1):
                    status = "✓" if task.get("completed") else "○"
                    print(f"{i}. {status} {task['title']}")
            else:
                print("No tasks found.")
    
    def _console_chat_assistant(self, chat_assistant):
        """Console interface for chat assistant."""
        print("\\n--- Chat Assistant ---")
        print("Type your message (or 'quit' to exit):")
        
        while True:
            message = input("You: ").strip()
            if message.lower() in ['quit', 'exit', 'q']:
                break
            
            if message:
                try:
                    response = chat_assistant.get_response(message)
                    print(f"Assistant: {response}")
                except Exception as e:
                    print(f"Error: {str(e)}")
    
    def _console_settings(self):
        """Console interface for settings."""
        print("\\n--- Settings ---")
        print(f"App Version: {self.config.VERSION}")
        print(f"GUI Mode: {self.config.GUI_MODE}")
        print(f"Voice Enabled: {self.config.VOICE_ENABLED}")
        print(f"Focus Mode Enabled: {self.config.FOCUS_MODE_ENABLED}")
        print(f"Theme: {self.config.THEME_MODE}")
        
        input("\\nPress Enter to continue...")
    
    def shutdown(self):
        """Shutdown the application gracefully."""
        logger.info("Shutting down Study Helper...")
        
        if self.gui_app:
            self.gui_app.quit()
        
        logger.info("Application shutdown complete")

def main():
    """Main entry point."""
    app = StudyHelperApp()
    app.run()

if __name__ == "__main__":
    main()