import React, { useState, useEffect, useContext, useRef } from 'react';
import { Card, Button, Input, Select, Space, Typography, Row, Col, Alert, Spin, Modal } from 'antd';
import { StopOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useProjectContext } from '../contexts/ProjectContext';
import { OllamaService } from '../services/OllamaService';
import { StorageService } from '../storage/StorageService';
import './OllamaPage.scss';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Interface for component state
interface OllamaPageState {
  // System information
  systemVersion: string;
  ollamaVersion: string | null;
  isOllamaInstalled: boolean;
  
  // Installation configuration
  installPath: string;
  modelPath: string;
  selectedEmbeddingModel: string;
  customEmbeddingModel: string;
  
  // Installation status
  isInstalling: boolean;
  installationOutput: string[];
  
  // UI state
  loading: boolean;
  error: string | null;
}

// Predefined embedding models
const EMBEDDING_MODELS = [
  { value: 'all-minilm', label: 'all-minilm' },
  { value: 'aroxima/gte-qwen2-1.5b-instruct', label: 'aroxima/gte-qwen2-1.5b-instruct' },
  { value: 'dengcao/Qwen3-Embedding-0.6B', label: 'dengcao/Qwen3-Embedding-0.6B' },
  { value: 'custom', label: 'Custom Model' }
];

// Default installation paths
const DEFAULT_PATHS = {
  windows: {
    install: 'C:\\Program Files\\Ollama',
    model: 'C:\\Users\\%USERNAME%\\.ollama\\models'
  },
  mac: {
    install: '/usr/local/bin/ollama',
    model: '~/.ollama/models'
  },
  linux: {
    install: '/usr/local/bin/ollama',
    model: '~/.ollama/models'
  }
};

