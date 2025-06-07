"""
Chat Assistant for Study Helper application.
Uses Next.js AI API for all AI functionality.
"""
import requests
import json
from typing import Optional, Dict, List, Any
from src.utils.config import Config
from src.utils.logger import get_logger

logger = get_logger(__name__)

class ChatAssistant:
    """Chat assistant that uses the Next.js AI API."""
    
    def __init__(self):
        """Initialize the chat assistant."""
        self.config = Config()
        self.api_base_url = getattr(self.config, 'NEXTJS_API_URL', 'http://localhost:3000/api')
        self.conversation_history = []
        self.max_history = 10  # Keep last 10 exchanges for context
        
        logger.info("Chat Assistant initialized")
    
    def is_available(self) -> bool:
        """Check if the Next.js AI API is available."""
        try:
            response = requests.get(f"{self.api_base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return True  # Assume available, will handle errors in requests
    
    def get_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Get a response from the AI assistant via Next.js API.
        
        Args:
            message: User's message
            context: Optional context information
            
        Returns:
            AI response as string
        """
        try:
            # Prepare the request payload
            payload = {
                'message': message,
                'context': context or {},
                'conversation_history': self.conversation_history[-self.max_history:]
            }
            
            # Make request to Next.js AI API
            response = requests.post(
                f"{self.api_base_url}/ai/chat",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    ai_response = data['data']['message']
                    
                    # Update conversation history
                    self.conversation_history.append({
                        'human': message,
                        'assistant': ai_response
                    })
                    
                    # Keep history manageable
                    if len(self.conversation_history) > self.max_history:
                        self.conversation_history = self.conversation_history[-self.max_history:]
                    
                    logger.info(f"AI response received for message: {message[:50]}...")
                    return ai_response
                else:
                    logger.error(f"AI API error: {data.get('error', 'Unknown error')}")
                    return "Sorry, I encountered an error processing your request."
            else:
                logger.error(f"AI API returned status {response.status_code}: {response.text}")
                return "Sorry, I'm having trouble connecting to my AI service. Please try again."
                
        except requests.exceptions.Timeout:
            logger.error("AI API request timeout")
            return "Sorry, my response is taking too long. Please try a simpler question."
        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to AI API")
            return "Sorry, I'm having trouble connecting to my AI service. Please check your internet connection."
        except Exception as e:
            logger.error(f"Error getting AI response: {e}")
            return "Sorry, I encountered an unexpected error. Please try again."
    
    def get_detailed_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get a detailed response with suggestions and action items.
        
        Args:
            message: User's message
            context: Optional context information
            
        Returns:
            Dictionary with message, suggestions, action_items, etc.
        """
        try:
            payload = {
                'message': message,
                'context': context or {},
                'conversation_history': self.conversation_history[-self.max_history:]
            }
            
            response = requests.post(
                f"{self.api_base_url}/ai/chat",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    ai_data = data['data']
                    
                    # Update conversation history
                    self.conversation_history.append({
                        'human': message,
                        'assistant': ai_data['message']
                    })
                    
                    if len(self.conversation_history) > self.max_history:
                        self.conversation_history = self.conversation_history[-self.max_history:]
                    
                    return {
                        'message': ai_data.get('message', ''),
                        'suggestions': ai_data.get('suggestions', []),
                        'action_items': ai_data.get('actionItems', []),
                        'confidence': ai_data.get('confidence', 0.8),
                        'timestamp': ai_data.get('timestamp')
                    }
                else:
                    return {
                        'message': f"Error: {data.get('error', 'Unknown error')}",
                        'suggestions': [],
                        'action_items': [],
                        'confidence': 0.0
                    }
            else:
                return {
                    'message': "Sorry, I'm having trouble connecting to my AI service.",
                    'suggestions': [],
                    'action_items': [],
                    'confidence': 0.0
                }
                
        except Exception as e:
            logger.error(f"Error getting detailed AI response: {e}")
            return {
                'message': "Sorry, I encountered an error processing your request.",
                'suggestions': [],
                'action_items': [],
                'confidence': 0.0
            }
    
    def get_study_tips(self, subject: Optional[str] = None) -> str:
        """Get study tips, optionally for a specific subject."""
        prompt = "Please provide 5 effective study tips"
        if subject:
            prompt += f" specifically for studying {subject}"
        prompt += ". Keep the response practical and actionable."
        
        return self.get_response(prompt, {'request_type': 'study_tips', 'subject': subject})
    
    def explain_concept(self, concept: str, subject: Optional[str] = None) -> str:
        """Explain a concept or topic."""
        prompt = f"Please explain the concept of '{concept}' in simple terms"
        if subject:
            prompt += f" in the context of {subject}"
        prompt += ". Include key points and examples if helpful."
        
        context = {'request_type': 'concept_explanation', 'concept': concept, 'subject': subject}
        return self.get_response(prompt, context)
    
    def generate_quiz_questions(self, topic: str, num_questions: int = 5) -> List[Dict[str, Any]]:
        """Generate quiz questions on a topic."""
        prompt = f"Generate {num_questions} multiple choice questions about {topic}. " + \
                "Return them in JSON format with this structure: " + \
                '[{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}]'
        
        try:
            response = self.get_response(prompt, {
                'request_type': 'quiz_generation',
                'topic': topic,
                'num_questions': num_questions
            })
            
            # Try to parse JSON response
            if response.startswith('[') and response.endswith(']'):
                return json.loads(response)
            else:
                # Fallback: return raw response as a single question
                return [{
                    'question': response,
                    'options': [],
                    'correct': -1,
                    'explanation': 'Raw AI response'
                }]
                
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            return []
    
    def suggest_study_plan(self, subject: str, duration: str, level: str = "beginner") -> str:
        """Suggest a study plan for a subject."""
        prompt = f"Create a detailed study plan for learning {subject} over {duration}. " + \
                f"The student is at {level} level. Include specific topics, time allocation, " + \
                "and study strategies."
        
        context = {
            'request_type': 'study_plan',
            'subject': subject,
            'duration': duration,
            'level': level
        }
        
        return self.get_response(prompt, context)
    
    def get_motivation(self, current_mood: Optional[str] = None) -> str:
        """Get motivational message for studying."""
        prompt = "Provide a short, encouraging message to motivate someone to study"
        if current_mood:
            prompt += f". The person is feeling {current_mood}"
        prompt += ". Make it personal and uplifting."
        
        return self.get_response(prompt, {'request_type': 'motivation', 'mood': current_mood})
    
    def ask_question(self, question: str, subject: Optional[str] = None) -> str:
        """Ask a general question to the AI."""
        context = {'request_type': 'general_question', 'subject': subject}
        return self.get_response(question, context)
    
    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []
        logger.info("Conversation history cleared")
    
    def get_history_summary(self) -> str:
        """Get a summary of the conversation history."""
        if not self.conversation_history:
            return "No conversation history available."
        
        summary_prompt = "Summarize the following conversation history in 2-3 sentences:\n"
        for exchange in self.conversation_history:
            summary_prompt += f"Human: {exchange['human']}\nAI: {exchange['assistant']}\n\n"
        
        return self.get_response(summary_prompt, {'request_type': 'history_summary'})

# Global instance
chat_assistant = ChatAssistant()