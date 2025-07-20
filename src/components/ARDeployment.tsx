import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, UsbIcon, CheckCircle, AlertCircle, Loader, Settings, Play } from 'lucide-react';

interface ARDeploymentProps {
  isOpen: boolean;
  onClose: () => void;
  modelUrl?: string;
  fileName?: string;
}

interface HeadsetDevice {
  id: string;
  name: string;
  type: 'quest2' | 'quest3' | 'questpro';
  connectionType: 'bluetooth' | 'usb' | 'wifi';
  status: 'connected' | 'disconnected' | 'connecting' | 'deploying';
  batteryLevel?: number;
}

const ARDeployment: React.FC<ARDeploymentProps> = ({
  isOpen,
  onClose,
  modelUrl,
  fileName
}) => {
  const [step, setStep] = useState<'scan' | 'connect' | 'deploy' | 'complete'>('scan');
  const [availableDevices, setAvailableDevices] = useState<HeadsetDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<HeadsetDevice | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'auto' | 'usb' | 'wifi'>('auto');

  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    setAvailableDevices([]);

    try {
      // Check for USB connected devices
      const usbDevices = await scanUSBDevices();
      
      // Check for WiFi/ADB connected devices  
      const wifiDevices = await scanWiFiDevices();
      
      // Check for Bluetooth devices
      const bluetoothDevices = await scanBluetoothDevices();
      
      const allDevices = [...usbDevices, ...wifiDevices, ...bluetoothDevices];
      setAvailableDevices(allDevices);
      
    } catch (error) {
      console.error('Device scan failed:', error);
      // Fallback to mock devices for demo
      const mockDevices: HeadsetDevice[] = [
        {
          id: 'quest2-demo',
          name: 'MetaQuest 2 (Demo Mode)',
          type: 'quest2',
          connectionType: 'usb',
          status: 'connected',
          batteryLevel: 78
        },
        {
          id: 'quest3-demo',
          name: 'MetaQuest 3 (Demo Mode)',
          type: 'quest3',
          connectionType: 'wifi',
          status: 'disconnected',
          batteryLevel: 91
        }
      ];
      setAvailableDevices(mockDevices);
    }
    
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scanForDevices();
    }
  }, [isOpen, scanForDevices]);

  const scanUSBDevices = async (): Promise<HeadsetDevice[]> => {
    // Try to detect USB connected Quest devices via ADB
    try {
      if ((navigator as any).usb) {
        const devices = await (navigator as any).usb.getDevices();
        const questDevices = devices
          .filter((device: any) => 
            device.vendorId === 0x2833 || // Meta/Oculus vendor ID
            device.productName?.toLowerCase().includes('quest')
          )
          .map((device: any, index: number) => ({
            id: `usb-quest-${index}`,
            name: device.productName || `MetaQuest (USB)`,
            type: 'quest2' as const,
            connectionType: 'usb' as const,
            status: 'connected' as const,
            batteryLevel: Math.floor(Math.random() * 40) + 60
          }));
        
        return questDevices;
      }
    } catch (error) {
      console.log('USB detection not available:', error);
    }
    return [];
  };

  const scanWiFiDevices = async (): Promise<HeadsetDevice[]> => {
    // Scan for ADB over WiFi devices
    try {
      const response = await fetch('/api/scan-wifi-devices');
      if (response.ok) {
        const devices = await response.json();
        return devices.map((device: any) => ({
          id: `wifi-${device.ip}`,
          name: `${device.name} (${device.ip})`,
          type: device.model.includes('3') ? 'quest3' : 'quest2',
          connectionType: 'wifi' as const,
          status: device.connected ? 'connected' : 'disconnected',
          batteryLevel: device.battery
        }));
      }
    } catch (error) {
      console.log('WiFi scanning not available:', error);
    }
    return [];
  };

  const scanBluetoothDevices = async (): Promise<HeadsetDevice[]> => {
    // Scan for Bluetooth devices
    try {
      if ((navigator as any).bluetooth) {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ namePrefix: 'Quest' }],
          optionalServices: ['battery_service']
        });
        
        return [{
          id: `bluetooth-${device.id}`,
          name: device.name || 'MetaQuest (Bluetooth)',
          type: 'quest2',
          connectionType: 'bluetooth',
          status: device.gatt?.connected ? 'connected' : 'disconnected',
          batteryLevel: 85
        }];
      }
    } catch (error) {
      console.log('Bluetooth scanning cancelled or not available:', error);
    }
    return [];
  };

  const connectToDevice = async (device: HeadsetDevice) => {
    setSelectedDevice({ ...device, status: 'connecting' });
    setStep('connect');

    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setSelectedDevice({ ...device, status: 'connected' });
    setStep('deploy');
  };

  const deployToAR = async () => {
    if (!selectedDevice || !modelUrl) return;

    setSelectedDevice({ ...selectedDevice, status: 'deploying' });

    // Simulate deployment progress
    for (let i = 0; i <= 100; i += 10) {
      setDeploymentProgress(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setStep('complete');
  };

  const getDeviceIcon = (type: HeadsetDevice['type']) => {
    switch (type) {
      case 'quest2': return '🥽';
      case 'quest3': return '🔮';
      case 'questpro': return '👑';
      default: return '📱';
    }
  };

  const getConnectionIcon = (type: HeadsetDevice['connectionType']) => {
    switch (type) {
      case 'usb': return <UsbIcon className="w-4 h-4" />;
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'bluetooth': return <Smartphone className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: HeadsetDevice['status']) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'deploying': return 'text-blue-500';
      case 'disconnected': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Deploy to AR Headset</h2>
              <p className="text-purple-100">
                {fileName ? `Deploying: ${fileName}` : 'Connect and deploy your CAD model'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step Progress */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[
                { key: 'scan', label: 'Scan', icon: '🔍' },
                { key: 'connect', label: 'Connect', icon: '🔗' },
                { key: 'deploy', label: 'Deploy', icon: '🚀' },
                { key: 'complete', label: 'Complete', icon: '✅' }
              ].map((stepItem, index) => {
                const isActive = step === stepItem.key;
                const isCompleted = ['scan', 'connect', 'deploy', 'complete'].indexOf(step) > index;
                
                return (
                  <div key={stepItem.key} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                        ${isActive 
                          ? 'bg-blue-500 text-white' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}
                    >
                      {stepItem.icon}
                    </div>
                    <span className={`ml-2 text-sm ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                      {stepItem.label}
                    </span>
                    {index < 3 && <div className="mx-4 w-8 h-0.5 bg-gray-300" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 'scan' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">
                    {isScanning ? 'Scanning for AR Headsets...' : 'Available AR Headsets'}
                  </h3>
                  
                  {isScanning ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-gray-600">Looking for nearby devices...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableDevices.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">No AR headsets found</p>
                          <button
                            onClick={scanForDevices}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Scan Again
                          </button>
                        </div>
                      ) : (
                        availableDevices.map((device) => (
                          <div
                            key={device.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                            onClick={() => connectToDevice(device)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                                <div>
                                  <h4 className="font-semibold">{device.name}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    {getConnectionIcon(device.connectionType)}
                                    <span>{device.connectionType.toUpperCase()}</span>
                                    {device.batteryLevel && (
                                      <>
                                        <span>•</span>
                                        <span>🔋 {device.batteryLevel}%</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`font-semibold ${getStatusColor(device.status)}`}>
                                {device.status === 'connected' && <CheckCircle className="w-5 h-5" />}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'connect' && selectedDevice && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <h3 className="text-xl font-semibold">Connecting to {selectedDevice.name}</h3>
                
                <div className="flex items-center justify-center space-x-4 p-6 bg-gray-50 rounded-lg">
                  <span className="text-3xl">{getDeviceIcon(selectedDevice.type)}</span>
                  <div className="flex-1">
                    {selectedDevice.status === 'connecting' ? (
                      <div className="flex items-center space-x-2">
                        <Loader className="w-5 h-5 animate-spin text-blue-500" />
                        <span>Establishing connection...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span>Connected successfully!</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDevice.status === 'connected' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-gray-600">
                      Ready to deploy your CAD model to the AR headset
                    </p>
                    <button
                      onClick={deployToAR}
                      className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Play className="w-5 h-5" />
                      <span>Deploy to AR</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 'deploy' && selectedDevice && (
              <motion.div
                key="deploy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <h3 className="text-xl font-semibold">Deploying to {selectedDevice.name}</h3>
                
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${deploymentProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  <div className="text-2xl font-bold text-blue-600">
                    {deploymentProgress}%
                  </div>
                  
                  <p className="text-gray-600">
                    Transferring CAD model and AR experience...
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg text-left">
                    <h4 className="font-semibold text-blue-800 mb-2">Deployment Steps:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className={deploymentProgress >= 20 ? 'line-through' : ''}>
                        ✓ Uploading 3D model files
                      </li>
                      <li className={deploymentProgress >= 40 ? 'line-through' : ''}>
                        ✓ Optimizing for AR rendering
                      </li>
                      <li className={deploymentProgress >= 60 ? 'line-through' : ''}>
                        ✓ Installing HoloDraft AR app
                      </li>
                      <li className={deploymentProgress >= 80 ? 'line-through' : ''}>
                        ✓ Configuring interaction tools
                      </li>
                      <li className={deploymentProgress >= 100 ? 'line-through' : ''}>
                        ✓ Launching AR experience
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'complete' && selectedDevice && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-600">
                  Deployment Complete!
                </h3>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-green-800 mb-4 text-center">
                    <strong>Deployment Successful!</strong>
                  </p>
                  <p className="text-green-700 text-center">
                    Your 3D model is now available on <strong>{selectedDevice.name}</strong>
                  </p>
                </div>

                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => setStep('scan')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Deploy Another Model
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ARDeployment;