const OllamaPage: React.FC = () => {
  const { t } = useTranslation(['pages', 'common']);
  const { projectInfo } = useProjectContext();
  
  const [state, setState] = useState<OllamaPageState>({
    systemVersion: '',
    ollamaVersion: null,
    isOllamaInstalled: false,
    installPath: '',
    modelPath: '',
    selectedEmbeddingModel: 'all-minilm',
    customEmbeddingModel: '',
    isInstalling: false,
    installationOutput: [],
    loading: true,
    error: null
  });

  // Refs for managing polling and console output
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const outputConsoleRef = useRef<HTMLDivElement>(null);

  // Initialize page data
  useEffect(() => {
    initializePageData();
  }, []);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      clearPollingTimers();
    };
  }, []);

  // Auto scroll to bottom when installation output updates
  useEffect(() => {
    if (outputConsoleRef.current && state.installationOutput.length > 0) {
      outputConsoleRef.current.scrollTop = outputConsoleRef.current.scrollHeight;
    }
  }, [state.installationOutput]);

  // Initialize system information and default paths
  const initializePageData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get system version from project context
      const systemVersion = projectInfo?.systemVersion || 'Unknown';
      
      // Check if Ollama is installed and get version
      const versionResponse = await OllamaService.getInstance().getOllamaVersion();
      const isInstalled = versionResponse.status !== 'not_installed';
      const version = versionResponse.version || null;
      
      // Try to load saved Ollama configuration first
      const savedConfig = await StorageService.getInstance().getOllamaConfig();
      
      // Set paths: use saved config if available, otherwise use platform defaults
      const platform = getPlatform();
      const defaultInstallPath = DEFAULT_PATHS[platform]?.install || DEFAULT_PATHS.windows.install;
      const defaultModelPath = DEFAULT_PATHS[platform]?.model || DEFAULT_PATHS.windows.model;
      
      const installPath = savedConfig?.installPath || defaultInstallPath;
      const modelPath = savedConfig?.modelPath || defaultModelPath;
      
      setState(prev => ({
        ...prev,
        systemVersion,
        ollamaVersion: version,
        isOllamaInstalled: isInstalled,
        installPath,
        modelPath,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to initialize page data:', error);
      setState(prev => ({
        ...prev,
        error: t('ollama.error.initializationFailed') as string,
        loading: false
      }));
    }
  };

  // Get current platform
  const getPlatform = (): 'windows' | 'mac' | 'linux' => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'mac';
    return 'linux';
  };


  // Handle installation
  const handleInstall = async () => {
    try {
      setState(prev => ({ ...prev, isInstalling: true, error: null, installationOutput: [] }));
      
      // Save Ollama configuration before installation
      await StorageService.getInstance().setOllamaConfig({
        installPath: state.installPath,
        modelPath: state.modelPath
      });
      
      const embeddingModel = state.selectedEmbeddingModel === 'custom' 
        ? state.customEmbeddingModel 
        : state.selectedEmbeddingModel;
      
      const response = await OllamaService.getInstance().installOllama({
        installPath: state.installPath,
        modelPath: state.modelPath,
        embeddingModel
      });
      
      // Start polling installation status
      pollInstallationStatus(response.requestId);
      
    } catch (error) {
      console.error('Installation failed:', error);
      setState(prev => ({
        ...prev,
        error: t('ollama.error.installationFailed') as string,
        isInstalling: false
      }));
    }
  };

  // Clear polling timers
  const clearPollingTimers = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  // Poll installation status
  const pollInstallationStatus = async (requestId: string) => {
    // Clear any existing timers
    clearPollingTimers();
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await OllamaService.getInstance().getInstallStatus(requestId);
        
        // Update installation output
        if (statusResponse.output) {
          const outputLines = statusResponse.output.split('\n').filter(line => line.trim());
          setState(prev => ({ 
            ...prev, 
            installationOutput: outputLines 
          }));
        }
        
        // Check if installation is complete
        if (statusResponse.status === 0) {
          clearPollingTimers();
          
          // Check final installation status
          await initializePageData();
          setState(prev => ({ ...prev, isInstalling: false }));
          
        } else if (statusResponse.status === 2) {
          clearPollingTimers();
          setState(prev => ({
            ...prev,
            error: t('ollama.error.installationFailed') as string,
            isInstalling: false
          }));
        }
        
      } catch (error) {
        console.error('Failed to get installation status:', error);
        clearPollingTimers();
        setState(prev => ({
          ...prev,
          error: t('ollama.error.statusCheckFailed') as string,
          isInstalling: false
        }));
      }
    }, 2000); // Poll every 2 seconds
    
    // Set timeout to prevent infinite polling
    pollTimeoutRef.current = setTimeout(() => {
      clearPollingTimers();
      setState(prev => {
        if (prev.isInstalling) {
          return {
            ...prev,
            error: t('ollama.error.installationTimeout') as string,
            isInstalling: false
          };
        }
        return prev;
      });
    }, 7200000); // 2 hours timeout
  };

  // Handle stop installation
  const handleStopInstall = () => {
    Modal.confirm({
      title: t('ollama.install.confirmStop'),
      content: t('ollama.install.confirmStopMessage'),
      okText: t('common.confirm', { ns: 'common' }),
      cancelText: t('common.cancel', { ns: 'common' }),
      okType: 'danger',
      onOk: async () => {
        try {
          // Stop the installation using OllamaService
          const requestId = OllamaService.getInstance().getCurrentRequestId();
          if (requestId) {
            await OllamaService.getInstance().stopInstallation(requestId);
          }
          
          clearPollingTimers();
          setState(prev => ({ ...prev, isInstalling: false }));
        } catch (error) {
          console.error('Failed to stop installation:', error);
          // Still clear timers and update state even if stop fails
          clearPollingTimers();
          setState(prev => ({ 
            ...prev, 
            isInstalling: false,
            error: t('ollama.error.stopInstallationFailed') as string
          }));
        }
      }
    });
  };

  // Handle embedding model change
  const handleEmbeddingModelChange = (value: string) => {
    setState(prev => ({ ...prev, selectedEmbeddingModel: value }));
  };

  if (state.loading) {
    return (
      <div className="ollama-page-loading">
        <Spin size="large" />
        <Text>{t('common.loading', { ns: 'common' })}</Text>
      </div>
    );
  }

  return (
    <div className="ollama-page">
      <div className="ollama-page-header">
        <Title level={2}>{t('ollama.title')}</Title>
        <Paragraph>{t('ollama.description')}</Paragraph>
      </div>

      {state.error && (
        <Alert
          message={t('common.error', { ns: 'common' })}
          description={state.error}
          type="error"
          closable
          onClose={() => setState(prev => ({ ...prev, error: null }))}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* System Information Card */}
        <Col xs={24} lg={12}>
          <Card title={t('ollama.systemInfo.title')} className="system-info-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="info-item">
                <Text strong>{t('ollama.systemInfo.systemVersion')}: </Text>
                <Text>{state.systemVersion}</Text>
              </div>
              <div className="info-item">
                <Text strong>{t('ollama.systemInfo.ollamaStatus')}: </Text>
                {state.isOllamaInstalled ? (
                  <Text type="success">
                    {t('ollama.systemInfo.installed')} (v{state.ollamaVersion})
                  </Text>
                ) : (
                  <Text type="warning">{t('ollama.systemInfo.notInstalled')}</Text>
                )}
              </div>
            </Space>
          </Card>
        </Col>

        {/* Installation Configuration Card */}
        <Col xs={24} lg={12}>
          <Card title={t('ollama.config.title')} className="config-card">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Install Path - Only editable on Windows */}
              <div className="path-config">
                <Text strong>{t('ollama.config.installPath')}</Text>
                {getPlatform() === 'windows' ? (
                  <Input
                    id="install-path-input"
                    value={state.installPath}
                    onChange={(e) => setState(prev => ({ ...prev, installPath: e.target.value }))}
                    placeholder={t('ollama.config.installPathPlaceholder')}
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <Input
                    id="install-path-input"
                    value={state.installPath}
                    disabled
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              {/* Model Path - Only editable on Windows */}
              <div className="path-config">
                <Text strong>{t('ollama.config.modelPath')}</Text>
                {getPlatform() === 'windows' ? (
                  <Input
                    id="model-path-input"
                    value={state.modelPath}
                    onChange={(e) => setState(prev => ({ ...prev, modelPath: e.target.value }))}
                    placeholder={t('ollama.config.modelPathPlaceholder')}
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <Input
                    id="model-path-input"
                    value={state.modelPath}
                    disabled
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              {/* Embedding Model */}
              <div className="model-config">
                <Text strong>{t('ollama.config.embeddingModel')}</Text>
                <Select
                  value={state.selectedEmbeddingModel}
                  onChange={handleEmbeddingModelChange}
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder={t('ollama.config.selectEmbeddingModel')}
                >
                  {EMBEDDING_MODELS.map(model => (
                    <Option key={model.value} value={model.value}>
                      {model.label}
                    </Option>
                  ))}
                </Select>
                {state.selectedEmbeddingModel === 'custom' && (
                  <Input
                    value={state.customEmbeddingModel}
                    onChange={(e) => setState(prev => ({ ...prev, customEmbeddingModel: e.target.value }))}
                    placeholder={t('ollama.config.customModelPlaceholder')}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              {/* Installation Buttons */}
              <div className="install-buttons">
                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    loading={state.isInstalling}
                    disabled={state.isOllamaInstalled || state.isInstalling}
                    onClick={handleInstall}
                  >
                    {state.isInstalling 
                      ? t('ollama.install.installing') 
                      : state.isOllamaInstalled 
                        ? t('ollama.install.installed')
                        : t('ollama.install.start')
                    }
                  </Button>
                  {state.isInstalling && (
                    <Button
                      danger
                      size="large"
                      icon={<StopOutlined />}
                      onClick={handleStopInstall}
                    >
                      {t('ollama.install.stop')}
                    </Button>
                  )}
                </Space>
              </div>

              {/* Installation Output */}
              {state.isInstalling && state.installationOutput.length > 0 && (
                <div className="installation-output">
                  <Text strong>{t('ollama.install.output')}</Text>
                  <div className="output-console" ref={outputConsoleRef}>
                    {state.installationOutput.map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OllamaPage;