import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { FeatureHero } from '@/components/FeatureHero';

export function Onboarding() {
  const [workflowType, setWorkflowType] = useState<'onboarding' | 'offboarding' | 'employee'>('onboarding');
  const [step, setStep] = useState(1);
  const [deviceInfo, setDeviceInfo] = useState({ name: '', model: '', ip: '', owner: '' });
  const [template, setTemplate] = useState('');
  const [monitoring, setMonitoring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setStep(4);
  };

  return (
    <div className="space-y-6">
      <FeatureHero
        eyebrow="Lifecycle · Workflow Orchestration"
        title="Asset Lifecycle Workflows"
        description="Guided onboarding, secure offboarding, and employee asset workflows with repeatable operational steps."
        icon={Sparkles}
        stats={[
          { label: 'Workflow', value: workflowType, icon: Sparkles },
          { label: 'Step', value: step, icon: CheckCircle2 },
          { label: 'Monitoring', value: monitoring ? 'On' : 'Off', icon: CheckCircle2 },
        ]}
        actions={
        <Tabs>
          <TabsList>
            <TabsTrigger active={workflowType === 'onboarding'} onClick={() => { setWorkflowType('onboarding'); setStep(1); }}>Device Onboarding</TabsTrigger>
            <TabsTrigger active={workflowType === 'offboarding'} onClick={() => { setWorkflowType('offboarding'); setStep(1); }}>Device Offboarding</TabsTrigger>
            <TabsTrigger active={workflowType === 'employee'} onClick={() => { setWorkflowType('employee'); setStep(1); }}>Employee Workflow</TabsTrigger>
          </TabsList>
        </Tabs>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>
              {workflowType === 'onboarding' && `Onboarding Step ${step}: ${step === 1 ? 'Discovery' : step === 2 ? 'Template' : step === 3 ? 'Monitoring' : 'Complete'}`}
              {workflowType === 'offboarding' && `Offboarding Step ${step}: ${step === 1 ? 'Selection' : step === 2 ? 'Data Wipe' : step === 3 ? 'Disposal' : 'Complete'}`}
              {workflowType === 'employee' && `Employee Workflow Step ${step}: ${step === 1 ? 'Employee Info' : step === 2 ? 'Asset Allocation' : step === 3 ? 'Verification' : 'Complete'}`}
            </CardTitle>
            <CardDescription>
              {workflowType === 'onboarding' && 'Automated process to bring new hardware into the inventory.'}
              {workflowType === 'offboarding' && 'Securely retire and dispose of hardware assets.'}
              {workflowType === 'employee' && 'Manage asset assignment during employee onboarding/offboarding.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowType === 'onboarding' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    <Input placeholder="Device Name" value={deviceInfo.name} onChange={e => setDeviceInfo({...deviceInfo, name: e.target.value})} />
                    <Input placeholder="Model" value={deviceInfo.model} onChange={e => setDeviceInfo({...deviceInfo, model: e.target.value})} />
                    <Input placeholder="IP Address" value={deviceInfo.ip} onChange={e => setDeviceInfo({...deviceInfo, ip: e.target.value})} />
                    <Button onClick={() => setStep(2)}>Next: Apply Template</Button>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <Select onValueChange={setTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core-switch">Core Switch Template</SelectItem>
                        <SelectItem value="edge-router">Edge Router Template</SelectItem>
                        <SelectItem value="access-switch">Access Switch Template</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setStep(3)}>Next: Monitoring Setup</Button>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="monitoring" checked={monitoring} onCheckedChange={(checked) => setMonitoring(!!checked)} />
                      <label htmlFor="monitoring">Enable Initial Monitoring</label>
                    </div>
                    <Button onClick={handleProcess} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Complete Onboarding
                    </Button>
                  </div>
                )}
              </>
            )}

            {workflowType === 'offboarding' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    <Select onValueChange={v => setDeviceInfo({...deviceInfo, name: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset to retire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AS-1001">Core-Router-01 (AS-1001)</SelectItem>
                        <SelectItem value="AS-1002">Edge-FW-02 (AS-1002)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setStep(2)}>Next: Data Wipe</Button>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                      Warning: This will initiate a remote secure wipe of all configuration and data on the device.
                    </div>
                    <Button variant="destructive" onClick={() => setStep(3)}>Initiate Secure Wipe</Button>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <Select onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select disposal method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recycle">Certified Recycling</SelectItem>
                        <SelectItem value="resell">Resell / Donation</SelectItem>
                        <SelectItem value="destroy">Physical Destruction</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleProcess} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Complete Offboarding
                    </Button>
                  </div>
                )}
              </>
            )}

            {workflowType === 'employee' && (
              <>
                {step === 1 && (
                  <div className="space-y-4">
                    <Input placeholder="Employee Name" />
                    <Input placeholder="Employee ID" />
                    <Select onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder="Action Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="join">New Joiner (Onboarding)</SelectItem>
                        <SelectItem value="leave">Leaver (Offboarding)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setStep(2)}>Next: Asset Allocation</Button>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="laptop" checked={false} onCheckedChange={() => {}} />
                        <label htmlFor="laptop">Laptop (MacBook Pro 14")</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="monitor" checked={false} onCheckedChange={() => {}} />
                        <label htmlFor="monitor">Monitor (Dell 27")</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="phone" checked={false} onCheckedChange={() => {}} />
                        <label htmlFor="phone">Mobile Phone (iPhone 15)</label>
                      </div>
                    </div>
                    <Button onClick={() => setStep(3)}>Next: Verification</Button>
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm">Please confirm that the employee has received and verified the assigned assets.</p>
                    <Button onClick={handleProcess} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Finalize Allocation
                    </Button>
                  </div>
                )}
              </>
            )}

            {step === 4 && (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold">Workflow Complete</h2>
                <p>The {workflowType} process has been successfully completed.</p>
                <Button onClick={() => setStep(1)}>Start New Workflow</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
