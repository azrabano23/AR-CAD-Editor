import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  CreditCard, 
  Smartphone, 
  Plus, 
  Trash2, 
  Wifi, 
  WifiOff, 
  Save,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { HoloDraftUser } from '../lib/supabaseClient';
import ModernButton from './ModernButton';
import './UserProfile.css';

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

interface UserProfileProps {
  user: HoloDraftUser;
  onClose: () => void;
  onUpdateUser: (updatedUser: HoloDraftUser) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'devices' | 'subscription'>('profile');
  const [arDevices, setArDevices] = useState<ARDevice[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceDiscovering, setDeviceDiscovering] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.full_name || '',
    email: user.email || ''
  });

  // Load AR devices on mount
  useEffect(() => {
    loadARDevices();
  }, [user.id]);

  const loadARDevices = async () => {
    // In real implementation, this would fetch from Supabase
    // For now, load from localStorage or mock data
    const savedDevices = localStorage.getItem(`ar_devices_${user.id}`);
    if (savedDevices) {
      setArDevices(JSON.parse(savedDevices));
    }
  };

  const saveARDevices = (devices: ARDevice[]) => {
    localStorage.setItem(`ar_devices_${user.id}`, JSON.stringify(devices));
    setArDevices(devices);
  };

  const handleAddDevice = () => {
    setShowAddDevice(true);
  };

  const handleDeviceDiscovery = async () => {
    setDeviceDiscovering(true);
    
    try {
      // Simulate device discovery process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock discovered devices (in real app, this would use WebRTC/mDNS)
      const discoveredDevices: ARDevice[] = [
        {
          id: `device_${Date.now()}`,
          name: 'My MetaQuest 3',
          type: 'MetaQuest',
          model: 'Quest 3',
          ipAddress: '192.168.1.100',
          isConnected: true,
          lastConnected: new Date().toISOString(),
          status: 'paired'
        }
      ];
      
      const updatedDevices = [...arDevices, ...discoveredDevices];
      saveARDevices(updatedDevices);
      setShowAddDevice(false);
    } catch (error) {
      console.error('Device discovery failed:', error);
    } finally {
      setDeviceDiscovering(false);
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    const updatedDevices = arDevices.filter(device => device.id !== deviceId);
    saveARDevices(updatedDevices);
  };

  const handleTestConnection = async (deviceId: string) => {
    const device = arDevices.find(d => d.id === deviceId);
    if (!device) return;

    // Update device status to connecting
    const updatedDevices = arDevices.map(d => 
      d.id === deviceId ? { ...d, status: 'connecting' as const } : d
    );
    setArDevices(updatedDevices);

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update to connected
      const finalDevices = arDevices.map(d => 
        d.id === deviceId ? { 
          ...d, 
          status: 'paired' as const, 
          isConnected: true, 
          lastConnected: new Date().toISOString() 
        } : d
      );
      saveARDevices(finalDevices);
    } catch (error) {
      // Update to error
      const errorDevices = arDevices.map(d => 
        d.id === deviceId ? { ...d, status: 'error' as const, isConnected: false } : d
      );
      saveARDevices(errorDevices);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser: HoloDraftUser = {
        ...user,
        full_name: formData.fullName,
        email: formData.email
      };
      
      onUpdateUser(updatedUser);
      // In real app, save to Supabase here
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const getDeviceIcon = (type: string) => {
    return type === 'MetaQuest' ? '🥽' : '👓';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paired': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const canAddMoreDevices = () => {
    if (user.subscription_type === 'free') {
      return arDevices.length < 1; // Free users can only have 1 device
    }
    return true; // Paid users can have unlimited devices
  };

  return (
    <div className="user-profile-overlay">
      <motion.div 
        className="user-profile-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="profile-header">
          <div className="header-left">
            <button onClick={onClose} className="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="header-info">
              <h2>Account Settings</h2>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="subscription-badge">
            {user.subscription_type === 'free' ? '🆓 Free' : '⭐ Pro'} Plan
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button 
            className={`tab ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            <Smartphone className="w-4 h-4" />
            AR Devices ({arDevices.length})
          </button>
          <button 
            className={`tab ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            <CreditCard className="w-4 h-4" />
            Subscription
          </button>
        </div>

        {/* Content */}
        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <ModernButton 
                  variant="primary" 
                  onClick={handleSaveProfile}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </ModernButton>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="devices-section">
              <div className="section-header">
                <div>
                  <h3>Connected AR Devices</h3>
                  <p>Manage your MetaQuest and HoloLens devices for instant deployment</p>
                  {user.subscription_type === 'free' && (
                    <div className="free-limit-notice">
                      <span>🆓 Free users can connect up to 1 device. Upgrade for unlimited devices.</span>
                    </div>
                  )}
                </div>
                {canAddMoreDevices() && (
                  <ModernButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={handleAddDevice}
                  >
                    Add Device
                  </ModernButton>
                )}
              </div>

              {arDevices.length === 0 ? (
                <div className="empty-devices">
                  <Smartphone className="w-16 h-16 text-gray-300" />
                  <h4>No AR devices connected</h4>
                  <p>Add your MetaQuest or HoloLens to enable instant deployment</p>
                  {canAddMoreDevices() && (
                    <ModernButton
                      variant="primary"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={handleAddDevice}
                    >
                      Connect First Device
                    </ModernButton>
                  )}
                </div>
              ) : (
                <div className="devices-list">
                  {arDevices.map((device) => (
                    <div key={device.id} className="device-card">
                      <div className="device-info">
                        <div className="device-icon">
                          {getDeviceIcon(device.type)}
                        </div>
                        <div className="device-details">
                          <h4>{device.name}</h4>
                          <p>{device.type} {device.model}</p>
                          <span className="device-ip">{device.ipAddress}</span>
                        </div>
                      </div>
                      
                      <div className="device-status">
                        <span className={`status-badge ${getStatusColor(device.status)}`}>
                          {device.isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {device.status}
                        </span>
                        <div className="device-actions">
                          <button 
                            onClick={() => handleTestConnection(device.id)}
                            className="test-btn"
                            disabled={device.status === 'connecting'}
                          >
                            {device.status === 'connecting' ? '⏳' : '🔄'} Test
                          </button>
                          <button 
                            onClick={() => handleRemoveDevice(device.id)}
                            className="remove-btn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Device Modal */}
              {showAddDevice && (
                <div className="add-device-modal">
                  <div className="modal-content">
                    <h4>Add AR Device</h4>
                    <p>Make sure your device is on the same network and has HoloDraft companion app installed.</p>
                    
                    <div className="discovery-section">
                      <h5>📱 Download Companion App First:</h5>
                      <div className="supported-devices">
                        <div className="device-type">
                          <span>🥽 <strong>MetaQuest 2/3:</strong> Install via SideQuest or Developer Hub</span>
                        </div>
                        <div className="device-type">
                          <span>👓 <strong>HoloLens:</strong> Deploy via Device Portal or Visual Studio</span>
                        </div>
                      </div>
                      <div style={{marginTop: '12px', padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '6px', fontSize: '12px', color: '#166534'}}>
                        💡 <strong>Important:</strong> The companion app must be installed before you can connect your device for AR deployment.
                      </div>
                    </div>

                    <div className="modal-actions">
                      <ModernButton
                        variant="primary"
                        loading={deviceDiscovering}
                        onClick={handleDeviceDiscovery}
                        disabled={!canAddMoreDevices()}
                      >
                        {deviceDiscovering ? 'Discovering...' : 'Discover Devices'}
                      </ModernButton>
                      <ModernButton
                        variant="secondary"
                        onClick={() => setShowAddDevice(false)}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="subscription-section">
              <div className="current-plan">
                <h3>Current Plan</h3>
                <div className="plan-card">
                  <div className="plan-info">
                    <h4>{user.subscription_type === 'free' ? 'Free Plan' : 'Pro Plan'}</h4>
                    <p>{user.subscription_type === 'free' 
                      ? 'Perfect for getting started with AR'
                      : 'Full access to all HoloDraft features'
                    }</p>
                  </div>
                  <div className="plan-features">
                    <div className="feature">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Unlimited CAD uploads</span>
                    </div>
                    <div className="feature">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>WebGL & AR preview</span>
                    </div>
                    <div className="feature">
                      {user.subscription_type === 'free' ? (
                        <>
                          <span className="limit-badge">1</span>
                          <span>AR device connection</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Unlimited AR devices</span>
                        </>
                      )}
                    </div>
                    <div className="feature">
                      {user.subscription_type === 'free' ? (
                        <span className="text-gray-400">❌ Advanced collaboration</span>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Advanced collaboration</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {user.subscription_type === 'free' && (
                  <div className="upgrade-cta">
                    <h4>Ready to unlock full potential?</h4>
                    <p>Connect unlimited AR devices and enable advanced collaboration features</p>
                    <ModernButton variant="primary" size="lg">
                      Upgrade to Pro
                    </ModernButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfile;
