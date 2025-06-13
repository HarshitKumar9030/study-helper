# Study Helper Voice Assistant - Windows Native

A native Windows application for Study Helper voice commands and AI assistance that runs in the system tray and provides seamless integration with the Study Helper web app.

## Features

### Core Features
- **System Tray Integration**: Runs quietly in the background with easy access via system tray
- **Voice Command Recognition**: Always-listening voice activation with customizable wake word
- **API Key Authentication**: Secure connection to Study Helper web app via API key
- **Real-time Sync**: Bidirectional sync with Study Helper web app (localhost:3000)
- **Native Windows Integration**: Proper Windows notifications and UI styling

### Voice Features
- Configurable wake word (default: "Hey Study Helper")
- Adjustable speech rate and volume
- Confidence threshold tuning
- Continuous listening mode
- Auto-speak responses

### System Features
- Start with Windows option
- Minimize to tray functionality
- Customizable notifications
- Comprehensive logging
- Configuration persistence

## Requirements

- **Operating System**: Windows 10 (version 1809) or Windows 11
- **.NET SDK**: .NET 8.0 SDK (not just runtime) - [Download here](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Microphone**: Required for voice commands
- **Study Helper Web App**: Must be running on localhost:3000
- **Permissions**: Microphone access permission

> **Important**: You need the .NET 8.0 **SDK**, not just the runtime, to build and run this application from source.

## Quick Start

### Method 1: Using PowerShell (Recommended)
```powershell
# Navigate to the windows folder
cd c:\Users\Harshit\study-helper\windows

# Build and run
.\run.ps1 -Build

# Or just run if already built
.\run.ps1
```

### Method 2: Using Command Line
```cmd
# Navigate to the windows folder
cd c:\Users\Harshit\study-helper\windows

# Build and run
.\run.bat
```

### Method 3: Using .NET CLI
```cmd
# Navigate to the windows folder
cd c:\Users\Harshit\study-helper\windows

# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run the application
dotnet run
```

## Initial Setup

1. **Start the Study Helper Web App**
   ```bash
   # In the client folder
   cd c:\Users\Harshit\study-helper\client
   npm run dev
   ```
   Make sure it's running on http://localhost:3000

2. **Get Your API Key**
   - Open http://localhost:3000 in your browser
   - Sign in to your account
   - Go to Settings/Profile
   - Generate or copy your API key

3. **Configure the Windows App**
   - Start the Windows app using one of the methods above
   - Go to the "Configuration" tab
   - Enter your API key
   - Test the connection
   - Save settings

4. **Start Voice Assistant**
   - Go to the "Status" tab
   - Click "Start Voice Assistant"
   - The app will minimize to system tray
   - Say "Hey Study Helper" followed by your command

## Configuration

### API Settings
- **API Key**: Your personal API key from the web app
- **Base URL**: Usually http://localhost:3000 (default)
- **Timeout**: Request timeout in seconds (default: 30)

### Voice Settings
- **Speech Rate**: How fast the AI speaks (0.1 - 2.0)
- **Speech Volume**: Volume level (0.1 - 1.0)
- **Language**: Recognition language (default: en-US)
- **Activation Keyword**: Wake word phrase (default: "hey study helper")
- **Confidence Threshold**: Recognition sensitivity (0.1 - 1.0)
- **Auto Speak**: Automatically speak AI responses
- **Continuous Listening**: Keep listening after commands

### System Settings
- **Start with Windows**: Auto-start when Windows boots
- **Start Minimized**: Start hidden in system tray
- **Minimize to Tray**: Hide window when minimized
- **Show Notifications**: Display Windows notifications

## Usage

### System Tray Operations
- **Left Click**: Show/Hide main window
- **Right Click**: Context menu with options
  - Show Window
  - Hide Window
  - Start Voice Assistant
  - Stop Voice Assistant
  - Exit

### Voice Commands Examples
- "Hey Study Helper, create a study schedule for next week"
- "Hey Study Helper, what should I study today?"
- "Hey Study Helper, start a 25-minute focus session"
- "Hey Study Helper, show my study progress"
- "Hey Study Helper, remind me to review chemistry at 3 PM"
- "Hey Study Helper, help me understand this topic"

### Keyboard Shortcuts
- **Ctrl+Shift+S**: Global hotkey to activate voice assistant (when implemented)

## Publishing for Distribution

To create a standalone executable:

```powershell
# Create self-contained executable
.\run.ps1 -Publish
```

This creates a standalone application in `bin\Publish\` that doesn't require .NET runtime installation.

## Troubleshooting

### Common Issues

**"API connection failed"**
- Ensure Study Helper web app is running on localhost:3000
- Check your API key is correct
- Verify firewall isn't blocking connections

**"Voice recognition not working"**
- Check microphone permissions
- Ensure microphone is not muted
- Try adjusting confidence threshold
- Check selected language matches your speech

**"App doesn't start with Windows"**
- Run the app as administrator once
- Enable "Start with Windows" in settings
- Check Windows startup programs list

**"System tray icon missing"**
- Check if "Show hidden icons" is enabled in Windows
- Restart the application
- Check Windows notification area settings

### Logs and Debugging

The application logs to:
- Console output (when run from command line)
- Windows Event Log (for errors)
- Application logs (when implemented)

To view logs, use the "View Logs" button in the About tab.

## Development

### Building from Source
```bash
# Clone the repository
git clone <repository-url>
cd study-helper/windows

# Restore dependencies
dotnet restore

# Build
dotnet build

# Run
dotnet run
```

### Dependencies
- Microsoft.Extensions.Hosting
- Microsoft.Extensions.Configuration
- System.Speech (Windows Speech Recognition)
- NAudio (Audio processing)
- Newtonsoft.Json (JSON handling)
- System.Windows.Forms (System tray integration)

## Security Notes

- API keys are stored encrypted in user profile
- No sensitive data is logged
- All communications use HTTPS when available
- Microphone access is only active when listening

## Support

For issues with the Windows app:
1. Check this README for troubleshooting
2. Verify the web app is running correctly
3. Check Windows Event Logs for errors
4. Contact support with log files if needed
