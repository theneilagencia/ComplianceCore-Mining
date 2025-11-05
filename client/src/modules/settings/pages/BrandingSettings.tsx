import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Trash2, Eye, Crown } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  headerText?: string;
  footerText?: string;
}

export default function BrandingSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canCustomize, setCanCustomize] = useState(false);
  const [settings, setSettings] = useState<BrandingSettings>({
    primaryColor: '#2f2c79',
    secondaryColor: '#b96e48',
  });
  const [previewLogo, setPreviewLogo] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/branding`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const data = await response.json();
      setCanCustomize(data.canCustomize);
      
      if (data.branding) {
        setSettings({
          logo: data.branding.logo,
          primaryColor: data.branding.primaryColor || '#2f2c79',
          secondaryColor: data.branding.secondaryColor || '#b96e48',
          headerText: data.branding.headerText,
          footerText: data.branding.footerText,
        });
        setPreviewLogo(data.branding.logo);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo deve ter no máximo 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Arquivo deve ser uma imagem');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings({ ...settings, logo: base64 });
      setPreviewLogo(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_BASE_URL}/api/branding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar configurações');
      }

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja restaurar as configurações padrão do QIVO?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/branding`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao restaurar configurações padrão');
      }

      // Recarregar configurações
      await loadBranding();
      setSuccess('Configurações restauradas para padrão QIVO');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao restaurar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#2f2c79]" />
      </div>
    );
  }

  if (!canCustomize) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 bg-gradient-to-br from-[#2f2c79]/10 to-[#b96e48]/10 border-[#b96e48]">
          <div className="text-center space-y-4">
            <Crown className="h-16 w-16 text-[#b96e48] mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Customização de Marca
            </h2>
            <p className="text-gray-600">
              A customização de marca está disponível apenas para planos <strong>PRO</strong> e <strong>ENTERPRISE</strong>.
            </p>
            <p className="text-sm text-gray-500">
              Seu plano atual: <strong>{user?.license?.plan || 'FREE'}</strong>
            </p>
            <Button
              className="mt-4 bg-[#2f2c79] hover:bg-[#b96e48]"
              onClick={() => window.location.href = '/#pricing'}
            >
              Ver Planos
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customização de Marca</h1>
        <p className="text-gray-600 mt-2">
          Personalize seus relatórios com sua identidade visual
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Logo</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">Upload de Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG ou SVG. Máximo 2MB.
                </p>
              </div>
              {previewLogo && (
                <div className="flex items-center gap-4">
                  <img
                    src={previewLogo}
                    alt="Logo preview"
                    className="h-16 w-auto object-contain"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSettings({ ...settings, logo: undefined });
                      setPreviewLogo(undefined);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cores</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      setSettings({ ...settings, primaryColor: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) =>
                      setSettings({ ...settings, primaryColor: e.target.value })
                    }
                    placeholder="#2f2c79"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      setSettings({ ...settings, secondaryColor: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) =>
                      setSettings({ ...settings, secondaryColor: e.target.value })
                    }
                    placeholder="#b96e48"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Textos</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="headerText">Texto do Cabeçalho (opcional)</Label>
                <Input
                  id="headerText"
                  type="text"
                  value={settings.headerText || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, headerText: e.target.value })
                  }
                  placeholder="Ex: Relatório Técnico - Sua Empresa"
                  className="mt-2"
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="footerText">Texto do Rodapé (opcional)</Label>
                <Textarea
                  id="footerText"
                  value={settings.footerText || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, footerText: e.target.value })
                  }
                  placeholder="Ex: Documento confidencial - Uso restrito"
                  className="mt-2"
                  maxLength={500}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#2f2c79] hover:bg-[#b96e48]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Restaurar Padrão
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <Card className="p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Preview do Relatório</h3>
            </div>
            <div
              className="border rounded-lg p-6 space-y-4"
              style={{
                borderColor: settings.primaryColor,
              }}
            >
              {/* Header */}
              <div
                className="p-4 rounded-t-lg flex items-center justify-between"
                style={{
                  backgroundColor: settings.primaryColor,
                  color: '#ffffff',
                }}
              >
                {previewLogo && (
                  <img
                    src={previewLogo}
                    alt="Logo"
                    className="h-8 w-auto object-contain"
                  />
                )}
                <div className="text-sm font-medium">
                  {settings.headerText || 'Relatório Técnico'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h4
                  className="text-lg font-bold"
                  style={{ color: settings.primaryColor }}
                >
                  Título do Relatório
                </h4>
                <p className="text-sm text-gray-600">
                  Este é um exemplo de como seu relatório ficará com as configurações de marca aplicadas.
                </p>
                <div
                  className="inline-block px-3 py-1 rounded text-white text-sm"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  Destaque
                </div>
              </div>

              {/* Footer */}
              <div
                className="p-3 rounded-b-lg text-xs text-center"
                style={{
                  backgroundColor: `${settings.primaryColor}20`,
                  color: settings.primaryColor,
                }}
              >
                {settings.footerText || 'Powered by QIVO Mining'}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
