import { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Text,
  Group,
  Avatar,
  Stack,
  Textarea,
  Button,
  ActionIcon,
  Menu,
  Divider,
  ScrollArea,
  Badge,
  Popover,
  Tooltip,
  Loader,
  Box,
  Anchor
} from '@mantine/core';
import {
  IconSend,
  IconPaperclip,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconFileText,
  IconPhoto,
  IconBrandGoogleDrive,
  IconLink,
  IconDragDrop,
  IconUser,
  IconDownload
} from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useGoogle } from '@/context/GoogleContext';
import { api } from '@/api';
import { Comment, Attachment, User } from '@/types/task';
import { notifications } from '@mantine/notifications';
import { useTheme } from '@/context/ThemeContext';

interface TaskChatProps {
  taskId: string;
  onCommentCountChange?: (count: number) => void;
}

export function TaskChat({ taskId, onCommentCountChange }: TaskChatProps) {
  const { currentUser } = useApp();
  const { colors } = useTheme();
  const { driveFiles, fetchDriveFiles, isAuthenticated } = useGoogle();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [mentionPopupOpen, setMentionPopupOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [drivePopupOpen, setDrivePopupOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCursorPos = useRef<number>(0);
  
  // Fetch comments, attachments, and users
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [commentsRes, attachmentsRes, usersRes] = await Promise.all([
          apiHandler(() => api.comments.getByTaskId(taskId)),
          apiHandler(() => api.attachments.getByTaskId(taskId)),
          apiHandler(() => api.users.getAll())
        ]);
        
        if (commentsRes.data) setComments(commentsRes.data);
        if (attachmentsRes.data) setAttachments(attachmentsRes.data);
        if (usersRes.data) setUsers(usersRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    // If authenticated with Google, fetch drive files
    if (isAuthenticated) {
      fetchDriveFiles();
    }
  }, [taskId, isAuthenticated, fetchDriveFiles]);
  
  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (scrollAreaRef.current && !loading) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTo({
        top: scrollArea.scrollHeight,
        behavior: 'smooth'
      });
    }

    // Notify parent component about comment count changes
    if (onCommentCountChange && !loading) {
      onCommentCountChange(comments.length);
    }
  }, [comments, loading, onCommentCountChange]);
  
  // Handle message submission
  const handleSubmit = async () => {
    if (!message.trim() || !currentUser) return;
    
    try {
      // Extract mentions from message
      const mentionRegex = /@(\w+)/g;
      const mentions = [...message.matchAll(mentionRegex)].map(match => match[1]);
      
      // Find user IDs for mentioned usernames
      const mentionedUserIds = users
        .filter(user => {
          const username = user.name.toLowerCase().replace(/\s+/g, '');
          return mentions.some(mention => 
            username === mention.toLowerCase() || 
            user.name.toLowerCase().includes(mention.toLowerCase())
          );
        })
        .map(user => user.id);
      
      // Create new comment
      const { data, error } = await apiHandler(() => 
        api.comments.create({
          taskId,
          authorId: currentUser.id,
          text: message,
          mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
          createdAt: new Date().toISOString()
        })
      );
      
      if (error) throw new Error(error);
      
      if (data) {
        setComments(prev => [...prev, data]);
        setMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message. Please try again.',
        color: 'red'
      });
    }
  };
  
  // Handle comment edit
  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;
    
    try {
      const { data, error } = await apiHandler(() => 
        api.comments.update(commentId, editText)
      );
      
      if (error) throw new Error(error);
      
      if (data) {
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId ? data : comment
          )
        );
        setEditingComment(null);
        setEditText('');
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to edit comment. Please try again.',
        color: 'red'
      });
    }
  };
  
  // Handle comment delete
  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiHandler(() => api.comments.delete(commentId));
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete comment. Please try again.',
        color: 'red'
      });
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file || !currentUser) return;
    
    setUploadLoading(true);
    try {
      const { data, error } = await apiHandler(() => 
        api.attachments.upload(
          {
            name: file.name,
            type: file.type,
            size: file.size
          },
          taskId
        )
      );
      
      if (error) throw new Error(error);
      
      if (data) {
        setAttachments(prev => [...prev, data]);
        
        // Automatically add a comment about the file
        await apiHandler(() => 
          api.comments.create({
            taskId,
            authorId: currentUser.id,
            text: `Uploaded file: ${file.name}`,
            createdAt: new Date().toISOString()
          })
        );
        
        // Reload comments
        const { data: commentsData } = await apiHandler(() => 
          api.comments.getByTaskId(taskId)
        );
        
        if (commentsData) {
          setComments(commentsData);
        }
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to upload file. Please try again.',
        color: 'red'
      });
    } finally {
      setUploadLoading(false);
    }
  };
  
  // Handle drive link attachment
  const handleDriveAttachment = async (driveFile: { id: string, name: string, url: string }) => {
    if (!currentUser) return;
    
    try {
      // Create a comment with the Google Drive link
      const { data, error } = await apiHandler(() => 
        api.comments.create({
          taskId,
          authorId: currentUser.id,
          text: `Attached Google Drive file: [${driveFile.name}](${driveFile.url})`,
          createdAt: new Date().toISOString()
        })
      );
      
      if (error) throw new Error(error);
      
      if (data) {
        setComments(prev => [...prev, data]);
        setDrivePopupOpen(false);
      }
    } catch (error) {
      console.error('Failed to attach drive file:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to attach Google Drive file. Please try again.',
        color: 'red'
      });
    }
  };
  
  // Handle message input
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Check if the user is typing @
    const cursorPosition = e.target.selectionStart || 0;
    const lastAtSymbolIndex = value.substring(0, cursorPosition).lastIndexOf('@');
    
    if (lastAtSymbolIndex !== -1 && lastAtSymbolIndex === cursorPosition - 1) {
      // User just typed @
      setMentionPopupOpen(true);
      setMentionQuery('');
      lastCursorPos.current = cursorPosition;
    } else if (lastAtSymbolIndex !== -1 && cursorPosition > lastAtSymbolIndex + 1) {
      // User is typing after @
      const query = value.substring(lastAtSymbolIndex + 1, cursorPosition);
      setMentionQuery(query);
      setMentionPopupOpen(true);
      lastCursorPos.current = cursorPosition;
    } else {
      // No @ found or cursor moved away
      setMentionPopupOpen(false);
    }
  };
  
  // Handle mention selection
  const handleSelectMention = (username: string) => {
    // Replace @query with @username
    const beforeCursor = message.substring(0, lastCursorPos.current - mentionQuery.length - 1);
    const afterCursor = message.substring(lastCursorPos.current);
    const newMessage = `${beforeCursor}@${username}${afterCursor}`;
    
    setMessage(newMessage);
    setMentionPopupOpen(false);
    
    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPos = beforeCursor.length + username.length + 1;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }
  };
  
  // Filter users based on mention query
  const filteredUsers = users.filter(user => {
    if (!mentionQuery) return true;
    return (
      user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      (user.email?.toLowerCase().includes(mentionQuery.toLowerCase()))
    );
  }).slice(0, 5);
  
  // Format message text with linkified @mentions
  const formatMessage = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    
    // Regex for @mentions
    const mentionRegex = /@(\w+)/g;
    let match;
    
    // Regex for links like [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // First, handle markdown-style links
    let textWithProcessedLinks = text;
    let linkMatches = [...text.matchAll(linkRegex)];
    
    if (linkMatches.length > 0) {
      let offset = 0;
      for (const linkMatch of linkMatches) {
        const originalText = linkMatch[0];
        const linkText = linkMatch[1];
        // We use linkMatch[2] later in the rendering of links
        const startIndex = (linkMatch.index || 0) - offset;
        const endIndex = startIndex + originalText.length;
        
        // Replace the markdown link with just the text part
        textWithProcessedLinks = 
          textWithProcessedLinks.substring(0, startIndex) + 
          linkText + 
          textWithProcessedLinks.substring(endIndex);
        
        // Adjust offset for future replacements
        offset += originalText.length - linkText.length;
      }
    }
    
    // Then handle @mentions
    while ((match = mentionRegex.exec(textWithProcessedLinks)) !== null) {
      const matchedText = match[0]; // The full @username
      const username = match[1]; // Just the username part
      const startIndex = match.index;
      
      // Add text before this mention
      if (startIndex > lastIndex) {
        parts.push(textWithProcessedLinks.substring(lastIndex, startIndex));
      }
      
      // Find if this username matches a user
      const mentionedUser = users.find(user => 
        user.name.toLowerCase().replace(/\s+/g, '') === username.toLowerCase() ||
        user.name.toLowerCase().includes(username.toLowerCase())
      );
      
      if (mentionedUser) {
        // Add styled mention
        parts.push(
          <Badge key={`${startIndex}-${username}`} color="blue" variant="light">
            @{username}
          </Badge>
        );
      } else {
        // No matching user, just add the text
        parts.push(matchedText);
      }
      
      lastIndex = startIndex + matchedText.length;
    }
    
    // Add any remaining text
    if (lastIndex < textWithProcessedLinks.length) {
      parts.push(textWithProcessedLinks.substring(lastIndex));
    }
    
    // Now check for links after processing mentions
    const processedText = (
      <>
        {parts.map((part, index) => {
          if (typeof part === 'string') {
            // Process the urls in this string part
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urlParts = [];
            let lastUrlIndex = 0;
            let urlMatch;
            
            while ((urlMatch = urlRegex.exec(part)) !== null) {
              const url = urlMatch[0];
              const urlStartIndex = urlMatch.index;
              
              // Add text before this url
              if (urlStartIndex > lastUrlIndex) {
                urlParts.push(part.substring(lastUrlIndex, urlStartIndex));
              }
              
              // Add the url as a link
              urlParts.push(
                <Anchor 
                  key={`url-${urlStartIndex}`} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {url}
                </Anchor>
              );
              
              lastUrlIndex = urlStartIndex + url.length;
            }
            
            // Add any remaining text
            if (lastUrlIndex < part.length) {
              urlParts.push(part.substring(lastUrlIndex));
            }
            
            return <span key={index}>{urlParts}</span>;
          }
          return part;
        })}
      </>
    );
    
    // Process markdown-style links that were stored earlier
    if (linkMatches.length > 0) {
      return (
        <>
          {processedText}
          {linkMatches.map((linkMatch, index) => {
            const linkText = linkMatch[1];
            const url = linkMatch[2];
            
            return (
              <Box key={`link-${index}`} mt={5}>
                <Anchor href={url} target="_blank" rel="noopener noreferrer">
                  <Group gap="xs">
                    {url.includes('drive.google.com') ? (
                      <IconBrandGoogleDrive size={16} />
                    ) : (
                      <IconLink size={16} />
                    )}
                    <span>{linkText}</span>
                  </Group>
                </Anchor>
              </Box>
            );
          })}
        </>
      );
    }
    
    return processedText;
  };
  
  // Get user by ID
  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);
    
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Handle drag and drop file upload
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileUpload(event.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFileUpload(event.target.files[0]);
    }
  };
  
  if (loading) {
    return (
      <Paper p="md" withBorder>
        <Stack align="center" py="xl">
          <Loader size="md" />
          <Text c="dimmed">Loading conversation...</Text>
        </Stack>
      </Paper>
    );
  }
  
  return (
    <Paper 
      p="md" 
      withBorder 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '500px' 
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Group justify="space-between" mb="md">
        <Text fw={500}>Task Conversation</Text>
        <Group>
          <Text size="sm" c="dimmed">{comments.length} comments</Text>
          <Text size="sm" c="dimmed">•</Text>
          <Text size="sm" c="dimmed">{attachments.length} attachments</Text>
        </Group>
      </Group>
      
      <Divider mb="md" />
      
      <ScrollArea flex={1} viewportRef={scrollAreaRef}>
        {comments.length === 0 ? (
          <Stack align="center" justify="center" h="100%" py="xl">
            <IconFileText size={48} opacity={0.5} />
            <Text c="dimmed">No comments yet</Text>
            <Text size="sm" c="dimmed">
              Start the conversation or drag & drop files to share
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {comments.map(comment => {
              const user = getUserById(comment.authorId);
              const isCurrentUser = user?.id === currentUser?.id;
              
              return (
                <Box key={comment.id}>
                  <Group justify={isCurrentUser ? 'flex-end' : 'flex-start'} wrap="nowrap" align="flex-start">
                    {!isCurrentUser && (
                      <Avatar 
                        src={user?.avatarUrl} 
                        radius="xl" 
                        size="sm"
                        color={user ? undefined : 'blue'}
                      >
                        {!user?.avatarUrl && <IconUser size={20} />}
                      </Avatar>
                    )}
                    
                    <Box
                      style={{
                        maxWidth: '75%',
                        backgroundColor: isCurrentUser ? colors.highlight : colors.cardBackground,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        position: 'relative'
                      }}
                    >
                      <Group justify="space-between" mb={4}>
                        <Text size="sm" fw={500}>
                          {user?.name || 'Unknown User'}
                        </Text>
                        
                        <Group gap={8}>
                          <Text size="xs" c="dimmed">
                            {formatDate(comment.createdAt)}
                          </Text>
                          
                          {isCurrentUser && (
                            <Menu position="bottom-end" withArrow withinPortal>
                              <Menu.Target>
                                <ActionIcon size="xs" variant="subtle">
                                  <IconDotsVertical size={12} />
                                </ActionIcon>
                              </Menu.Target>
                              
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => {
                                    setEditingComment(comment.id);
                                    setEditText(comment.text);
                                  }}
                                >
                                  Edit
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  Delete
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          )}
                        </Group>
                      </Group>
                      
                      {editingComment === comment.id ? (
                        <Stack>
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            minRows={2}
                            autosize
                          />
                          <Group justify="flex-end">
                            <Button 
                              variant="subtle" 
                              size="xs"
                              onClick={() => {
                                setEditingComment(null);
                                setEditText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="xs"
                              onClick={() => handleEditComment(comment.id)}
                            >
                              Save
                            </Button>
                          </Group>
                        </Stack>
                      ) : (
                        <Text size="sm">
                          {formatMessage(comment.text)}
                        </Text>
                      )}
                    </Box>
                    
                    {isCurrentUser && (
                      <Avatar 
                        src={user?.avatarUrl} 
                        radius="xl" 
                        size="sm"
                        color={user ? undefined : 'blue'}
                      >
                        {!user?.avatarUrl && <IconUser size={20} />}
                      </Avatar>
                    )}
                  </Group>
                  
                  {comment.updatedAt && (
                    <Text
                      size="xs"
                      c="dimmed"
                      ta={isCurrentUser ? 'right' : 'left'}
                      mt={4}
                      style={{
                        marginLeft: isCurrentUser ? 0 : 35,
                        marginRight: isCurrentUser ? 35 : 0
                      }}
                    >
                      Edited {formatDate(comment.updatedAt)}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </ScrollArea>
      
      <Divider my="md" />
      
      {uploadLoading && (
        <Group justify="center" my="xs">
          <Loader size="sm" />
          <Text size="sm">Uploading file...</Text>
        </Group>
      )}
      
      <Popover
        position="top"
        width={300}
        opened={mentionPopupOpen}
        onChange={setMentionPopupOpen}
        withArrow
        withinPortal
        closeOnClickOutside
        shadow="md"
      >
        <Popover.Target>
          <div>
            <Textarea
              ref={textareaRef}
              placeholder="Type your message... Use @ to mention someone"
              value={message}
              onChange={handleMessageChange}
              minRows={2}
              maxRows={5}
              autosize
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
        </Popover.Target>
        
        <Popover.Dropdown>
          <Stack gap="xs">
            <Text size="xs" fw={700} c="dimmed">MENTION SOMEONE</Text>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <Button
                  key={user.id}
                  variant="subtle"
                  leftSection={
                    <Avatar 
                      src={user.avatarUrl} 
                      size="xs" 
                      radius="xl"
                    />
                  }
                  onClick={() => handleSelectMention(user.name.replace(/\s+/g, ''))}
                  fullWidth
                  justify="flex-start"
                >
                  {user.name}
                </Button>
              ))
            ) : (
              <Text size="sm" c="dimmed" ta="center">No users found</Text>
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>
      
      <Group mt="md" align="flex-end">
        <div style={{ position: 'relative', flex: 1 }}>
          {message === '' && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '8px 12px',
                pointerEvents: 'none'
              }}
            >
              <Tooltip label="Drop files here to upload">
                <span style={{ display: 'inline-block' }}>
                  <Group gap={6} opacity={0.6}>
                    <IconDragDrop size={16} />
                    <Text size="xs">Drop files here to upload</Text>
                  </Group>
                </span>
              </Tooltip>
            </div>
          )}
        </div>
        
        <Group>
          <Popover
            position="top-end"
            width={300}
            opened={drivePopupOpen}
            onChange={setDrivePopupOpen}
            withArrow
            withinPortal
            shadow="md"
          >
            <Popover.Target>
              <Tooltip label="Attach from Google Drive">
                <span style={{ display: 'inline-block' }}>
                  <ActionIcon
                    variant="light"
                    onClick={() => {
                      if (isAuthenticated) {
                        setDrivePopupOpen(true);
                      } else {
                        notifications.show({
                        title: 'Not connected',
                        message: 'Connect to Google Drive first in the Google Integration page',
                        color: 'yellow'
                      });
                    }
                  }}
                >
                  <IconBrandGoogleDrive size={18} />
                </ActionIcon>
                </span>
              </Tooltip>
            </Popover.Target>
            
            <Popover.Dropdown>
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed">SELECT FROM GOOGLE DRIVE</Text>
                {driveFiles.length > 0 ? (
                  <ScrollArea h={200}>
                    <Stack gap="xs">
                      {driveFiles.map(file => (
                        <Button
                          key={file.id}
                          variant="subtle"
                          leftSection={<IconFileText size={14} />}
                          onClick={() => handleDriveAttachment({
                            id: file.id,
                            name: file.name,
                            url: file.webViewLink
                          })}
                          fullWidth
                          justify="flex-start"
                        >
                          {file.name}
                        </Button>
                      ))}
                    </Stack>
                  </ScrollArea>
                ) : (
                  <Text size="sm" c="dimmed" ta="center">
                    No files found in Google Drive
                  </Text>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>
          
          <Tooltip label="Attach file">
            <span style={{ display: 'inline-block' }}>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />
                <ActionIcon
                  variant="light"
                  component="label"
                  htmlFor="file-upload"
                >
                  <IconPaperclip size={18} />
                </ActionIcon>
              </div>
            </span>
          </Tooltip>
          
          <Button
            disabled={!message.trim()}
            onClick={handleSubmit}
            rightSection={<IconSend size={14} />}
          >
            Send
          </Button>
        </Group>
      </Group>
      
      {attachments.length > 0 && (
        <>
          <Divider my="md" label="Attachments" labelPosition="center" />
          
          <ScrollArea h={100}>
            <Group>
              {attachments.map(attachment => {
                const isImage = attachment.fileType.startsWith('image/');
                
                return (
                  <Paper key={attachment.id} p="xs" withBorder>
                    <Group gap="xs">
                      {isImage ? (
                        <IconPhoto size={24} />
                      ) : (
                        <IconFileText size={24} />
                      )}
                      
                      <div>
                        <Text size="sm" lineClamp={1}>
                          {attachment.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatFileSize(attachment.size)}
                        </Text>
                      </div>
                      
                      <ActionIcon
                        variant="subtle"
                        component="a"
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconDownload size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                );
              })}
            </Group>
          </ScrollArea>
        </>
      )}
    </Paper>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}