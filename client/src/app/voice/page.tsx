import { Metadata } from 'next';
import VoiceAssistant from '@/components/features/VoiceAssistant';

export const metadata: Metadata = {
  title: 'Enhanced Voice Assistant - Study Helper',
  description: 'AI-powered voice assistant with enhanced UI, animations, and smart features for hands-free study assistance',
};

export default function VoiceAssistantPage() {
  return (
    <div className="min-h-screen p-8 bg-background transition-colors duration-200">
     
          <VoiceAssistant />
      </div>
  );
}
