import google.generativeai as genai
from typing import Optional, Dict, List, Any
from utils.config import Config
from utils.logger import get_logger

class ChatAssistant:
    
    def __init__(self):
        self.config = Config()
        self.logger = get_logger(__name__)
        self.model = None
        self.chat_session = None
        
        self._initialize_gemini()
        
        self.logger.info("Chat Assistant initialized")
    
    def _initialize_gemini(self):
        try:
            if self.config.GOOGLE_AI_API_KEY:
                genai.configure(api_key=self.config.GOOGLE_AI_API_KEY)
                self.model = genai.GenerativeModel(self.config.GEMINI_MODEL)
                self.chat_session = self.model.start_chat(history=[])
                self.logger.info("Gemini AI initialized successfully")
            else:
                self.logger.warning("Google AI API key not provided")
        except Exception as e:
            self.logger.error(f"Failed to initialize Gemini: {e}")
    
    def is_available(self) -> bool:
        return self.model is not None
    
    def get_response(self, message: str, context: Optional[Dict] = None) -> str:
        if not self.is_available():
            return "I'm sorry, the chat assistant is not available right now. Please check your internet connection and API configuration."
        
        try:
            if context:
                enhanced_message = self._enhance_message_with_context(message, context)
            else:
                enhanced_message = message
            
            response = self.chat_session.send_message(enhanced_message)
            return response.text
            
        except Exception as e:
            self.logger.error(f"Error getting chat response: {e}")
            return "I'm sorry, I encountered an error while processing your request. Please try again."
    
    def _enhance_message_with_context(self, message: str, context: Dict) -> str:
        """Enhance message with context for better responses."""
        context_str = "Context: You are a study helper assistant. "
        
        if context.get("interaction_type") == "voice":
            context_str += "The user is speaking to you via voice. "
        
        if context.get("user_mode") == "study_session":
            context_str += "The user is currently in a study session. "
        elif context.get("user_mode") == "break":
            context_str += "The user is taking a break. "
        
        return context_str + "\n\nUser message: " + message
    
    def get_study_tips(self, subject: Optional[str] = None) -> str:
        """Get study tips, optionally for a specific subject."""
        if not self.is_available():
            return self._fallback_study_tips()
        
        prompt = "Please provide 3-5 effective study tips"
        if subject:
            prompt += f" specifically for studying {subject}"
        prompt += ". Keep the response concise and practical."
        
        return self.get_response(prompt)
    
    def explain_concept(self, concept: str) -> str:
        """Explain a concept or topic."""
        if not self.is_available():
            return f"I'd be happy to explain {concept}, but I need an internet connection to provide detailed explanations."
        
        prompt = f"Please explain the concept of '{concept}' in simple terms that a student would understand. Include key points and examples if helpful."
        return self.get_response(prompt)
    
    def generate_quiz(self, topic: str, num_questions: int = 5) -> List[Dict]:
        """Generate quiz questions on a topic."""
        if not self.is_available():
            return []
        
        prompt = f"Generate {num_questions} multiple choice questions about {topic}. Format each question as: Question, A) option, B) option, C) option, D) option, Correct answer: letter"
        
        try:
            response = self.get_response(prompt)
            # Parse the response into structured quiz data
            # This is a simplified parsing - in production you'd want more robust parsing
            return [{"question": response, "type": "generated"}]
        except Exception as e:
            self.logger.error(f"Error generating quiz: {e}")
            return []
    
    def suggest_study_plan(self, subject: str, duration: str, level: str = "beginner") -> str:
        """Suggest a study plan for a subject."""
        if not self.is_available():
            return f"I'd recommend breaking down {subject} into small, manageable topics and studying them consistently over {duration}."
        
        prompt = f"Create a study plan for learning {subject} over {duration}. The student is at {level} level. Include specific topics to cover and time allocation suggestions."
        return self.get_response(prompt)
    
    def _fallback_study_tips(self) -> str:
        """Provide fallback study tips when AI is not available."""
        tips = [
            "Use active recall - test yourself instead of just re-reading",
            "Take regular breaks (try the Pomodoro Technique: 25 min study, 5 min break)",
            "Create a distraction-free study environment",
            "Practice spaced repetition for better retention",
            "Teach concepts to others or explain them out loud"
        ]
        return "Here are some proven study tips:\n" + "\n".join(f"• {tip}" for tip in tips)
        self.initialized = False
        
        # Initialize if API key is available
        if Config.GOOGLE_AI_API_KEY:
            self._initialize_ai()
    
    def _initialize_ai(self) -> bool:
        """Initialize the Google AI client and model."""
        try:
            # Configure the API key
            genai.configure(api_key=Config.GOOGLE_AI_API_KEY)
            
            # Initialize the model
            self.model = genai.GenerativeModel(
                model_name=Config.GEMINI_MODEL,
                system_instruction="""You are a helpful study assistant. Your role is to:
                1. Help users with their studies and learning
                2. Provide explanations for academic concepts
                3. Assist with study planning and organization
                4. Answer questions about various subjects
                5. Give productivity and focus tips
                6. Be encouraging and supportive
                
                Keep responses concise but informative. Focus on being helpful for students."""
            )
            
            # Start a chat session
            self.chat_session = self.model.start_chat(history=[])
            
            self.initialized = True
            self.logger.info(f"Chat assistant initialized successfully with {Config.GEMINI_MODEL}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize chat assistant: {e}")
            self.initialized = False
            return False
    
    def is_available(self) -> bool:
        """Check if the chat assistant is available."""
        return self.initialized and self.model is not None
    
    def get_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Get a response from the AI assistant.
        
        Args:
            message: User's message
            context: Optional context information (user data, current activity, etc.)
            
        Returns:
            AI response as string
        """
        if not self.is_available():
            return "Chat assistant is not available. Please check your Google AI API key configuration."
        
        try:
            # Add context to the message if provided
            if context:
                context_info = self._format_context(context)
                full_message = f"{context_info}\n\nUser message: {message}"
            else:
                full_message = message
            
            # Get response from the model
            response = self.chat_session.send_message(full_message)
            
            self.logger.info(f"Chat response generated for message: {message[:50]}...")
            return response.text
            
        except Exception as e:
            self.logger.error(f"Error getting chat response: {e}")
            return "Sorry, I encountered an error while processing your request. Please try again."
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context information for the AI."""
        formatted_context = "Context information:"
        
        if 'user_name' in context:
            formatted_context += f"\n- User: {context['user_name']}"
        
        if 'current_activity' in context:
            formatted_context += f"\n- Current activity: {context['current_activity']}"
        
        if 'study_session' in context:
            formatted_context += f"\n- Study session: {context['study_session']}"
        
        if 'focus_mode' in context:
            formatted_context += f"\n- Focus mode: {'Active' if context['focus_mode'] else 'Inactive'}"
        
        if 'recent_topics' in context:
            topics = ', '.join(context['recent_topics'])
            formatted_context += f"\n- Recent study topics: {topics}"
        
        return formatted_context
    
    def get_study_tips(self, subject: Optional[str] = None) -> str:
        """Get study tips for a specific subject or general tips."""
        if subject:
            message = f"Give me some effective study tips for {subject}."
        else:
            message = "Give me some general study tips to improve my learning."
        
        return self.get_response(message)
    
    def explain_concept(self, concept: str, subject: Optional[str] = None) -> str:
        """Get an explanation for a specific concept."""
        if subject:
            message = f"Please explain the concept of '{concept}' in {subject}."
        else:
            message = f"Please explain the concept of '{concept}'."
        
        return self.get_response(message)
    
    def create_study_plan(self, subjects: List[str], duration: str = "1 week") -> str:
        """Create a study plan for given subjects."""
        subjects_str = ', '.join(subjects)
        message = f"Create a {duration} study plan for these subjects: {subjects_str}. Include time allocation and study methods."
        
        return self.get_response(message)
    
    def get_focus_advice(self) -> str:
        """Get advice on maintaining focus while studying."""
        message = "Give me some practical advice on how to maintain focus and avoid distractions while studying."
        
        return self.get_response(message)
    
    def clear_chat_history(self):
        """Clear the chat history and start a new session."""
        if self.model:
            try:
                self.chat_session = self.model.start_chat(history=[])
                self.logger.info("Chat history cleared")
            except Exception as e:
                self.logger.error(f"Error clearing chat history: {e}")
    
    def get_chat_history(self) -> List[Dict[str, str]]:
        """Get the current chat history."""
        if not self.chat_session:
            return []
        
        try:
            history = []
            for message in self.chat_session.history:
                history.append({
                    'role': message.role,
                    'content': message.parts[0].text if message.parts else ''
                })
            return history
        except Exception as e:
            self.logger.error(f"Error getting chat history: {e}")
            return []

# Global instance
chat_assistant = ChatAssistant()