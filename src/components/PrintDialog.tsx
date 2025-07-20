import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  Wifi, 
  Usb, 
  Settings, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Layers,
  Thermometer,
  Timer
} from 'lucide-react';
import ModernButton from './ModernButton';
import './PrintDialog.css';

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  userId: string;
}

interface Printer {
  id: string;
  name: string;
  type: 'usb' | 'network' | 'bluetooth';
  status: 'online' | 'offline' | 'printing' | 'error';
  connection: string;
  model?: string;
  temperature?: {
    extruder: number;
    bed: number;
  };
}

interface PrintJob {
  id: string;
  fileName: string;
  status: 'queued' | 'printing' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
  elapsed: number;
}

const PrintDialog: React.FC<PrintDialogProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName, 
  userId 
}) => {
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    quality: 'medium',
    infill: 20,
    supports: true,
    rafts: false,
    material: 'PLA'
  });

  // Mock printer discovery
  const mockPrinters: Printer[] = [
    {
      id: 'prusa-mk3s',
      name: 'Prusa i3 MK3S+',
      type: 'usb',
      status: 'online',
      connection: 'USB Port 1',
      model: 'Prusa i3 MK3S+',
      temperature: { extruder: 210, bed: 60 }
    },
    {
      id: 'ender-3',
      name: 'Ender 3 V2',
      type: 'network',
      status: 'online',
      connection: '192.168.1.100',
      model: 'Creality Ender 3 V2',
      temperature: { extruder: 200, bed: 50 }
    },
    {
      id: 'bambu-x1',
      name: 'Bambu Lab X1 Carbon',
      type: 'network',
      status: 'printing',
      connection: '192.168.1.101',
      model: 'Bambu Lab X1 Carbon'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      // Simulate printer discovery
      setIsScanning(true);
      setTimeout(() => {
        setPrinters(mockPrinters);
        setIsScanning(false);
      }, 2000);
    }
  }, [isOpen]);

  const handleScanPrinters = async () => {
    setIsScanning(true);
    try {
      // Simulate API call to scan for printers
      const response = await fetch('/api/printers/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrinters(data.printers || mockPrinters);
      } else {
        setPrinters(mockPrinters);
      }
    } catch (error) {
      console.error('Failed to scan printers:', error);
      setPrinters(mockPrinters);
    }
    setIsScanning(false);
  };

  const handleStartPrint = async () => {
    if (!selectedPrinter) return;

    const printer = printers.find(p => p.id === selectedPrinter);
    if (!printer) return;

    try {
      const response = await fetch('/api/print/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          printerId: selectedPrinter,
          userId,
          settings: printSettings
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPrintJob({
          id: data.jobId,
          fileName: projectName,
          status: 'queued',
          progress: 0,
          estimatedTime: data.estimatedTime || 3600,
          elapsed: 0
        });
        
        // Start progress simulation
        simulatePrintProgress();
      } else {
        alert('Failed to start print job');
      }
    } catch (error) {
      console.error('Print start failed:', error);
      alert('Failed to start print job');
    }
  };

  const simulatePrintProgress = () => {
    const interval = setInterval(() => {
      setPrintJob(prev => {
        if (!prev) return null;
        
        const newProgress = Math.min(prev.progress + Math.random() * 5, 100);
        const newElapsed = prev.elapsed + 30;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          return {
            ...prev,
            status: 'completed',
            progress: 100,
            elapsed: newElapsed
          };
        }
        
        return {
          ...prev,
          status: 'printing',
          progress: newProgress,
          elapsed: newElapsed
        };
      });
    }, 2000);
  };

  const getPrinterStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'printing': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Printer className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'usb': return <Usb className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'bluetooth': return <Wifi className="w-4 h-4" />;
      default: return <Printer className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="print-dialog-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="print-dialog-container"
      >
        <div className="print-dialog-header">
          <h2>3D Print: {projectName}</h2>
          <button onClick={onClose} className="close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="print-dialog-content">
          {printJob ? (
            // Print Progress View
            <div className="print-progress">
              <div className="progress-header">
                <h3>Print Job Status</h3>
                <div className="status-badge">
                  {printJob.status === 'printing' && <Clock className="w-4 h-4" />}
                  {printJob.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  {printJob.status === 'failed' && <AlertCircle className="w-4 h-4" />}
                  <span>{printJob.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="progress-details">
                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${printJob.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{Math.round(printJob.progress)}%</span>
                </div>

                <div className="time-info">
                  <div className="time-stat">
                    <Timer className="w-4 h-4" />
                    <span>Elapsed: {formatTime(printJob.elapsed)}</span>
                  </div>
                  <div className="time-stat">
                    <Clock className="w-4 h-4" />
                    <span>Remaining: {formatTime(printJob.estimatedTime - printJob.elapsed)}</span>
                  </div>
                </div>
              </div>

              {printJob.status === 'completed' && (
                <div className="completion-message">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <h4>Print Completed Successfully!</h4>
                  <p>Your {projectName} has finished printing.</p>
                </div>
              )}
            </div>
          ) : (
            // Printer Selection View
            <>
              <div className="printer-section">
                <div className="section-header">
                  <h3>Select 3D Printer</h3>
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />}
                    onClick={handleScanPrinters}
                    disabled={isScanning}
                  >
                    {isScanning ? 'Scanning...' : 'Refresh'}
                  </ModernButton>
                </div>

                <div className="printers-list">
                  {printers.map((printer) => (
                    <div
                      key={printer.id}
                      className={`printer-card ${selectedPrinter === printer.id ? 'selected' : ''} ${printer.status !== 'online' ? 'disabled' : ''}`}
                      onClick={() => printer.status === 'online' && setSelectedPrinter(printer.id)}
                    >
                      <div className="printer-header">
                        <div className="printer-info">
                          {getConnectionIcon(printer.type)}
                          <span className="printer-name">{printer.name}</span>
                        </div>
                        <div className="printer-status">
                          {getPrinterStatusIcon(printer.status)}
                          <span className="status-text">{printer.status}</span>
                        </div>
                      </div>
                      
                      <div className="printer-details">
                        <p className="connection-info">{printer.connection}</p>
                        {printer.model && <p className="model-info">{printer.model}</p>}
                        {printer.temperature && (
                          <div className="temperature-info">
                            <span><Thermometer className="w-3 h-3" /> E: {printer.temperature.extruder}°C</span>
                            <span><Layers className="w-3 h-3" /> B: {printer.temperature.bed}°C</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {printers.length === 0 && !isScanning && (
                    <div className="no-printers">
                      <Printer className="w-12 h-12 text-gray-400" />
                      <p>No printers found</p>
                      <ModernButton
                        variant="secondary"
                        size="sm"
                        onClick={handleScanPrinters}
                      >
                        Scan for Printers
                      </ModernButton>
                    </div>
                  )}
                </div>
              </div>

              <div className="print-settings">
                <h3>Print Settings</h3>
                <div className="settings-grid">
                  <div className="setting-item">
                    <label>Print Quality</label>
                    <select
                      value={printSettings.quality}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, quality: e.target.value }))}
                    >
                      <option value="draft">Draft (0.3mm)</option>
                      <option value="medium">Medium (0.2mm)</option>
                      <option value="fine">Fine (0.1mm)</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <label>Infill Density</label>
                    <select
                      value={printSettings.infill}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, infill: parseInt(e.target.value) }))}
                    >
                      <option value={10}>10% (Fast)</option>
                      <option value={20}>20% (Standard)</option>
                      <option value={50}>50% (Strong)</option>
                      <option value={100}>100% (Solid)</option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <label>Material</label>
                    <select
                      value={printSettings.material}
                      onChange={(e) => setPrintSettings(prev => ({ ...prev, material: e.target.value }))}
                    >
                      <option value="PLA">PLA (Easy)</option>
                      <option value="ABS">ABS (Strong)</option>
                      <option value="PETG">PETG (Chemical Resistant)</option>
                      <option value="TPU">TPU (Flexible)</option>
                    </select>
                  </div>

                  <div className="setting-item checkbox-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={printSettings.supports}
                        onChange={(e) => setPrintSettings(prev => ({ ...prev, supports: e.target.checked }))}
                      />
                      Generate Supports
                    </label>
                  </div>

                  <div className="setting-item checkbox-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={printSettings.rafts}
                        onChange={(e) => setPrintSettings(prev => ({ ...prev, rafts: e.target.checked }))}
                      />
                      Build Plate Adhesion
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="print-dialog-actions">
          {printJob ? (
            <>
              <ModernButton variant="secondary" onClick={onClose}>
                Close
              </ModernButton>
              {printJob.status === 'completed' && (
                <ModernButton variant="primary" onClick={() => setPrintJob(null)}>
                  Print Another
                </ModernButton>
              )}
            </>
          ) : (
            <>
              <ModernButton variant="secondary" onClick={onClose}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                icon={<Play className="w-4 h-4" />}
                onClick={handleStartPrint}
                disabled={!selectedPrinter}
              >
                Start Print
              </ModernButton>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PrintDialog;
