import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      className="template-card h-full flex flex-col justify-between relative border shadow-sm"
      style={{
        borderLeft: `4px solid ${getPriorityColor(template.priority)}`
      }}>
      <CardContent className="p-4">
        {/* Menu in the top-right corner to match TaskCard */}
        <div className="absolute top-0.5 right-1.5 pb-1 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <IconDotsVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onUse}>
                <IconCopy size={14} className="mr-2" />
                Use Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <IconPencil size={14} className="mr-2" />
                Edit Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <IconTrash size={14} className="mr-2" />
                Delete Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title positioned absolutely in the upper left */}
        <p className="template-card-title">{template.name}</p>

        {/* Empty space to maintain layout with other elements */}
        <div style={{ height: 28 }}></div>

        <div className="flex items-center gap-2 mt-2" data-no-propagation="true">
          <Badge
            variant={template.priority === 'LOW' ? 'secondary' :
                    template.priority === 'HIGH' || template.priority === 'URGENT' ? 'destructive' : 'default'}
            className={template.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : ''}
          >
            {template.priority.charAt(0).toUpperCase() + template.priority.slice(1)}
          </Badge>
          {template.category && <Badge variant="outline" className="text-xs">{template.category}</Badge>}
          {template.estimatedHours && (
            <div className="inline-flex items-center gap-2">
              <IconClock size={12} />
              <p className="text-xs task-card-secondary-text">
                {template.estimatedHours}h estimated
              </p>
            </div>
          )}
        </div>

        {/* Tags section with different colors */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3" data-no-propagation="true">
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
          </div>
        )}

        {/* Container for bottom row with absolute positioning */}
        <div className="relative h-[30px] mt-2">
          {/* Usage count in bottom left */}
          <div className="absolute bottom-0 left-0">
            <p className="text-xs task-card-secondary-text">
              Used {template.usageCount || 0} times
            </p>
          </div>

          {/* Button in bottom right */}
          <div className="absolute bottom-0 right-0">
            <Button
              size="sm"
              onClick={onUse}
              className="h-auto min-h-[18px] py-0.5 px-1.5 text-xs"
            >
              Use Template
            </Button>
          </div>
        </div>
      </CardContent>
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
    <div className="container max-w-7xl mx-auto p-8 relative pb-[70px]">
      <h1 className="text-3xl font-bold mb-8">Task Templates</h1>

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
      
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10"
                onClick={handleSearch}
              >
                <IconSearch size={18} />
              </Button>
            </div>
          
            <Select
              value={selectedCategory || ''}
              onValueChange={(value) => setSelectedCategory(value || null)}
            >
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                  <IconFilter size={16} />
                  <SelectValue placeholder="Filter by category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  <>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {templatesLoading ? (
        <div className="flex items-center justify-center my-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex items-center justify-center my-12">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-muted-foreground">No templates found</p>
            <Button variant="outline" onClick={handleCreateTemplate}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="my">My Templates</TabsTrigger>
            <TabsTrigger value="popular">Popular Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  onEdit={() => handleEditTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="my">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            </div>
          </TabsContent>
          
          <TabsContent value="popular">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Edit Template Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="Enter template name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this template"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="relative">
                <IconTag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="category"
                  placeholder="Enter category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => {
                        const newTags = formData.tags.filter((_, i) => i !== index);
                        setFormData({ ...formData, tags: newTags });
                      }}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
              <Input
                id="tags"
                placeholder="Enter tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const tag = input.value.trim();
                    if (tag && !formData.tags.includes(tag)) {
                      setFormData({ ...formData, tags: [...formData.tags, tag] });
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitTemplateForm}>Save Template</Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
      
      {/* Use Template Modal */}
      <Dialog open={isUseModalOpen} onOpenChange={setIsUseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task from Template</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="Enter task title"
              value={useTemplateFormData.title}
              onChange={(e) => setUseTemplateFormData({ ...useTemplateFormData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsUseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitUseTemplateForm}>Create Task</Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplatesPage;