/**
 * Template Preview Component
 * 
 * Modal dialog displaying full template preview with:
 * - Template information
 * - All sections and fields
 * - Metadata
 * - Actions (Use Template, Export)
 * 
 * @module TemplatePreview
 * @sprint SPRINT5-005
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  FileText,
  Download,
  Copy,
  CheckCircle2,
  X,
  Calendar,
  Globe,
  User,
  Tag,
} from 'lucide-react';

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  fields: TemplateField[];
}

export interface TemplateField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface TemplatePreviewProps {
  template: {
    id: string;
    name: string;
    description: string;
    category: string;
    standard?: string;
    company?: string;
    version: string;
    tags: string[];
    sections: TemplateSection[];
    metadata: {
      author: string;
      createdAt: string;
      updatedAt: string;
      language: string;
      jurisdiction: string;
    };
  } | null;
  open: boolean;
  onClose: () => void;
  onUseTemplate: (id: string) => void;
  onExport?: (id: string) => void;
}

/**
 * TemplatePreview Component
 */
export default function TemplatePreview({
  template,
  open,
  onClose,
  onUseTemplate,
  onExport,
}: TemplatePreviewProps) {
  if (!template) return null;

  /**
   * Get field type badge color
   */
  const getFieldTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      date: 'bg-purple-100 text-purple-800',
      textarea: 'bg-orange-100 text-orange-800',
      select: 'bg-pink-100 text-pink-800',
      table: 'bg-indigo-100 text-indigo-800',
      file: 'bg-yellow-100 text-yellow-800',
    };

    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {template.description}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="default">{template.category}</Badge>
            {template.standard && <Badge variant="outline">{template.standard}</Badge>}
            {template.company && <Badge variant="outline">{template.company}</Badge>}
            <Badge variant="secondary">v{template.version}</Badge>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Author:</span>
            <span>{template.metadata.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Jurisdiction:</span>
            <span>{template.metadata.jurisdiction}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(template.metadata.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Language:</span>
            <span>{template.metadata.language}</span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Sections */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Template Structure ({template.sections.length} sections)
              </h3>
            </div>

            {template.sections.map((section, sectionIndex) => (
              <div key={section.id} className="border rounded-lg p-4">
                {/* Section Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {sectionIndex + 1}
                      </span>
                      <h4 className="font-medium">{section.title}</h4>
                      {section.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1 ml-8">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fields */}
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {section.fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded"
                      >
                        {field.required && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <span className="flex-1">{field.label}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getFieldTypeBadge(field.type)}`}
                        >
                          {field.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-2">
            {onExport && (
              <Button variant="outline" onClick={() => onExport(template.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onUseTemplate(template.id)}>
              <Download className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
