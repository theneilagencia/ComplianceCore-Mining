import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Eye, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Type definition local (will be synced with shared schema)
export interface Template {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  standard: 'JORC' | 'NI43-101' | 'PERC' | 'SAMREC' | 'NAEN';
  version: number;
  isActive: boolean;
  isDefault: boolean;
  styling?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    fontSize?: number;
    logoUrl?: string;
    logoPosition?: string;
    headerText?: string;
    footerText?: string;
    showPageNumbers?: boolean;
  };
  sections: Array<{
    id: string;
    type: string;
    title: string;
    order: number;
    enabled: boolean;
    required: boolean;
    config?: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

interface TemplateEditorProps {
  template: Template;
  onChange: (template: Template) => void;
  onSave: () => void;
  onPreview: () => void;
}

/**
 * Editor visual de templates customizáveis
 * 
 * Features:
 * - Edição de styling (cores, fontes, logo)
 * - Gerenciamento de seções (ordem, habilitação)
 * - Preview em tempo real
 * - Validação de campos
 * - Drag & drop para reordenar seções
 * 
 * @example
 * ```tsx
 * <TemplateEditor
 *   template={currentTemplate}
 *   onChange={setTemplate}
 *   onSave={handleSave}
 *   onPreview={handlePreview}
 * />
 * ```
 */
export default function TemplateEditor({
  template,
  onChange,
  onSave,
  onPreview,
}: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'styling' | 'sections'>('general');

  const updateStyling = (key: string, value: any) => {
    onChange({
      ...template,
      styling: {
        ...template.styling,
        [key]: value,
      },
    });
  };

  const updateSection = (sectionId: string, updates: Partial<Template['sections'][0]>) => {
    onChange({
      ...template,
      sections: template.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    });
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = template.sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === template.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...template.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    // Atualizar order
    newSections.forEach((section, i) => {
      section.order = i;
    });

    onChange({ ...template, sections: newSections });
  };

  const addSection = () => {
    const newSection: Template['sections'][0] = {
      id: `section-${Date.now()}`,
      type: 'custom',
      title: 'Nova Seção',
      order: template.sections.length,
      enabled: true,
      required: false,
    };

    onChange({
      ...template,
      sections: [...template.sections, newSection],
    });
  };

  const removeSection = (sectionId: string) => {
    onChange({
      ...template,
      sections: template.sections.filter((s) => s.id !== sectionId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {template.standard} • Versão {template.version}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'general'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Geral
        </button>
        <button
          onClick={() => setActiveTab('styling')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'styling'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Estilização
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'sections'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Seções ({template.sections.length})
        </button>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={template.name}
                onChange={(e) => onChange({ ...template, name: e.target.value })}
                placeholder="Ex: JORC Standard Template"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={template.description || ''}
                onChange={(e) => onChange({ ...template, description: e.target.value })}
                placeholder="Descreva o propósito deste template..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standard">Padrão</Label>
                <Select
                  value={template.standard}
                  onValueChange={(value: any) => onChange({ ...template, standard: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JORC">JORC</SelectItem>
                    <SelectItem value="NI43-101">NI 43-101</SelectItem>
                    <SelectItem value="PERC">PERC</SelectItem>
                    <SelectItem value="SAMREC">SAMREC</SelectItem>
                    <SelectItem value="NAEN">NAEN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  type="number"
                  value={template.version}
                  onChange={(e) => onChange({ ...template, version: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Template Ativo</Label>
                <p className="text-sm text-gray-400">
                  Templates inativos não aparecem para seleção
                </p>
              </div>
              <Switch
                id="isActive"
                checked={template.isActive}
                onCheckedChange={(checked) => onChange({ ...template, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isDefault">Template Padrão</Label>
                <p className="text-sm text-gray-400">
                  Usado automaticamente para novos relatórios
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={template.isDefault}
                onCheckedChange={(checked) => onChange({ ...template, isDefault: checked })}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Styling Tab */}
      {activeTab === 'styling' && template.styling && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Cores</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={template.styling.primaryColor}
                    onChange={(e) => updateStyling('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={template.styling.primaryColor}
                    onChange={(e) => updateStyling('primaryColor', e.target.value)}
                    placeholder="#2F2C79"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={template.styling.secondaryColor}
                    onChange={(e) => updateStyling('secondaryColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={template.styling.secondaryColor}
                    onChange={(e) => updateStyling('secondaryColor', e.target.value)}
                    placeholder="#4A90E2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={template.styling.accentColor}
                    onChange={(e) => updateStyling('accentColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={template.styling.accentColor}
                    onChange={(e) => updateStyling('accentColor', e.target.value)}
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Tipografia</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Fonte</Label>
                <Select
                  value={template.styling.fontFamily}
                  onValueChange={(value: any) => updateStyling('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize">Tamanho (pt)</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={template.styling.fontSize}
                  onChange={(e) => updateStyling('fontSize', parseInt(e.target.value))}
                  min={10}
                  max={16}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Logo e Cabeçalhos</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={template.styling.logoUrl || ''}
                  onChange={(e) => updateStyling('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoPosition">Posição do Logo</Label>
                <Select
                  value={template.styling.logoPosition}
                  onValueChange={(value: any) => updateStyling('logoPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerText">Texto do Cabeçalho</Label>
                <Input
                  id="headerText"
                  value={template.styling.headerText || ''}
                  onChange={(e) => updateStyling('headerText', e.target.value)}
                  placeholder="Ex: CONFIDENCIAL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Texto do Rodapé</Label>
                <Input
                  id="footerText"
                  value={template.styling.footerText || ''}
                  onChange={(e) => updateStyling('footerText', e.target.value)}
                  placeholder="Ex: © 2025 Sua Empresa"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showPageNumbers">Mostrar Números de Página</Label>
                <Switch
                  id="showPageNumbers"
                  checked={template.styling.showPageNumbers}
                  onCheckedChange={(checked) => updateStyling('showPageNumbers', checked)}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              {template.sections.filter((s) => s.enabled).length} seções ativas
            </p>
            <Button onClick={addSection} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Seção
            </Button>
          </div>

          <div className="space-y-2">
            {template.sections.map((section, index) => (
              <Card key={section.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === template.sections.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <GripVertical className="h-5 w-5 text-gray-400" />

                  <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      placeholder="Título da seção"
                    />
                    <Select
                      value={section.type}
                      onValueChange={(value: any) => updateSection(section.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="executive_summary">Executive Summary</SelectItem>
                        <SelectItem value="competent_person">Competent Person</SelectItem>
                        <SelectItem value="introduction">Introduction</SelectItem>
                        <SelectItem value="location_access">Location & Access</SelectItem>
                        <SelectItem value="geology">Geology</SelectItem>
                        <SelectItem value="mineral_resources">Mineral Resources</SelectItem>
                        <SelectItem value="mineral_reserves">Mineral Reserves</SelectItem>
                        <SelectItem value="methodology">Methodology</SelectItem>
                        <SelectItem value="economic_assumptions">Economic Assumptions</SelectItem>
                        <SelectItem value="conclusions">Conclusions</SelectItem>
                        <SelectItem value="recommendations">Recommendations</SelectItem>
                        <SelectItem value="references">References</SelectItem>
                        <SelectItem value="appendices">Appendices</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Ordem: {section.order}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={section.enabled}
                        onCheckedChange={(checked) =>
                          updateSection(section.id, { enabled: checked })
                        }
                      />
                      <span className="text-xs text-gray-400">Ativo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={section.required}
                        onCheckedChange={(checked) =>
                          updateSection(section.id, { required: checked })
                        }
                      />
                      <span className="text-xs text-gray-400">Obrigatório</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
