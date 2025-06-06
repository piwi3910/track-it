import { useState, useEffect } from 'react';
// Using centralized theme system
import {
  Container,
  Title,
  Text,
  Group,
  Card,
  TextInput,
  ActionIcon,
  Menu,
  SimpleGrid,
  Paper,
  Loader,
  Select,
  Center,
  Stack,
  Textarea,
  TagsInput
} from '@mantine/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconCopy,
  IconFilter,
  IconTag,
  IconClock
} from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';;
import { TaskTemplate, TaskPriority } from '@/types/task';

// Template card component to display template information
function TemplateCard({ template, onUse, onEdit, onDelete }: {
  template: TaskTemplate;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { getPriorityColor } = useTheme();

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      className="template-card"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: `4px solid ${getPriorityColor(template.priority)}`,
        position: 'relative',
        backgroundColor: 'transparent'
      }}>
      <div>
        {/* Menu in the top-right corner to match TaskCard */}
        <div style={{ position: 'absolute', top: 2, right: 5, paddingBottom: 3, zIndex: 20 }}>
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={onUse}
              >
                Use Template
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPencil size={14} />}
                onClick={onEdit}
              >
                Edit Template
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                onClick={onDelete}
                color="red"
              >
                Delete Template
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>

        {/* Title positioned absolutely in the upper left */}
        <Text className="template-card-title">{template.name}</Text>

        {/* Empty space to maintain layout with other elements */}
        <div style={{ height: 28 }}></div>

        <Group gap="xs" mt="xs" data-no-propagation="true">
          <Badge
            variant={template.priority === 'LOW' ? 'secondary' :
                    template.priority === 'HIGH' || template.priority === 'URGENT' ? 'destructive' : 'default'}
            className={template.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : ''}
          >
            {template.priority.charAt(0).toUpperCase() + template.priority.slice(1)}
          </Badge>
          {template.category && <Badge variant="outline" className="text-xs">{template.category}</Badge>}
          {template.estimatedHours && (
            <Group gap="xs" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <IconClock size={12} />
              <Text size="xs" className="task-card-secondary-text">
                {template.estimatedHours}h estimated
              </Text>
            </Group>
          )}
        </Group>
      </div>

      {/* Tags section with different colors */}
      {template.tags && template.tags.length > 0 && (
        <Group mt="sm" gap="xs" data-no-propagation="true">
          {template.tags.map((tag, index) => {
            // We could use different colors based on tag name, but for now using secondary variant

            return (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs lowercase"
              >
                {tag}
              </Badge>
            );
          })}
        </Group>
      )}

      {/* Container for bottom row with absolute positioning */}
      <div style={{ position: 'relative', height: 30, marginTop: 'var(--spacing-xs)' }}>
        {/* Usage count in bottom left */}
        <div style={{ position: 'absolute', bottom: 0, left: 0 }}>
          <Text size="xs" className="task-card-secondary-text">
            Used {template.usageCount || 0} times
          </Text>
        </div>

        {/* Button in bottom right */}
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <Button
            size="sm"
            onClick={onUse}
            className="h-auto min-h-[18px] py-0.5 px-1.5 text-xs"
          >
            Use Template
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Main page component
export function TemplatesPage() {
  const {
    templates,
    templatesLoading,
    fetchTemplates,
    deleteTemplate,
    createTemplate,
    updateTemplate,
    getTemplateCategories,
    searchTemplates,
    createTaskFromTemplate
  } = useApp();
  
  // Local state
  const [filteredTemplates, setFilteredTemplates] = useState<TaskTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Template editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    priority: TaskPriority;
    tags: string[];
    category: string;
    estimatedHours?: number;
    isPublic: boolean;
  }>({
    name: '',
    description: '',
    priority: 'MEDIUM',
    tags: [],
    category: 'General',
    estimatedHours: undefined,
    isPublic: true
  });
  
  // Use template form state
  const [useTemplateFormData, setUseTemplateFormData] = useState({
    title: '',
    dueDate: null as string | null
  });

  // Load templates and categories on mount
  useEffect(() => {
    fetchTemplates();
    
    // Load categories
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const cats = await getTemplateCategories();
        setCategories(cats);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    loadCategories();
  }, [fetchTemplates, getTemplateCategories]);
  
  // Filter templates when templates or filters change
  useEffect(() => {
    let filtered = [...templates];
    
    // Apply search query filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        template => 
          template.name.toLowerCase().includes(lowerQuery) ||
          (template.description?.toLowerCase() || '').includes(lowerQuery) ||
          (template.category?.toLowerCase() || '').includes(lowerQuery) ||
          (template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) || false)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    setFilteredTemplates(filtered as unknown as TaskTemplate[]);
  }, [templates, searchQuery, selectedCategory]);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates as unknown as TaskTemplate[]);
      return;
    }
    
    const results = await searchTemplates(searchQuery);
    setFilteredTemplates(results as unknown as TaskTemplate[]);
  };
  
  // Open edit modal for creating a new template
  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      description: '',
      priority: 'MEDIUM',
      tags: [],
      category: 'General',
      estimatedHours: undefined,
      isPublic: true
    });
    setIsEditModalOpen(true);
  };
  
  // Open edit modal for editing an existing template
  const handleEditTemplate = (template: TaskTemplate) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      priority: template.priority,
      tags: template.tags || [],
      category: template.category || 'General',
      estimatedHours: template.estimatedHours,
      isPublic: template.isPublic !== false // Default to true if not specified
    });
    setIsEditModalOpen(true);
  };
  
  // Open use template modal
  const handleUseTemplate = (template: TaskTemplate) => {
    setCurrentTemplate(template);
    setUseTemplateFormData({
      title: template.name,
      dueDate: null
    });
    setIsUseModalOpen(true);
  };
  
  // Handle template deletion
  const handleDeleteTemplate = async (template: TaskTemplate) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      await deleteTemplate(template.id);
      // Templates will be refreshed by fetchTemplates in the context
    }
  };
  
  // Handle form submission for editing/creating templates
  const handleSubmitTemplateForm = async () => {
    if (!formData.name.trim()) {
      alert('Template name is required');
      return;
    }
    
    if (currentTemplate) {
      // Update existing template
      await updateTemplate(currentTemplate.id, {
        name: formData.name,
        description: formData.description,
        // @ts-expect-error - Priority conversion between enum types
        priority: formData.priority.toLowerCase(),
        tags: formData.tags,
        category: formData.category,
        estimatedHours: formData.estimatedHours,
        isPublic: formData.isPublic
      });
    } else {
      // Create new template
      await createTemplate({
        name: formData.name,
        description: formData.description,
        // @ts-expect-error - Priority conversion between enum types
        priority: formData.priority.toLowerCase(),
        tags: formData.tags,
        category: formData.category,
        estimatedHours: formData.estimatedHours,
        isPublic: formData.isPublic,
        createdBy: 'user1' // Current user ID
      });
    }
    
    setIsEditModalOpen(false);
    await fetchTemplates(); // Refresh templates
  };
  
  // Handle form submission for using a template
  const handleSubmitUseTemplateForm = async () => {
    if (!currentTemplate) return;
    if (!useTemplateFormData.title.trim()) {
      alert('Task title is required');
      return;
    }
    
    await createTaskFromTemplate(currentTemplate.id, {
      title: useTemplateFormData.title,
      dueDate: useTemplateFormData.dueDate
    });
    
    setIsUseModalOpen(false);
  };

  return (
    <Container size="xl" style={{ position: 'relative', paddingBottom: 70 }}>
      <Title mb="xl">Task Templates</Title>

      {/* Create Template button positioned at bottom right of page */}
      <div style={{
        position: 'fixed',
        bottom: 30,
        right: 30,
        zIndex: 100
      }}>
        <Button
          onClick={handleCreateTemplate}
          className="rounded-full shadow-lg"
        >
          <IconPlus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      <Paper p="md" withBorder mb="xl">
        <Group gap="md">
          <TextInput
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
            rightSectionWidth={42}
            rightSection={
              <ActionIcon onClick={handleSearch} color="blue">
                <IconSearch size={18} />
              </ActionIcon>
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          
          <Select
            placeholder="Filter by category"
            data={
              categoriesLoading
                ? [{ value: 'loading', label: 'Loading...', disabled: true }]
                : [{ value: '', label: 'All Categories' }].concat(
                    categories.map(category => ({
                      value: category,
                      label: category
                    }))
                  )
            }
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ minWidth: 200 }}
            clearable
            leftSection={<IconFilter size={16} />}
          />
        </Group>
      </Paper>
      
      {templatesLoading ? (
        <Center my="xl">
          <Loader />
        </Center>
      ) : filteredTemplates.length === 0 ? (
        <Center my="xl">
          <Stack align="center">
            <Text color="dimmed">No templates found</Text>
            <Button variant="outline" onClick={handleCreateTemplate}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </Stack>
        </Center>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="my">My Templates</TabsTrigger>
            <TabsTrigger value="popular">Popular Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3 }}
              spacing="md"
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  onEdit={() => handleEditTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template)}
                />
              ))}
            </SimpleGrid>
          </TabsContent>
          
          <TabsContent value="my">
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3 }}
              spacing="md"
            >
              {filteredTemplates
                .filter(template => typeof template.createdBy === 'string' && template.createdBy === 'user1') // Filter for current user
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                    onEdit={() => handleEditTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template)}
                  />
                ))}
            </SimpleGrid>
          </TabsContent>
          
          <TabsContent value="popular">
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3 }}
              spacing="md"
            >
              {filteredTemplates
                .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                .slice(0, 6) // Get top 6 most used templates
                .map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                    onEdit={() => handleEditTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template)}
                  />
                ))}
            </SimpleGrid>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Edit Template Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
        <Stack>
          <TextInput
            label="Template Name"
            placeholder="Enter template name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Describe this template"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            minRows={3}
          />
          
          <Group grow>
            <Select
              label="Priority"
              placeholder="Select priority"
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              data={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
            />
            
            <TextInput
              label="Category"
              placeholder="Enter category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              leftSection={<IconTag size={16} />}
            />
          </Group>
          
          <TagsInput
            label="Tags"
            placeholder="Enter tags"
            value={formData.tags}
            onChange={(value) => setFormData({ ...formData, tags: value })}
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitTemplateForm}>Save Template</Button>
          </Group>
        </Stack>
        </DialogContent>
      </Dialog>
      
      {/* Use Template Modal */}
      <Dialog open={isUseModalOpen} onOpenChange={setIsUseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task from Template</DialogTitle>
          </DialogHeader>
        <Stack>
          <TextInput
            label="Task Title"
            placeholder="Enter task title"
            value={useTemplateFormData.title}
            onChange={(e) => setUseTemplateFormData({ ...useTemplateFormData, title: e.target.value })}
            required
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setIsUseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitUseTemplateForm}>Create Task</Button>
          </Group>
        </Stack>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default TemplatesPage;