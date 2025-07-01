import { Metadata } from 'next';
import VoiceAssistant from '@/components/features/VoiceAssistant';

export const metadata: Metadata = {
  title: 'Voice Assistant - Study Helper',
  description: 'AI-powered voice assistant for hands-free study assistance.',
};

export default function VoiceAssistantPage() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-200 mt-16">
      <div className="container mx-auto px-6 py-8 h-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Voice Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Hands-free AI assistance for your studies. Speak naturally and get intelligent responses.
          </p>
        </div>

        {/* Voice Assistant Component */}
        <VoiceAssistant />
      </div>
    </div>
  );
}
