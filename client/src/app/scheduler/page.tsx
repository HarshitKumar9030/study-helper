import { Metadata } from 'next';
import SmartScheduler from '@/components/features/SmartScheduler';

export const metadata: Metadata = {
  title: 'Smart Scheduler - Study Helper',
  description: 'Intelligent task scheduling with adaptive learning capabilities',
};

export default function SchedulerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SmartScheduler />
    </div>
  );
}
