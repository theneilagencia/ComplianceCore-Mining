/**
 * Template Card Component
 * 
 * Displays a single template card with:
 * - Thumbnail image
 * - Template name and description
 * - Category and standard badges
 * - Tags
 * - Action buttons (Preview, Use Template)
 * 
 * @module TemplateCard
 * @sprint SPRINT5-005
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  FileText, 
  Eye, 
  Download, 
  Star,
  Building2,
  Globe
} from 'lucide-react';

export interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'company' | 'custom';
  standard?: string;
  company?: string;
  version: string;
  thumbnail?: string;
  tags: string[];
  metadata: {
    jurisdiction: string;
  };
  onPreview: (id: string) => void;
  onUseTemplate: (id: string) => void;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

/**
 * TemplateCard Component
 */
export default function TemplateCard({
  id,
  name,
  description,
  category,
  standard,
  company,
  version,
  thumbnail,
  tags,
  metadata,
  onPreview,
  onUseTemplate,
  onFavorite,
  isFavorite = false,
}: TemplateCardProps) {
  /**
   * Get category color
   */
  const getCategoryColor = (): string => {
    switch (category) {
      case 'standard':
        return 'default';
      case 'company':
        return 'secondary';
      case 'custom':
        return 'outline';
      default:
        return 'default';
    }
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = () => {
    switch (category) {
      case 'standard':
        return <Globe className="w-3 h-3 mr-1" />;
      case 'company':
        return <Building2 className="w-3 h-3 mr-1" />;
      case 'custom':
        return <FileText className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-primary/40" />
          </div>
        )}
        
        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={() => onFavorite(id)}
            className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              }`}
            />
          </button>
        )}

        {/* Category badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant={getCategoryColor() as any} className="flex items-center">
            {getCategoryIcon()}
            {category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardHeader className="flex-grow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
            {standard && (
              <Badge variant="outline" className="mt-1">
                {standard}
              </Badge>
            )}
            {company && (
              <Badge variant="outline" className="mt-1">
                <Building2 className="w-3 h-3 mr-1" />
                {company}
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Footer */}
      <CardFooter className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="w-3 h-3" />
          <span>{metadata.jurisdiction}</span>
          <span className="mx-1">•</span>
          <span>v{version}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => onUseTemplate(id)}
          >
            <Download className="w-4 h-4 mr-1" />
            Use
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
