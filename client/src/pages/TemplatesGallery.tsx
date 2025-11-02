/**
 * Templates Gallery Page
 * 
 * Comprehensive template browser with:
 * - Grid/list view toggle
 * - Search and filters
 * - Category tabs
 * - Template preview modal
 * - Favorites system
 * - Sort options
 * 
 * @module TemplatesGallery
 * @sprint SPRINT5-005
 */

import React, { useState, useMemo } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Search,
  Filter,
  Grid3x3,
  List,
  Star,
  Download,
  Plus,
  TrendingUp,
} from 'lucide-react';
import TemplateCard from '../components/templates/TemplateCard';
import TemplatePreview from '../components/templates/TemplatePreview';
import { defaultTemplates } from '../../../shared/default-templates';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'recent' | 'popular' | 'category';
type FilterCategory = 'all' | 'standard' | 'company' | 'custom';

/**
 * TemplatesGallery Component
 */
export default function TemplatesGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof defaultTemplates[0] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);

  /**
   * Filter and sort templates
   */
  const filteredTemplates = useMemo(() => {
    let result = [...defaultTemplates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some((tag: string) => tag.toLowerCase().includes(query)) ||
          template.company?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter((template) => template.category === filterCategory);
    }

    // Standard filter
    if (selectedStandard !== 'all') {
      result = result.filter((template) => template.standard === selectedStandard);
    }

    // Favorites filter
    if (showFavorites) {
      result = result.filter((template) => favorites.has(template.id));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, filterCategory, selectedStandard, sortBy, favorites, showFavorites, defaultTemplates]);

  /**
   * Get unique standards
   */
  const standards = useMemo(() => {
    const standardSet = new Set<string>();
    defaultTemplates.forEach((template: typeof defaultTemplates[0]) => {
      if (template.standard) {
        standardSet.add(template.standard);
      }
    });
    return Array.from(standardSet);
  }, [defaultTemplates]);

  /**
   * Handle template preview
   */
  const handlePreview = (id: string) => {
    const template = defaultTemplates.find((t: typeof defaultTemplates[0]) => t.id === id);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  /**
   * Handle use template
   */
  const handleUseTemplate = (id: string) => {
    // In production, this would navigate to report creation with template
    console.log('Using template:', id);
    alert(`Creating new report with template: ${id}`);
  };

  /**
   * Handle export template
   */
  const handleExportTemplate = (id: string) => {
    const template = defaultTemplates.find((t: typeof defaultTemplates[0]) => t.id === id);
    if (template) {
      const dataStr = JSON.stringify(template, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  /**
   * Toggle favorite
   */
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  /**
   * Get category count
   */
  const getCategoryCount = (category: FilterCategory): number => {
    if (category === 'all') return defaultTemplates.length;
    return defaultTemplates.filter((t: typeof defaultTemplates[0]) => t.category === category).length;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates Gallery</h1>
          <p className="text-muted-foreground mt-1">
            Choose from {defaultTemplates.length} professional report templates
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Import Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search templates by name, company, standard, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Standard Filter */}
        <Select value={selectedStandard} onValueChange={setSelectedStandard}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Standards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Standards</SelectItem>
            {standards.map((standard) => (
              <SelectItem key={standard} value={standard}>
                {standard}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm">
        <Button
          variant={showFavorites ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Star className="w-4 h-4 mr-1" />
          Favorites ({favorites.size})
        </Button>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Showing {filteredTemplates.length} of {defaultTemplates.length} templates
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={filterCategory} onValueChange={(value: string) => setFilterCategory(value as FilterCategory)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({getCategoryCount('all')})
          </TabsTrigger>
          <TabsTrigger value="standard">
            Standards ({getCategoryCount('standard')})
          </TabsTrigger>
          <TabsTrigger value="company">
            Companies ({getCategoryCount('company')})
          </TabsTrigger>
          <TabsTrigger value="custom">
            Custom ({getCategoryCount('custom')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filterCategory} className="mt-6">
          {/* Templates Grid/List */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No templates found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setSelectedStandard('all');
                setShowFavorites(false);
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  id={template.id}
                  name={template.name}
                  description={template.description}
                  category={template.category}
                  standard={template.standard}
                  company={template.company}
                  version={template.version}
                  thumbnail={template.thumbnail}
                  tags={template.tags}
                  metadata={template.metadata}
                  onPreview={handlePreview}
                  onUseTemplate={handleUseTemplate}
                  onFavorite={toggleFavorite}
                  isFavorite={favorites.has(template.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      <TemplatePreview
        template={selectedTemplate}
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onUseTemplate={handleUseTemplate}
        onExport={handleExportTemplate}
      />
    </div>
  );
}
