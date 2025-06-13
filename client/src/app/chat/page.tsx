import AIChat from '@/components/ai/AIChat2'
import React from 'react'

const page = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] flex">
      <AIChat className="flex-1" maxHeight="calc(100vh - 4rem)" />
    </div>
  )
}

export default page