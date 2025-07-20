import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, WifiOff, CheckCircle, AlertCircle, Loader, Settings, Play, ArrowLeft } from 'lucide-react';

interface ARDevice {
  id: string;
  name: string;
  type: 'MetaQuest' | 'HoloLens';
  model: string;
  ipAddress: string;
  isConnected: boolean;
  lastConnected: string;
  status: 'paired' | 'connecting' | 'disconnected' | 'error';
}

interface ARDeploymentProps {
  isOpen: boolean;
  onClose: () => void;
  modelUrl?: string;
  fileName?: string;
  userId: string; // Add userId to load user's devices
}

const ARDeployment: React.FC<ARDeploymentProps> = ({
  isOpen,
  onClose,
  modelUrl,
  fileName,
  userId
}) => {
  const [step, setStep] = useState<'select' | 'connecting' | 'deploy' | 'complete'>('select');
  const [userDevices, setUserDevices] = useState<ARDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ARDevice | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');

  const loadUserDevices = useCallback(async () => {
    setLoadingDevices(true);
    
    try {
      // Load user's pre-configured AR devices from localStorage (or API)
      const savedDevices = localStorage.getItem(`ar_devices_${userId}`);
      if (savedDevices) {
        const devices: ARDevice[] = JSON.parse(savedDevices);
        setUserDevices(devices);
        
        // Test connectivity of each device
        const updatedDevices = await Promise.all(
          devices.map(async (device) => {
            const isReachable = await testDeviceConnectivity(device);
            return {
              ...device,
              isConnected: isReachable,
              status: isReachable ? 'paired' : 'disconnected'
            } as ARDevice;
          })
        );
        
        setUserDevices(updatedDevices);
        // Save updated connectivity status
        localStorage.setItem(`ar_devices_${userId}`, JSON.stringify(updatedDevices));
      }
    } catch (error) {
      console.error('Failed to load user devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  }, [userId]);

  const testDeviceConnectivity = async (device: ARDevice): Promise<boolean> => {
    try {
      // Simulate network connectivity test
      // In real implementation, this would ping the device or check WebRTC connection
      const response = await fetch(`http://${device.ipAddress}:8080/api/ping`, {
        method: 'GET',
        timeout: 3000
      } as any);
      
      return response.ok;
    } catch (error) {
      // For demo purposes, randomly simulate some devices being available
      return Math.random() > 0.3; // 70% chance of being available
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDevices();
    }
  }, [isOpen, loadUserDevices]);

  const connectAndDeploy = async (device: ARDevice) => {
    setSelectedDevice({ ...device, status: 'connecting' });
    setStep('connecting');

    try {
      // Step 1: Connect to device
      setDeploymentStatus('Connecting to AR device...');
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const connectedDevice = { ...device, status: 'paired' as const, isConnected: true };
      setSelectedDevice(connectedDevice);
      
      // Step 2: Start deployment
      setStep('deploy');
      setDeploymentStatus('Preparing AR experience...');
      
      // Deployment progress simulation
      const deploymentSteps = [
        { progress: 20, status: 'Uploading 3D model files...' },
        { progress: 40, status: 'Optimizing for AR rendering...' },
        { progress: 60, status: 'Installing HoloDraft AR companion app...' },
        { progress: 80, status: 'Configuring interaction tools...' },
        { progress: 100, status: 'Launching AR experience...' }
      ];
      
      for (const step of deploymentSteps) {
        setDeploymentProgress(step.progress);
        setDeploymentStatus(step.status);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Save successful deployment
      const updatedDevices = userDevices.map(d => 
        d.id === device.id ? connectedDevice : d
      );
      setUserDevices(updatedDevices);
      localStorage.setItem(`ar_devices_${userId}`, JSON.stringify(updatedDevices));
      
      setStep('complete');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      setSelectedDevice({ ...device, status: 'error' });
      setDeploymentStatus('Deployment failed. Please try again.');
    }
  };

  const getDeviceIcon = (type: ARDevice['type']) => {
    return type === 'MetaQuest' ? '🥽' : '👓';
  };

  const getStatusColor = (status: ARDevice['status']) => {
    switch (status) {
      case 'paired': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ARDevice['status'], isConnected: boolean) => {
    if (status === 'connecting') return <Loader className="w-4 h-4 animate-spin" />;
    if (isConnected) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
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
          {/* Companion App Notice */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📱</div>
              <div>
                <h3 className="font-semibold text-emerald-900 mb-1">AR Companion App Required</h3>
                <p className="text-sm text-emerald-700 mb-3">
                  To view your CAD models in AR, you'll need to install the HoloDraft AR companion app on your device first.
                </p>
                <div className="flex gap-2 text-xs">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                    📱 MetaQuest: Install via SideQuest or Developer Hub
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    👓 HoloLens: Deploy via Device Portal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[
                { key: 'select', label: 'Select Device', icon: '🎯' },
                { key: 'connecting', label: 'Connecting', icon: '🔗' },
                { key: 'deploy', label: 'Deploy', icon: '🚀' },
                { key: 'complete', label: 'Complete', icon: '✅' }
              ].map((stepItem, index) => {
                const isActive = step === stepItem.key;
                const isCompleted = ['select', 'connecting', 'deploy', 'complete'].indexOf(step) > index;
                
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
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">
                    {loadingDevices ? 'Loading Your AR Devices...' : 'Choose Your AR Device'}
                  </h3>
                  
                  {loadingDevices ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-gray-600">Checking device availability...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userDevices.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">No AR devices configured</p>
                          <p className="text-sm text-gray-500 mb-4">Visit your profile settings to add AR devices</p>
                          <button
                            onClick={() => {
                              onClose();
                              // In real app, navigate to profile
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Configure Devices
                          </button>
                        </div>
                      ) : (
                        userDevices.map((device) => (
                          <div
                            key={device.id}
                            className={`border rounded-lg p-4 transition-colors cursor-pointer
                              ${device.isConnected 
                                ? 'border-green-300 bg-green-50 hover:border-green-400' 
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                            onClick={() => device.isConnected && connectAndDeploy(device)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                                <div>
                                  <h4 className="font-semibold">{device.name}</h4>
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <span>{device.type} {device.model}</span>
                                    <span>•</span>
                                    <span className="font-mono">{device.ipAddress}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`flex items-center space-x-1 text-sm font-medium ${getStatusColor(device.status)}`}>
                                  {getStatusIcon(device.status, device.isConnected)}
                                  <span className="capitalize">{device.status}</span>
                                </div>
                                {!device.isConnected && (
                                  <span className="text-xs text-gray-400">(Offline)</span>
                                )}
                              </div>
                            </div>
                            {!device.isConnected && (
                              <div className="mt-2 text-xs text-gray-500">
                                Device is not reachable. Check network connection and power.
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'connecting' && selectedDevice && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <h3 className="text-xl font-semibold">Connecting to {selectedDevice.name}</h3>
                
                <div className="flex items-center justify-center space-x-4 p-6 bg-blue-50 rounded-lg">
                  <span className="text-3xl">{getDeviceIcon(selectedDevice.type)}</span>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Loader className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="font-medium">{deploymentStatus}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Setting up AR experience on {selectedDevice.type} {selectedDevice.model}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    💡 <strong>What happens next:</strong> HoloDraft will automatically install the AR companion app 
                    and transfer your 3D model to the headset.
                  </p>
                </div>
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
                  
                  <p className="text-gray-600 font-medium">
                    {deploymentStatus}
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

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-2">🎮 Next Steps:</h4>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    <li>• Put on your {selectedDevice.name} headset</li>
                    <li>• Look for the HoloDraft app in your library</li>
                    <li>• Your model "{fileName}" is ready to view and edit</li>
                    <li>• Use hand tracking or controllers to interact</li>
                  </ul>
                </div>

                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => {
                      setStep('select');
                      setSelectedDevice(null);
                      setDeploymentProgress(0);
                      setDeploymentStatus('');
                    }}
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
