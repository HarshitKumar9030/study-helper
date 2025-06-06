"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Camera,
  User,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  Loader2,
  Upload,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { getAvatarUrl, getUserInitials, notifyAvatarUpdate } from '@/lib/avatar-utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: {
    url: string;
    publicId: string;
  };
  role: string;
  createdAt: string;
}

const ProfilePage = () => {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchUserProfile();
  }, [session, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          bio: data.user.bio || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name,
        bio: formData.bio,
      };

      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'New passwords do not match',
            variant: 'destructive',
          });
          return;
        }
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
        
        // Update session with new name
        await updateSession();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setShowPasswordDialog(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();      if (response.ok) {
        setUser(prev => prev ? { ...prev, avatar: data.avatar } : null);        toast({
          title: 'Success',
          description: 'Avatar updated successfully',
        });
        await updateSession();
        // Dispatch event to update navbar avatar
        notifyAvatarUpdate();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to upload avatar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
      });      if (response.ok) {
        setUser(prev => prev ? { ...prev, avatar: undefined } : null);        toast({
          title: 'Success',
          description: 'Avatar deleted successfully',
        });
        await updateSession();
        // Dispatch event to update navbar avatar
        notifyAvatarUpdate();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete avatar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete avatar',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      handleAvatarUpload(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>User not found</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              My Profile
            </h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </div>        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <Card className="lg:col-span-1 border-border">
            <CardHeader className="text-center">
              <div className="relative mx-auto">                <Avatar className="h-32 w-32 border-4 border-border shadow-lg">                  <AvatarImage 
                    src={getAvatarUrl(user.avatar)} 
                    alt={user.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload Button */}
                <div className="absolute -bottom-2 -right-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
              
              {user.avatar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Avatar
                </Button>
              )}
            </CardContent>
          </Card>          {/* Profile Information */}
          <Card className="lg:col-span-2 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                      setFormData({
                        name: user.name || '',
                        bio: user.bio || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className={isEditing ? "" : "bg-primary hover:bg-primary/90"}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-card"
                  />
                ) : (
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {user.name}
                  </p>
                )}
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="bg-card min-h-[100px]"
                    maxLength={500}
                  />
                ) : (
                  <p className="text-sm bg-muted p-3 rounded-md min-h-[60px]">
                    {user.bio || "No bio provided"}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/500 characters
                  </p>
                )}
              </div>

              {/* Email Field (Read-only) */}              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <p className="text-sm bg-muted p-3 rounded-md text-muted-foreground">
                  {user.email} (Cannot be changed)
                </p>
              </div>

              {isEditing && (
                <>
                  <Separator />
                  
                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Password</Label>
                        <p className="text-xs text-muted-foreground">
                          Leave blank to keep current password
                        </p>
                      </div>
                      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Enter your current password and choose a new one.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <Separator />
                    {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
