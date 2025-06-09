import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  IconCamera,
  IconUpload,
  IconTrash,
  IconX,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import { InitialsAvatar } from './InitialsAvatar';
import { notifications } from '@/components/ui/notifications';

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  userName: string;
  onAvatarChange: (avatarUrl: string | null) => Promise<void>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ProfilePictureUpload({
  currentAvatarUrl,
  userName,
  onAvatarChange,
  size = 'xl'
}: ProfilePictureUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File upload handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      setError('Camera access denied or not available');
      console.error('Camera error:', error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  // Save avatar
  const handleSaveAvatar = useCallback(async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      // In a real implementation, you would upload the image to your server
      // For now, we'll just use the preview URL (data URL)
      await onAvatarChange(previewUrl);
      
      notifications.show({
        title: 'Success',
        message: 'Profile picture updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 4000
      });
      
      setIsModalOpen(false);
      setPreviewUrl(null);
    } catch {
      setError('Failed to update profile picture');
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile picture',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
        autoClose: 5000
      });
    } finally {
      setIsUploading(false);
    }
  }, [previewUrl, onAvatarChange]);

  // Remove avatar
  const handleRemoveAvatar = useCallback(async () => {
    try {
      await onAvatarChange(null);
      notifications.show({
        title: 'Success',
        message: 'Profile picture removed successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 4000
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove profile picture',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
        autoClose: 5000
      });
    }
  }, [onAvatarChange]);

  // Close modal handler
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setPreviewUrl(null);
    setError(null);
    stopCamera();
  }, [stopCamera]);

  return (
    <>
      <div className="flex items-center gap-4">
        <InitialsAvatar
          name={userName}
          src={currentAvatarUrl}
          size={size}
        />
        
        <div className="space-y-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <IconUpload size={16} className="mr-2 h-4 w-4" />
            Change Picture
          </Button>
          
          {currentAvatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={handleRemoveAvatar}
            >
              <IconTrash size={16} className="mr-2 h-4 w-4" />
              Remove Picture
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive" className="relative">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
                <button
                  onClick={() => setError(null)}
                  className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                  <IconX className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </Alert>
            )}

            {previewUrl ? (
              <div>
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Profile picture preview"
                    className="w-48 h-48 rounded-full object-cover"
                  />
                </div>
                
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewUrl(null)}
                  >
                    <IconX size={16} className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAvatar}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>Loading...</>
                    ) : (
                      <>
                        <IconCheck size={16} className="mr-2 h-4 w-4" />
                        Save Picture
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {isCameraActive ? (
                  <div>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-[400px] rounded-lg mx-auto"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={stopCamera}
                      >
                        <IconX size={16} className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                      >
                        <IconCamera size={16} className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="picture">Upload from device</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="picture"
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={startCamera}
                    >
                      <IconCamera size={16} className="mr-2 h-4 w-4" />
                      Use Camera
                    </Button>
                    
                    <p className="text-sm text-muted-foreground text-center">
                      Supported formats: JPG, PNG, GIF (max 5MB)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}