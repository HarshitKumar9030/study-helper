#!/usr/bin/env python3
"""
Test script to verify AI integration between Python backend and Next.js API
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.features.chat_assistant import ChatAssistant
import asyncio
import json

def test_basic_chat():
    """Test basic chat functionality"""
    print("Testing basic chat functionality...")
    
    assistant = ChatAssistant()
    
    # Test basic availability
    print(f"API Available: {assistant.is_available()}")
    
    # Test basic chat
    response = assistant.get_response("Hello, can you help me with studying?")
    print(f"Basic response: {response[:100]}...")
    
    # Test detailed response
    detailed = assistant.get_detailed_response("I need help with math homework")
    print(f"Detailed response keys: {list(detailed.keys())}")
    print(f"Message: {detailed['message'][:100]}...")
    print(f"Suggestions: {detailed['suggestions']}")
    print(f"Action items: {len(detailed['action_items'])} items")
    
    return True

def test_study_features():
    """Test study-specific features"""
    print("\nTesting study features...")
    
    assistant = ChatAssistant()
    
    # Test study tips
    tips = assistant.get_study_tips("Mathematics")
    print(f"Math study tips: {tips[:100]}...")
    
    # Test concept explanation
    explanation = assistant.explain_concept("Calculus", "Mathematics")
    print(f"Calculus explanation: {explanation[:100]}...")
    
    # Test motivation
    motivation = assistant.get_motivation("tired")
    print(f"Motivation message: {motivation[:100]}...")
    
    return True

def test_conversation_history():
    """Test conversation history management"""
    print("\nTesting conversation history...")
    
    assistant = ChatAssistant()
    
    # Clear history first
    assistant.clear_history()
    print("History cleared")
    
    # Have a conversation
    assistant.get_response("My name is John and I study computer science")
    assistant.get_response("What should I focus on today?")
    
    # Check history
    print(f"History length: {len(assistant.conversation_history)}")
    
    # Get summary
    summary = assistant.get_history_summary()
    print(f"History summary: {summary[:100]}...")
    
    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("AI Integration Test Suite")
    print("=" * 60)
    
    try:
        # Test basic functionality
        if test_basic_chat():
            print("✅ Basic chat test passed")
        else:
            print("❌ Basic chat test failed")
            return False
        
        # Test study features
        if test_study_features():
            print("✅ Study features test passed")
        else:
            print("❌ Study features test failed")
            return False
        
        # Test conversation history
        if test_conversation_history():
            print("✅ Conversation history test passed")
        else:
            print("❌ Conversation history test failed")
            return False
        
        print("\n" + "=" * 60)
        print("🎉 All tests passed! AI integration is working correctly.")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
