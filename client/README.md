# Study Helper - AI-Powered Learning Assistant

> ⚠️ **This project is currently under active development**  
> Features may be incomplete or subject to change. Please report any issues you encounter.

## 🎓 About

Study Helper is a modern AI-powered learning assistant built with Next.js. It provides students with intelligent tools to enhance their academic performance through interactive chat, voice commands, and smart scheduling.

## ✨ Features

### Current Features
- 🤖 **AI Chat Assistant** - Get instant help with your studies using Google's Gemini AI
- 🎙️ **Voice Assistant** - Hands-free interaction with voice commands
- 📅 **Smart Scheduler** - Plan your study sessions intelligently
- 🌓 **Dark/Light Mode** - Comfortable viewing in any environment
- 🔐 **Authentication** - Secure user accounts with NextAuth.js
- 📱 **Responsive Design** - Works seamlessly on all devices

### In Development
- Advanced analytics and progress tracking
- Enhanced AI capabilities
- Calendar integrations
- Study group features
- Mobile app companion

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0 or later
- pnpm (recommended) or npm
- MongoDB database
- Google Gemini AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd study-helper/client
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **AI Integration**: Google Gemini AI
- **Animations**: Framer Motion
- **File Upload**: Cloudinary
- **Language**: TypeScript
- **Package Manager**: pnpm

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── chat/              # AI Chat interface
│   ├── dashboard/         # User dashboard
│   ├── profile/           # User profile
│   ├── scheduler/         # Study scheduler
│   └── voice/             # Voice assistant
├── components/            # Reusable UI components
│   ├── ai/               # AI-related components
│   ├── common/           # Shared components
│   ├── features/         # Feature-specific components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── ai/               # AI service integrations
│   ├── hooks/            # Custom React hooks
│   └── models/           # Database models
└── types/                # TypeScript type definitions
```

## 🧪 Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🔧 Development Status

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Complete | NextAuth.js integration |
| AI Chat | ✅ Complete | Gemini AI integration |
| Voice Assistant | 🚧 In Progress | Basic functionality implemented |
| Smart Scheduler | 🚧 In Progress | Core features working |
| Dashboard | ✅ Complete | Real-time data integration |
| Profile Management | ✅ Complete | Basic user settings |
| Mobile Responsiveness | ✅ Complete | Fully responsive design |

## 🤝 Contributing

As this project is under development, contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Known Issues

- Voice assistant may require browser permissions
- Some features may not work in older browsers
- Database migrations are manual during development

## 📧 Support

If you encounter any issues or have questions:
- Check the GitHub issues
- Review the documentation
- Contact the development team

## 📄 License

This project is currently under development and not yet licensed for public use.

---

**Note**: This is an active development project. Features and documentation are subject to change.
