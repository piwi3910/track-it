import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useHotkeys, useDisclosure, useDebouncedValue } from '@mantine/hooks';
import {
  IconSearch,
  IconX,
  IconArrowRight,
  IconClock,
  IconHash,
  IconFlag
} from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';;
import { Task } from '@/types/task';

export function GlobalSearch() {
  const { searchTasks } = useApp();
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
    try {
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
      // If localStorage fails, continue with empty recent searches
    }
  }, []);
  
  // Save recent searches to localStorage
  const saveSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updatedSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5); // Keep only the 5 most recent searches
    
    setRecentSearches(updatedSearches);
    
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
      // Continue even if localStorage fails
    }
  }, [recentSearches]);
  
  // Handle search - memoized to avoid unnecessary re-renders
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Use API search for all queries - it handles task ID, title, description, and tags
      const searchResults = await searchTasks(searchQuery);
      setResults(Array.isArray(searchResults) ? searchResults : []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTasks]);
  
  // Use Mantine's built-in debounce hook
  const [debouncedQuery] = useDebouncedValue(query, 300);
  
  // Run search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== undefined) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery, handleSearch]);
  
  // Handle clicking on a result
  const handleResultClick = (task: Task) => {
    saveSearch(query);
    
    // Navigate to the appropriate page based on task status
    if (task.status === 'backlog') {
      navigate(`/backlog?task=${task.taskNumber}`);
    } else {
      navigate(`/kanban?task=${task.taskNumber}`);
    }
    
    close();
    setQuery('');
  };
  
  // Handle clicking on a recent search
  const handleRecentSearchClick = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    // No need to call handleSearch directly as it will be triggered by the debounced query effect
  }, []);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);
  
  // We don't need a custom priority color mapping function as it's provided by ThemeContext
  
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
          placeholder="Search tasks by ID, title, or tags... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={open}
          aria-label="Search tasks"
          aria-controls="search-results"
          aria-expanded={opened}
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
              <div id="search-results" role="listbox" aria-label="Search results">
                {results.map((task, index) => (
                  <Paper
                    key={task.id}
                    p="xs"
                    withBorder
                    onClick={() => handleResultClick(task)}
                    style={{ cursor: 'pointer' }}
                    role="option"
                    aria-selected={index === 0}
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
                    <Badge size="xs" variant="filled" color="blue">
                      <Group gap={4}>
                        <IconHash size={10} />
                        <span>{task.taskNumber}</span>
                      </Group>
                    </Badge>

                    <Badge size="xs" color={getPriorityColor(task.priority)}>
                      <Group gap={4}>
                        <IconFlag size={10} />
                        <span>{task.priority}</span>
                      </Group>
                    </Badge>

                    <Badge size="xs" variant="outline">
                      <Group gap={4}>
                        <IconHash size={10} />
                        <span>{task.status.replace(/_/g, ' ')}</span>
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
              </div>
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