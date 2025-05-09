import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Badge,
  Grid,
  TextInput,
  ActionIcon,
  Menu,
  Tabs,
  SimpleGrid,
  Paper,
  Loader,
  Select,
  useMantineTheme,
  Center,
  Modal,
  Stack,
  Textarea,
  TagsInput
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconCopy,
  IconFilter,
  IconTag,
  IconCheck
} from '@tabler/icons-react';
import { useApp } from '@/context/AppContext';
import { TaskTemplate, TaskPriority } from '@/types/task';

// Template card component to display template information
function TemplateCard({ template, onUse, onEdit, onDelete }: {
  template: TaskTemplate;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useMantineTheme();
  
  // Priority to color mapping
  const priorityColors: Record<TaskPriority, string> = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red'
  };

  return (
    <Card withBorder shadow="sm" padding="lg" radius="md" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderLeft: `4px solid ${theme.colors[priorityColors[template.priority]][6]}`
    }}>
      <div>
        <Group position="apart" align="flex-start">
          <Text weight={600} size="lg">{template.name}</Text>
          <Menu withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon>
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item 
                icon={<IconCopy size={16} />}
                onClick={onUse}
              >
                Use Template
              </Menu.Item>
              <Menu.Item 
                icon={<IconPencil size={16} />}
                onClick={onEdit}
              >
                Edit Template
              </Menu.Item>
              <Menu.Item 
                icon={<IconTrash size={16} />}
                onClick={onDelete}
                color="red"
              >
                Delete Template
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        
        <Text color="dimmed" size="sm" lineClamp={3} my="md">
          {template.description || "No description"}
        </Text>
        
        <Group spacing="xs" mt="md">
          <Badge color={priorityColors[template.priority]}>
            {template.priority.charAt(0).toUpperCase() + template.priority.slice(1)}
          </Badge>
          {template.category && <Badge variant="outline">{template.category}</Badge>}
          {template.estimatedHours && <Badge variant="outline">{template.estimatedHours}h</Badge>}
          <Badge variant="outline" color="cyan">Used {template.usageCount || 0} times</Badge>
        </Group>
      </div>
      
      <Group spacing="xs" mt="md">
        {template.tags && template.tags.map((tag, index) => (
          <Badge key={index} size="sm" color="gray" variant="filled">{tag}</Badge>
        ))}
      </Group>
      
      <Group position="right" mt="md">
        <Button size="xs" onClick={onUse}>Use Template</Button>
      </Group>
    </Card>
  );
}

// Main page component
export function TemplatesPage() {
  const theme = useMantineTheme();
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
    priority: 'medium',
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
    
    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
      return;
    }
    
    const results = await searchTemplates(searchQuery);
    setFilteredTemplates(results);
  };
  
  // Open edit modal for creating a new template
  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      description: '',
      priority: 'medium',
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
        priority: formData.priority,
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
        priority: formData.priority,
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
    <Container size="xl">
      <Group position="apart" mb="xl">
        <Title>Task Templates</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateTemplate}>
          Create Template
        </Button>
      </Group>
      
      <Paper p="md" withBorder mb="xl">
        <Group spacing="md">
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
            icon={<IconFilter size={16} />}
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
            <Button variant="outline" leftSection={<IconPlus size={16} />} onClick={handleCreateTemplate}>
              Create Your First Template
            </Button>
          </Stack>
        </Center>
      ) : (
        <Tabs defaultValue="all">
          <Tabs.List mb="md">
            <Tabs.Tab value="all">All Templates</Tabs.Tab>
            <Tabs.Tab value="my">My Templates</Tabs.Tab>
            <Tabs.Tab value="popular">Popular Templates</Tabs.Tab>
          </Tabs.List>
          
          <Tabs.Panel value="all">
            <SimpleGrid 
              cols={3} 
              spacing="md"
              breakpoints={[
                { maxWidth: 'md', cols: 2, spacing: 'sm' },
                { maxWidth: 'sm', cols: 1, spacing: 'sm' },
              ]}
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
          </Tabs.Panel>
          
          <Tabs.Panel value="my">
            <SimpleGrid 
              cols={3} 
              spacing="md"
              breakpoints={[
                { maxWidth: 'md', cols: 2, spacing: 'sm' },
                { maxWidth: 'sm', cols: 1, spacing: 'sm' },
              ]}
            >
              {filteredTemplates
                .filter(template => template.createdBy === 'user1') // Filter for current user
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
          </Tabs.Panel>
          
          <Tabs.Panel value="popular">
            <SimpleGrid 
              cols={3} 
              spacing="md"
              breakpoints={[
                { maxWidth: 'md', cols: 2, spacing: 'sm' },
                { maxWidth: 'sm', cols: 1, spacing: 'sm' },
              ]}
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
          </Tabs.Panel>
        </Tabs>
      )}
      
      {/* Edit Template Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={currentTemplate ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
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
              icon={<IconTag size={16} />}
            />
          </Group>
          
          <TagsInput
            label="Tags"
            placeholder="Enter tags"
            value={formData.tags}
            onChange={(value) => setFormData({ ...formData, tags: value })}
          />
          
          <Group position="right" mt="md">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitTemplateForm}>Save Template</Button>
          </Group>
        </Stack>
      </Modal>
      
      {/* Use Template Modal */}
      <Modal
        opened={isUseModalOpen}
        onClose={() => setIsUseModalOpen(false)}
        title="Create Task from Template"
      >
        <Stack>
          <TextInput
            label="Task Title"
            placeholder="Enter task title"
            value={useTemplateFormData.title}
            onChange={(e) => setUseTemplateFormData({ ...useTemplateFormData, title: e.target.value })}
            required
          />
          
          <Group position="right" mt="md">
            <Button variant="outline" onClick={() => setIsUseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitUseTemplateForm}>Create Task</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

export default TemplatesPage;