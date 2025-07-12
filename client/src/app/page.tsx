'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  BrainCircuit, 
  Calendar, 
  MessageSquare,
  Mic,
  Target,
  Sparkles,
  CheckCircle,
  Clock,
  BookOpen,
  Users,
  BarChart3,
  Zap,
  Star,
  Brain,
  Timer,
  TrendingUp,
  Lightbulb,
  Play,
  Pause,
  Shield,
  Globe,
  Smartphone
} from 'lucide-react';

export default function Home() {
  const { data: session } = useSession();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };
  const features = [
    {
      icon: BrainCircuit,
      title: 'AI Study Assistant',
      description: 'Get instant help with homework and study questions from our advanced AI tutor that understands your learning style.',
      color: 'text-blue-500',
      gradient: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      icon: Target,
      title: 'Study Tracker',
      description: 'Track your learning progress with detailed analytics, confidence ratings, and personalized study insights.',
      color: 'text-emerald-500',
      gradient: 'from-emerald-500/10 to-green-500/10'
    },
    {
      icon: Mic,
      title: 'Voice Commands',
      description: 'Control your study environment hands-free with advanced voice recognition and natural language processing.',
      color: 'text-green-500',
      gradient: 'from-green-500/10 to-emerald-500/10'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Organize your tasks and study sessions with AI-powered planning that adapts to your schedule.',
      color: 'text-purple-500',
      gradient: 'from-purple-500/10 to-pink-500/10'
    },
    {
      icon: Timer,
      title: 'Session Tracking',
      description: 'Monitor study time, track confidence levels, and maintain detailed notes for each learning session.',
      color: 'text-orange-500',
      gradient: 'from-orange-500/10 to-red-500/10'
    },
    {
      icon: Lightbulb,
      title: 'AI Study Tips',
      description: 'Receive personalized study suggestions and learning strategies based on your progress and performance.',
      color: 'text-amber-500',
      gradient: 'from-amber-500/10 to-yellow-500/10'
    }
  ];

  const stats = [
    { icon: Users, label: 'Active Students', value: '1,000+', color: 'text-blue-500' },
    { icon: MessageSquare, label: 'AI Conversations', value: '10,000+', color: 'text-green-500' },
    { icon: Clock, label: 'Study Hours Tracked', value: '5,000+', color: 'text-purple-500' },
    { icon: Star, label: 'Student Success Rate', value: '94%', color: 'text-orange-500' }
  ];

  const studyTrackerFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Progress Analysis',
      description: 'Get intelligent insights into your learning patterns and receive personalized recommendations.'
    },
    {
      icon: Timer,
      title: 'Real-time Study Sessions',
      description: 'Track your study time with precision, including breaks and productivity metrics.'
    },
    {
      icon: TrendingUp,
      title: 'Confidence Tracking',
      description: 'Rate your understanding and track how your confidence grows over time.'
    },
    {
      icon: BookOpen,
      title: 'Topic Organization',
      description: 'Organize your studies by subjects with subtopics, difficulty levels, and progress tracking.'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Boost Productivity',
      description: 'Stay organized and focused with AI-powered study tools that adapt to your learning style'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your study data is secure and private. We prioritize your academic confidentiality'
    },
    {
      icon: Globe,
      title: 'Access Anywhere',
      description: 'Study from any device with our responsive web application and cross-platform support'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Full functionality on mobile devices for studying on-the-go'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-32 h-32 bg-secondary/5 rounded-full blur-xl"
            animate={{
              y: [0, 30, 0],
              x: [0, -15, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div
            className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"
            animate={{
              y: [0, -25, 0],
              x: [0, 20, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Sparkles className="h-4 w-4" />
              AI-Powered Study Assistant
            </motion.div>

            <motion.h1 
              className="text-5xl lg:text-7xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
            >
              Study{' '}
              <span className="bg-gradient-to-r from-primary via-purple-600 to-secondary bg-clip-text text-transparent">
                Helper
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Transform your learning experience with AI-powered assistance, comprehensive study tracking, 
              smart scheduling, and personalized insights that adapt to your unique learning journey. 
              Track your progress, get AI study tips, and achieve your academic goals faster than ever.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="group relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="lg" className="group relative overflow-hidden">
                      <span className="relative z-10 flex items-center">
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button variant="outline" size="lg" className="group">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >                  <motion.div 
                    className={`inline-flex p-3 rounded-full bg-background shadow-sm mb-3 ${stat.color}`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </motion.div>
                  <motion.h3 
                    className="text-2xl font-bold text-foreground mb-1"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    {stat.value}
                  </motion.h3>
                  <p className="text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Star className="h-4 w-4" />
              Powerful Features
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                excel
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover powerful tools designed to enhance your learning experience and boost your academic performance.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full bg-gradient-to-br from-background to-muted/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <motion.div 
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <IconComponent className={`h-6 w-6 ${feature.color}`} />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Study Tracker Spotlight Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-secondary/5">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Target className="h-4 w-4" />
              Study Tracker
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Track Your{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                Learning Journey
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Monitor your progress with detailed analytics, AI-powered insights, and comprehensive study session tracking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Study Tracker Features */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {studyTrackerFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Visual Demo */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-background rounded-2xl p-6 shadow-2xl border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Current Study Session</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                      <Play className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mathematics - Calculus</span>
                      <span className="font-mono font-medium">24:35</span>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div 
                        className="h-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "75%" }}
                        transition={{ delay: 1, duration: 1.5 }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="text-lg font-semibold text-emerald-600">4.2</div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">89%</div>
                        <div className="text-xs text-muted-foreground">Progress</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <div className="text-lg font-semibold text-purple-600">12</div>
                        <div className="text-xs text-muted-foreground">Sessions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Why choose Study Helper?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple tools designed to enhance your learning experience
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>      {/* CTA Section */}
      <section className="py-20 bg-background border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6">
              <div className="inline-flex p-3 bg-primary/10 rounded-full">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Try our AI-powered study assistant and see how it can help with your learning.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!session && (
                <Link href="/auth/signup">
                  <Button size="lg" className="group">
                    Start Learning Today
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Link href="/chat">
                <Button variant="outline" size="lg">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Try AI Chat Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
