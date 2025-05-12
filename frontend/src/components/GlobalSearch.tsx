import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextInput,
  ActionIcon,
  Popover,
  Stack,
  Paper,
  Text,
  Group,
  Badge,
  ScrollArea,
  Loader,
  rem
} from '@mantine/core';
import { useHotkeys, useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconX,
  IconArrowRight,
  IconClock,
  IconHash,
  IconFlag
} from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/context/ThemeContext';
import { Task, TaskPriority } from '@/types/task';

export function GlobalSearch() {
  const { searchTasks, getTaskById, tasks } = useApp();
  const { getPriorityColor } = useTheme();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Hotkey to focus search (Ctrl+K or Command+K)
  useHotkeys([['mod+K', () => {
    inputRef.current?.focus();
    open();
  }]]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);
  
  // Save recent searches to localStorage
  const saveSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updatedSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5); // Keep only the 5 most recent searches
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };
  
  // Handle search
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Check if the query might be a direct task ID search (if it starts with "task-" or contains a specific format)
      const isIdSearch = searchQuery.startsWith('task-') || /^[a-z0-9]{8}$/i.test(searchQuery);

      if (isIdSearch) {
        // Try to find by exact ID first
        const exactTask = await getTaskById(searchQuery);
        if (exactTask) {
          setResults([exactTask]);
          setLoading(false);
          return;
        }

        // If no exact match, look for partial ID matches
        const partialIdMatches = tasks.filter(task =>
          task.id.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (partialIdMatches.length > 0) {
          setResults(partialIdMatches);
          setLoading(false);
          return;
        }
      }

      // Fall back to regular search
      const searchResults = await searchTasks(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch(query);
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [query]);
  
  // Handle clicking on a result
  const handleResultClick = (task: Task) => {
    saveSearch(query);
    
    // Navigate to the appropriate page based on task status
    if (task.status === 'backlog') {
      navigate(`/backlog?task=${task.id}`);
    } else {
      navigate(`/kanban?task=${task.id}`);
    }
    
    close();
    setQuery('');
  };
  
  // Handle clicking on a recent search
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };
  
  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };
  
  // Function to map priority to Mantine color - uses centralized theming
  const getManticColorFromPriority = (priority: TaskPriority) => {
    return priority === 'low' ? 'blue' :
           priority === 'medium' ? 'yellow' :
           priority === 'high' ? 'orange' : 'red';
  };
  
  return (
    <Popover 
      width={400} 
      position="bottom" 
      shadow="md" 
      opened={opened}
      onChange={open}
    >
      <Popover.Target>
        <TextInput
          ref={inputRef}
          placeholder="Search tasks or enter task ID... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={open}
          rightSection={
            query ? (
              <ActionIcon variant="subtle" onClick={clearSearch}>
                <IconX size={16} />
              </ActionIcon>
            ) : (
              <Text c="dimmed" size="xs">⌘K</Text>
            )
          }
          leftSection={<IconSearch size={16} />}
          styles={{
            root: {
              width: rem(350)
            }
          }}
        />
      </Popover.Target>
      
      <Popover.Dropdown>
        {loading ? (
          <Stack align="center" gap="sm" py="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Searching...</Text>
          </Stack>
        ) : results.length > 0 ? (
          <ScrollArea h={400}>
            <Stack gap="xs">
              <Text size="xs" fw={700} c="dimmed">SEARCH RESULTS</Text>
              {results.map(task => (
                <Paper 
                  key={task.id} 
                  p="xs" 
                  withBorder 
                  onClick={() => handleResultClick(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <Text truncate fw={500}>{task.title}</Text>
                      {task.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {task.description}
                        </Text>
                      )}
                    </div>
                    <IconArrowRight size={16} opacity={0.5} />
                  </Group>
                  
                  <Group gap="xs" mt="xs">
                    <Badge size="xs" variant="filled" color="gray">
                      <Group gap={4}>
                        <IconHash size={10} />
                        <span>{task.id.substring(0, 8)}</span>
                      </Group>
                    </Badge>

                    <Badge size="xs" color={getManticColorFromPriority(task.priority)}>
                      <Group gap={4}>
                        <IconFlag size={10} />
                        <span>{task.priority}</span>
                      </Group>
                    </Badge>

                    <Badge size="xs" variant="outline">
                      <Group gap={4}>
                        <IconHash size={10} />
                        <span>{task.status.replace('_', ' ')}</span>
                      </Group>
                    </Badge>
                    
                    {task.tags && task.tags.length > 0 && (
                      <Badge size="xs" variant="dot">
                        {task.tags[0]}
                        {task.tags.length > 1 && `+${task.tags.length - 1}`}
                      </Badge>
                    )}
                  </Group>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        ) : query.length === 0 && recentSearches.length > 0 ? (
          <Stack gap="xs">
            <Text size="xs" fw={700} c="dimmed">RECENT SEARCHES</Text>
            {recentSearches.map((search, index) => (
              <Paper 
                key={index} 
                p="xs" 
                withBorder 
                onClick={() => handleRecentSearchClick(search)}
                style={{ cursor: 'pointer' }}
              >
                <Group>
                  <IconClock size={16} opacity={0.5} />
                  <Text>{search}</Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : query.length > 0 ? (
          <Stack align="center" gap="sm" py="md">
            <Text size="sm" c="dimmed">No results found</Text>
            <Text size="xs" c="dimmed">Try different keywords</Text>
          </Stack>
        ) : (
          <Stack align="center" gap="sm" py="md">
            <Text size="sm" c="dimmed">Start typing to search</Text>
            <Text size="xs" c="dimmed">Search for tasks by ID, title, description, or tags</Text>
            <Text size="xs" c="dimmed">Tip: Enter a task ID directly to quickly find a specific task</Text>
          </Stack>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}