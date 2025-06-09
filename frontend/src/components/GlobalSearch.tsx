import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  IconSearch,
  IconX,
  IconArrowRight,
  IconClock,
  IconHash,
  IconFlag
} from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { Task } from '@/types/task';

export function GlobalSearch() {
  const { searchTasks } = useApp();
  const { getPriorityColor } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Debounce hook implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  // Hotkey to focus search (Ctrl+K or Command+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);
  
  // Save recent searches to localStorage
  const saveSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updatedSearches = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }, [recentSearches]);
  
  // Handle search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchTasks(searchQuery);
      const mappedResults = (Array.isArray(searchResults) ? searchResults : []).map((task, index) => ({
        ...task,
        taskNumber: 'taskNumber' in task && typeof task.taskNumber === 'number' ? task.taskNumber : index + 1
      })) as unknown as Task[];
      setResults(mappedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTasks]);
  
  // Run search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== undefined) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery, handleSearch]);
  
  // Handle clicking on a result
  const handleResultClick = (task: Task) => {
    saveSearch(query);
    
    if (task.status === 'BACKLOG') {
      navigate(`/backlog?task=${task.taskNumber}`);
    } else {
      navigate(`/kanban?task=${task.taskNumber}`);
    }
    
    setOpen(false);
    setQuery('');
  };
  
  // Handle clicking on a recent search
  const handleRecentSearchClick = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);
  
  // Get priority badge color classes
  const getPriorityBadgeClass = (priority: string) => {
    const color = getPriorityColor(priority);
    if (color.includes('red')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (color.includes('yellow')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (color.includes('orange')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-[350px]">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search tasks by ID, title, or tags... (⌘K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-9 pr-16"
            aria-label="Search tasks"
            aria-controls="search-results"
            aria-expanded={open}
          />
          {query ? (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={clearSearch}
            >
              <IconX className="h-4 w-4" />
            </Button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ⌘K
            </span>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start">
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            <div className="p-2">
              <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">SEARCH RESULTS</p>
              <div id="search-results" role="listbox" aria-label="Search results" className="space-y-2">
                {results.map((task, index) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer p-3 transition-colors hover:bg-accent"
                    onClick={() => handleResultClick(task)}
                    role="option"
                    aria-selected={index === 0}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <IconArrowRight className="h-4 w-4 opacity-50" />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <IconHash className="mr-1 h-3 w-3" />
                        {task.taskNumber}
                      </Badge>

                      <Badge className={`text-xs ${getPriorityBadgeClass(task.priority)}`}>
                        <IconFlag className="mr-1 h-3 w-3" />
                        {task.priority}
                      </Badge>

                      <Badge variant="outline" className="text-xs">
                        <IconHash className="mr-1 h-3 w-3" />
                        {task.status.replace(/_/g, ' ')}
                      </Badge>

                      {task.tags && task.tags.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {task.tags[0]}
                          {task.tags.length > 1 && ` +${task.tags.length - 1}`}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : query.length === 0 && recentSearches.length > 0 ? (
          <div className="p-2">
            <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground">RECENT SEARCHES</p>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <Card
                  key={index}
                  className="cursor-pointer p-3 transition-colors hover:bg-accent"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <div className="flex items-center gap-2">
                    <IconClock className="h-4 w-4 opacity-50" />
                    <span>{search}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : query.length > 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-sm text-muted-foreground">No results found</p>
            <p className="text-xs text-muted-foreground">Try different keywords</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
            <p className="text-sm text-muted-foreground">Start typing to search</p>
            <p className="text-xs text-muted-foreground">Search for tasks by ID, title, description, or tags</p>
            <p className="text-xs text-muted-foreground">Tip: Enter a task ID directly to quickly find a specific task</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}