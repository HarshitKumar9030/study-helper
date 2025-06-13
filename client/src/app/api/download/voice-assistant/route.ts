import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform || !['windows', 'macos', 'linux'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Supported: windows, macos, linux' },
        { status: 400 }
      );
    }

    // For now, return a JSON response with download instructions
    // In production, you would serve actual files
    const downloadInfo = {
      platform,
      files: [
        'voice_assistant_helper.py',
        'requirements-voice-helper.txt',
        platform === 'windows' ? 'install_voice_assistant.bat' : 'install_voice_assistant.sh'
      ],
      instructions: generateInstructions(platform),
      apiKey: `Get your API key from the settings page`,
      setupGuide: generateSetupGuide(platform)
    };

    return NextResponse.json(downloadInfo);

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download package' },
      { status: 500 }
    );
  }
}

function generateInstructions(platform: string): string[] {
  const baseInstructions = [
    'Download the voice assistant files',
    'Install Python 3.7 or higher',
    'Run the installation script',
    'Configure your API key',
    'Start the voice assistant'
  ];

  if (platform === 'windows') {
    return [
      ...baseInstructions,
      'Double-click install_voice_assistant.bat',
      'Run launch_voice_assistant.bat to start'
    ];
  } else {
    return [
      ...baseInstructions,
      'chmod +x install_voice_assistant.sh',
      './install_voice_assistant.sh',
      'python3 voice_assistant_helper.py'
    ];
  }
}

function generateSetupGuide(platform: string): string {
  return `# Study Helper Voice Assistant Setup

## Platform: ${platform.charAt(0).toUpperCase() + platform.slice(1)}

### Quick Start:
1. Install Python 3.7+
2. Run the installation script
3. Get your API key from settings
4. Configure and start the assistant

### Files Included:
- voice_assistant_helper.py (main application)
- requirements-voice-helper.txt (dependencies)
- installation script for ${platform}

Visit the settings page for your API key and detailed instructions.
`;
}
