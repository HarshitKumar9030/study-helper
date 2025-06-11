import { Metadata } from 'next';
import VoiceAssistant from '@/components/features/VoiceAssistant';

export const metadata: Metadata = {
  title: 'Voice Assistant - Study Helper',
  description: 'AI-powered voice assistant for hands-free interaction and voice commands',
};

export default function VoiceAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <VoiceAssistant />
    </div>
  );
}
