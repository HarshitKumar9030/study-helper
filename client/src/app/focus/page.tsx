import { Metadata } from 'next';
import FocusMode from '@/components/features/FocusMode';

export const metadata: Metadata = {
  title: 'Focus Mode - Study Helper',
  description: 'Distraction-free environment with website blocking and productivity tracking',
};

export default function FocusModePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <FocusMode />
    </div>
  );
}
