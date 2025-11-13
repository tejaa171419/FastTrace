import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Palette, Sparkles, Eye, Settings, Sun, Moon, 
  Layers, Zap, RefreshCw, Download, Upload,
  Droplets, Circle, Square
} from "lucide-react";

interface GlassConfig {
  blur: number;
  opacity: number;
  borderRadius: number;
  borderOpacity: number;
  shadowIntensity: number;
  backgroundTint: string;
}

interface ThemeVariant {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  description: string;
}

const GlassmorphismDesignSystem = () => {
  const [activeTheme, setActiveTheme] = useState('default');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [glassConfig, setGlassConfig] = useState<GlassConfig>({
    blur: 16,
    opacity: 0.1,
    borderRadius: 12,
    borderOpacity: 0.2,
    shadowIntensity: 25,
    backgroundTint: '#ffffff'
  });

  const themeVariants: ThemeVariant[] = [
    {
      name: 'default',
      primary: '#6366f1',
      secondary: '#8b5cf6', 
      accent: '#06b6d4',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Classic purple gradient with modern appeal'
    },
    {
      name: 'ocean',
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#10b981',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Ocean-inspired blue and teal tones'
    },
    {
      name: 'sunset',
      primary: '#f59e0b',
      secondary: '#ef4444',
      accent: '#ec4899',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: 'Warm sunset colors with vibrant energy'
    },
    {
      name: 'forest',
      primary: '#10b981',
      secondary: '#059669',
      accent: '#84cc16',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: 'Natural forest greens with fresh accents'
    },
    {
      name: 'midnight',
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#7c3aed',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      description: 'Deep midnight blues with mysterious vibes'
    }
  ];

  const updateGlassConfig = (key: keyof GlassConfig, value: number | string) => {
    setGlassConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateGlassCSS = (config: GlassConfig) => {
    return {
      backdropFilter: `blur(${config.blur}px)`,
      backgroundColor: `rgba(255, 255, 255, ${config.opacity})`,
      borderRadius: `${config.borderRadius}px`,
      border: `1px solid rgba(255, 255, 255, ${config.borderOpacity})`,
      boxShadow: `0 8px 32px 0 rgba(31, 38, 135, ${config.shadowIntensity / 100})`
    };
  };

  const currentTheme = themeVariants.find(t => t.name === activeTheme) || themeVariants[0];

  return (
    <div className="min-h-screen p-6" style={{ background: currentTheme.background }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="glass-card border-white/20 backdrop-blur-xl bg-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="w-6 h-6" />
                  Glassmorphism Design System
                </CardTitle>
                <CardDescription className="text-white/70">
                  Advanced UI components with modern glass effects and responsive design
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-white/70" />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                  />
                  <Moon className="w-4 h-4 text-white/70" />
                </div>
                <Button variant="ghost" className="text-white border-white/20">
                  <Download className="w-4 h-4 mr-2" />
                  Export Theme
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Theme Selection */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-white/20 backdrop-blur-xl bg-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Palette className="w-5 h-5" />
                  Theme Variants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {themeVariants.map((theme) => (
                  <div
                    key={theme.name}
                    className={`p-4 rounded-lg cursor-pointer transition-all border ${
                      activeTheme === theme.name 
                        ? 'border-white/40 bg-white/20' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setActiveTheme(theme.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white capitalize">{theme.name}</h4>
                      {activeTheme === theme.name && (
                        <Badge className="bg-white/20 text-white">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/70 mb-3">{theme.description}</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Glass Configuration */}
            <Card className="glass-card border-white/20 backdrop-blur-xl bg-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5" />
                  Glass Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90">Blur Intensity</Label>
                    <span className="text-white/70 text-sm">{glassConfig.blur}px</span>
                  </div>
                  <Slider
                    value={[glassConfig.blur]}
                    onValueChange={([value]) => updateGlassConfig('blur', value)}
                    max={40}
                    min={0}
                    step={2}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90">Background Opacity</Label>
                    <span className="text-white/70 text-sm">{Math.round(glassConfig.opacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[glassConfig.opacity * 100]}
                    onValueChange={([value]) => updateGlassConfig('opacity', value / 100)}
                    max={50}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90">Border Radius</Label>
                    <span className="text-white/70 text-sm">{glassConfig.borderRadius}px</span>
                  </div>
                  <Slider
                    value={[glassConfig.borderRadius]}
                    onValueChange={([value]) => updateGlassConfig('borderRadius', value)}
                    max={32}
                    min={0}
                    step={4}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90">Shadow Intensity</Label>
                    <span className="text-white/70 text-sm">{glassConfig.shadowIntensity}%</span>
                  </div>
                  <Slider
                    value={[glassConfig.shadowIntensity]}
                    onValueChange={([value]) => updateGlassConfig('shadowIntensity', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                <Button 
                  onClick={() => setGlassConfig({
                    blur: 16,
                    opacity: 0.1,
                    borderRadius: 12,
                    borderOpacity: 0.2,
                    shadowIntensity: 25,
                    backgroundTint: '#ffffff'
                  })}
                  variant="ghost" 
                  className="w-full text-white border-white/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="components" className="space-y-6">
              <div className="flex items-center justify-center">
                <TabsList className="bg-white/10 border-white/20 backdrop-blur-xl">
                  <TabsTrigger value="components" className="text-white data-[state=active]:bg-white/20">
                    Components
                  </TabsTrigger>
                  <TabsTrigger value="layouts" className="text-white data-[state=active]:bg-white/20">
                    Layouts
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="text-white data-[state=active]:bg-white/20">
                    Effects
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="components" className="space-y-6">
                {/* Component Previews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Glass Card */}
                  <div
                    className="p-6 rounded-lg border"
                    style={generateGlassCSS(glassConfig)}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: currentTheme.primary }}
                      >
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Glass Card</h3>
                        <p className="text-white/70 text-sm">Modern card design</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mb-4">
                      This is a glassmorphism card component with dynamic blur effects and transparency.
                    </p>
                    <Button 
                      className="w-full"
                      style={{ backgroundColor: currentTheme.accent }}
                    >
                      Action Button
                    </Button>
                  </div>

                  {/* Navigation Glass */}
                  <div
                    className="p-4 rounded-lg border"
                    style={generateGlassCSS(glassConfig)}
                  >
                    <nav className="space-y-2">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
                        <Circle className="w-4 h-4 text-white" />
                        <span className="text-white font-medium">Dashboard</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                        <Square className="w-4 h-4 text-white/70" />
                        <span className="text-white/70">Analytics</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                        <Zap className="w-4 h-4 text-white/70" />
                        <span className="text-white/70">Settings</span>
                      </div>
                    </nav>
                  </div>

                  {/* Stats Glass */}
                  <div
                    className="p-6 rounded-lg border text-center"
                    style={generateGlassCSS(glassConfig)}
                  >
                    <div className="text-3xl font-bold text-white mb-1">₹42,350</div>
                    <div className="text-white/70 text-sm mb-3">Total Balance</div>
                    <div className="flex items-center justify-center gap-1">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: currentTheme.accent }}
                      >
                        +12.5%
                      </span>
                      <span className="text-white/50 text-xs">this month</span>
                    </div>
                  </div>

                  {/* Input Glass */}
                  <div
                    className="p-6 rounded-lg border space-y-4"
                    style={generateGlassCSS(glassConfig)}
                  >
                    <h3 className="font-semibold text-white mb-3">Glass Form</h3>
                    <input
                      type="text"
                      placeholder="Enter amount..."
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 backdrop-blur-sm"
                    />
                    <select className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                      <option>Select category</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layouts" className="space-y-6">
                {/* Layout Examples */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Dashboard Layout */}
                  <div
                    className="p-6 rounded-lg border"
                    style={generateGlassCSS(glassConfig)}
                  >
                    <h3 className="font-semibold text-white mb-4">Dashboard Layout</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                        <div className="text-white font-medium">Revenue</div>
                        <div className="text-2xl font-bold text-white">₹1.2M</div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                        <div className="text-white font-medium">Users</div>
                        <div className="text-2xl font-bold text-white">12.4K</div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                        <div className="text-white font-medium">Growth</div>
                        <div className="text-2xl font-bold text-white">+23%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-6">
                {/* Effect Demonstrations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Blur Variations */}
                  {[8, 16, 24, 32].map((blur) => (
                    <div
                      key={blur}
                      className="p-4 rounded-lg border"
                      style={{
                        backdropFilter: `blur(${blur}px)`,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-white" />
                        <span className="text-white font-medium">Blur {blur}px</span>
                      </div>
                      <p className="text-white/70 text-sm">
                        Glass effect with {blur}px backdrop blur
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphismDesignSystem;