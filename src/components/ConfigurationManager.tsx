import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Save, Server } from 'lucide-react';
import { infrastructureApi } from '../lib/api';
import { validateConfig } from '@/services/gemini';
import { cn } from '@/lib/utils';
import { useClient } from '@/components/ClientProvider';

interface Device {
  id: string;
  name: string;
  ip: string;
  os?: string;
  config?: string;
}

export function ConfigurationManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [configContent, setConfigContent] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const { selectedClientId } = useClient();

  useEffect(() => {
    infrastructureApi.list(selectedClientId ? { clientId: selectedClientId } : {})
      .then(rows => setDevices(rows as Device[]))
      .catch(console.error);
  }, [selectedClientId]);

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
    setConfigContent(device.config || '');
    setValidationResult(null);
  };

  const handleSave = async () => {
    if (!selectedDevice) return;
    setIsSaving(true);
    try {
      await infrastructureApi.update(selectedDevice.id, { config: configContent });
      setSelectedDevice({ ...selectedDevice, config: configContent });
    } catch (error) {
      console.error('Failed to save config', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!configContent) return;
    setIsValidating(true);
    setValidationResult(null);
    try {
      const result = await validateConfig(configContent);
      setValidationResult(result || "No issues found.");
    } catch (error) {
      setValidationResult("Error validating configuration.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Device List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Network Devices</CardTitle>
          <CardDescription>Select a device to manage its configuration</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {devices.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No devices found.</div>
            ) : (
              devices.map(device => (
                <div 
                  key={device.id} 
                  className={cn("p-4 cursor-pointer flex items-center space-x-3 transition-colors", selectedDevice?.id === device.id ? "bg-muted/30 border-l-4 border-primary" : "hover:bg-muted/10")}
                  onClick={() => handleSelectDevice(device)}
                >
                  <Server className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold text-sm">{device.name}</div>
                    <div className="text-xs text-muted-foreground">{device.ip} • {device.os}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Editor */}
      <Card className="col-span-1 lg:col-span-2 flex flex-col h-[600px]">
        <CardHeader className="border-b flex flex-row items-center justify-between py-4 shrink-0">
          <div>
            <CardTitle className="text-lg">Configuration Editor</CardTitle>
            <CardDescription>{selectedDevice ? selectedDevice.name : 'No device selected'}</CardDescription>
          </div>
          {selectedDevice && (
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={handleValidate} disabled={isValidating || !configContent}>
                {isValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Validate
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || configContent === selectedDevice.config}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Config
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {selectedDevice ? (
            <>
              <div className="flex-1 p-0 overflow-hidden">
                <Textarea 
                  value={configContent}
                  onChange={(e) => setConfigContent(e.target.value)}
                  className="h-full w-full font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] border-0 focus-visible:ring-0 resize-none p-4 rounded-none"
                  placeholder="Enter device configuration here..."
                />
              </div>
              {validationResult && (
                <div className="p-4 bg-muted/20 border-t border-primary/20 text-sm shrink-0 overflow-y-auto max-h-48">
                  <h4 className="font-bold mb-2 flex items-center text-primary">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gemini Analysis
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {validationResult}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a device from the list to view and edit its configuration.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
