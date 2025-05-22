import { useState, useRef, useCallback } from 'react';
import {
  Group,
  Button,
  Text,
  Modal,
  Stack,
  FileInput,
  Alert,
  Image,
  Center,
  Box
} from '@mantine/core';
import {
  IconCamera,
  IconUpload,
  IconTrash,
  IconX,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import { InitialsAvatar } from './InitialsAvatar';
import { notifications } from '@mantine/notifications';

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
  const handleFileSelect = useCallback((file: File | null) => {
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
        autoClose: 4000,
        withCloseButton: true,
        style: { maxWidth: 350 }
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
        autoClose: 5000,
        withCloseButton: true,
        style: { maxWidth: 350 }
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
        autoClose: 4000,
        withCloseButton: true,
        style: { maxWidth: 350 }
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove profile picture',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
        autoClose: 5000,
        withCloseButton: true,
        style: { maxWidth: 350 }
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
      <Group gap="md">
        <InitialsAvatar
          name={userName}
          src={currentAvatarUrl}
          size={size}
        />
        
        <Stack gap="xs">
          <Button
            variant="light"
            size="sm"
            leftSection={<IconUpload size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Change Picture
          </Button>
          
          {currentAvatarUrl && (
            <Button
              variant="subtle"
              size="sm"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={handleRemoveAvatar}
            >
              Remove Picture
            </Button>
          )}
        </Stack>
      </Group>

      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title="Update Profile Picture"
        centered
        size="md"
      >
        <Stack gap="md">
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              onClose={() => setError(null)}
              withCloseButton
            >
              {error}
            </Alert>
          )}

          {previewUrl ? (
            <Box>
              <Center>
                <Image
                  src={previewUrl}
                  alt="Profile picture preview"
                  fit="cover"
                  w={200}
                  h={200}
                  radius="xl"
                />
              </Center>
              
              <Group justify="center" mt="md">
                <Button
                  variant="outline"
                  onClick={() => setPreviewUrl(null)}
                  leftSection={<IconX size={16} />}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAvatar}
                  loading={isUploading}
                  leftSection={<IconCheck size={16} />}
                >
                  Save Picture
                </Button>
              </Group>
            </Box>
          ) : (
            <>
              {isCameraActive ? (
                <Box>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: '8px'
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  <Group justify="center" mt="md">
                    <Button
                      variant="outline"
                      onClick={stopCamera}
                      leftSection={<IconX size={16} />}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      leftSection={<IconCamera size={16} />}
                    >
                      Take Photo
                    </Button>
                  </Group>
                </Box>
              ) : (
                <Stack gap="md">
                  <FileInput
                    ref={fileInputRef}
                    label="Upload from device"
                    placeholder="Select image file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    leftSection={<IconUpload size={16} />}
                  />
                  
                  <Button
                    variant="light"
                    fullWidth
                    leftSection={<IconCamera size={16} />}
                    onClick={startCamera}
                  >
                    Use Camera
                  </Button>
                  
                  <Text size="sm" c="dimmed" ta="center">
                    Supported formats: JPG, PNG, GIF (max 5MB)
                  </Text>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}