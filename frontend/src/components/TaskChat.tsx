import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { useGoogle } from '@/hooks/useGoogle';
import { api } from '@/api';
import { Comment, Attachment, User } from '@/types/task';
import { notifications } from '@/components/ui/notifications';

interface TaskChatProps {
  taskId: string;
  onCommentCountChange?: (count: number) => void;
}

function TaskChatContent({ taskId, onCommentCountChange }: TaskChatProps) {
  const { currentUser } = useApp();
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
          api.comments.getByTaskId(taskId),
          api.attachments.getByTaskId(taskId),
          api.admin.getAllUsers()
        ]);
        
        if (commentsRes) setComments(commentsRes as unknown as Comment[]);
        if (attachmentsRes) setAttachments(attachmentsRes as unknown as Attachment[]);
        if (usersRes) setUsers(usersRes as unknown as User[]);
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
      // const mentionRegex = /@(\w+)/g;
      // const mentions = [...message.matchAll(mentionRegex)].map(match => match[1]);
      
      // Find user IDs for mentioned usernames
      // const mentionedUserIds = users
      //   .filter(user => {
      //     const username = user.name.toLowerCase().replace(/\s+/g, '');
      //     return mentions.some(mention => 
      //       username === mention.toLowerCase() || 
      //       user.name.toLowerCase().includes(mention.toLowerCase())
      //     );
      //   })
      //   .map(user => user.id);
      
      // Create new comment
      const data = await api.comments.create(taskId, message);
      
      if (data) {
        setComments(prev => [...prev, data as unknown as Comment]);
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
      const data = await api.comments.update(commentId, editText);
      
      if (data) {
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId ? data as unknown as Comment : comment
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
      await api.comments.delete(commentId);
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
      const data = await api.attachments.upload(taskId, file);
      
      if (data) {
        setAttachments(prev => [...prev, data as unknown as Attachment]);
        
        // Automatically add a comment about the file
        await api.comments.create(taskId, `Uploaded file: ${file.name}`);
        
        // Reload comments
        const commentsData = await api.comments.getByTaskId(taskId);
        
        if (commentsData) {
          setComments(commentsData as unknown as Comment[]);
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
      const data = await api.comments.create(taskId, `Attached Google Drive file: [${driveFile.name}](${driveFile.url})`);
      
      if (data) {
        setComments(prev => [...prev, data as unknown as Comment]);
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
    let match: RegExpExecArray | null;
    
    // Regex for links like [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // First, handle markdown-style links
    let textWithProcessedLinks = text;
    const linkMatches = [...text.matchAll(linkRegex)];
    
    if (linkMatches.length > 0) {
      let offset = 0;
      for (const linkMatch of linkMatches as RegExpMatchArray[]) {
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
          <Badge key={`${startIndex}-${username}`} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
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
            let urlMatch: RegExpExecArray | null;
            
            while ((urlMatch = urlRegex.exec(part)) !== null) {
              const url = urlMatch[0];
              const urlStartIndex = urlMatch.index;
              
              // Add text before this url
              if (urlStartIndex > lastUrlIndex) {
                urlParts.push(part.substring(lastUrlIndex, urlStartIndex));
              }
              
              // Add the url as a link
              urlParts.push(
                <a 
                  key={`url-${urlStartIndex}`} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {url}
                </a>
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
              <div key={`link-${index}`} className="mt-2">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {url.includes('drive.google.com') ? (
                    <IconBrandGoogleDrive size={16} />
                  ) : (
                    <IconLink size={16} />
                  )}
                  <span>{linkText}</span>
                </a>
              </div>
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
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-2">Loading conversation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card 
      className="flex flex-col h-[500px]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium">Task Conversation</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{comments.length} comments</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{attachments.length} attachments</span>
          </div>
        </div>
        
        <Separator className="mb-4" />
      
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <IconFileText size={48} className="opacity-50" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground">
                Start the conversation or drag & drop files to share
              </p>
            </div>
          ) : (
            <div className="space-y-4">
            {comments.map(comment => {
              const user = getUserById(comment.authorId);
              const isCurrentUser = user?.id === currentUser?.id;
              
              return (
                <div key={comment.id}>
                  <div className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback>{user?.name?.[0] || <IconUser size={20} />}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[75%] p-3 rounded-xl ${
                        isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {user?.name || 'Unknown User'}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs opacity-70">
                            {formatDate(comment.createdAt)}
                          </span>
                          
                          {isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-transparent">
                                  <IconDotsVertical size={12} />
                                </Button>
                              </DropdownMenuTrigger>
                              
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingComment(comment.id);
                                    setEditText(comment.text);
                                  }}
                                >
                                  <IconEdit size={14} className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <IconTrash size={14} className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                setEditingComment(null);
                                setEditText('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleEditComment(comment.id)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          {formatMessage(comment.text)}
                        </div>
                      )}
                    </div>
                    
                    {isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback>{user?.name?.[0] || <IconUser size={20} />}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  
                  {comment.updatedAt && (
                    <p
                      className={`text-xs text-muted-foreground mt-1 ${
                        isCurrentUser ? 'text-right mr-10' : 'ml-10'
                      }`}
                    >
                      Edited {formatDate(comment.updatedAt)}
                    </p>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </ScrollArea>
        
        <Separator className="my-4" />
      
        {uploadLoading && (
          <div className="flex items-center justify-center gap-2 my-2">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
            <span className="text-sm">Uploading file...</span>
          </div>
        )}
      
        <Popover
          open={mentionPopupOpen}
          onOpenChange={setMentionPopupOpen}
        >
          <PopoverTrigger asChild>
            <div>
              <Textarea
                ref={textareaRef}
                placeholder="Type your message... Use @ to mention someone"
                value={message}
                onChange={handleMessageChange}
                className="min-h-[60px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
          </PopoverTrigger>
          
          <PopoverContent side="top" className="w-[300px] p-3">
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">MENTION SOMEONE</p>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    onClick={() => handleSelectMention(user.name.replace(/\s+/g, ''))}
                    className="w-full justify-start h-auto p-2"
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    {user.name}
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">No users found</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      
        <div className="flex items-end gap-2 mt-4">
          <div className="relative flex-1">
            {message === '' && (
              <div className="absolute bottom-0 left-0 right-0 p-2 pointer-events-none"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 opacity-60">
                    <IconDragDrop size={16} />
                    <span className="text-xs">Drop files here to upload</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Drop files here to upload</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Popover
            open={drivePopupOpen}
            onOpenChange={setDrivePopupOpen}
          >
            <PopoverTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
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
                </Button>
                </TooltipTrigger>
                <TooltipContent>Attach from Google Drive</TooltipContent>
              </Tooltip>
            </PopoverTrigger>
            
            <PopoverContent side="top" align="end" className="w-[300px] p-3">
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">SELECT FROM GOOGLE DRIVE</p>
                {driveFiles.length > 0 ? (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-1">
                      {driveFiles.map(file => (
                        <Button
                          key={file.id}
                          variant="ghost"
                          onClick={() => handleDriveAttachment({
                            id: file.id,
                            name: file.name,
                            url: file.webViewLink
                          })}
                          className="w-full justify-start h-auto p-2"
                        >
                          <IconFileText size={14} className="mr-2 h-4 w-4" />
                          {file.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No files found in Google Drive
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <span>
                      <IconPaperclip size={18} />
                    </span>
                  </Button>
                </label>
              </div>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
          
          <Button
            disabled={!message.trim()}
            onClick={handleSubmit}
          >
            Send
            <IconSend size={14} className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
        
        {attachments.length > 0 && (
          <>
            <div className="relative my-4">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-sm text-muted-foreground">
                Attachments
              </span>
            </div>
            
            <ScrollArea className="h-[100px]">
              <div className="flex gap-2 flex-wrap">
                {attachments.map(attachment => {
                  const isImage = attachment.fileType.startsWith('image/');
                  
                  return (
                    <Card key={attachment.id} className="p-2">
                      <div className="flex items-center gap-2">
                        {isImage ? (
                          <IconPhoto size={24} />
                        ) : (
                          <IconFileText size={24} />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconDownload size={16} />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export function TaskChat(props: TaskChatProps) {
  return (
    <TooltipProvider>
      <TaskChatContent {...props} />
    </TooltipProvider>
  );
}