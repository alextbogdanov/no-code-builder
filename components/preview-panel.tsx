'use client';

// ============================================================================
// ### IMPORTS ###
// ============================================================================

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Code,
  Eye,
  Loader2,
  Globe,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// ============================================================================
// ### TYPES ###
// ============================================================================

import type { FileMap } from '@/types/project';

interface PreviewPanelProps {
  deploymentUrl: string | null;
  files: FileMap;
  isDeploying: boolean;
  projectName: string;
}

type ViewMode = 'preview' | 'code';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

// ============================================================================
// ### CONSTANTS ###
// ============================================================================

const DEVICE_WIDTHS: Record<DeviceType, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

// ============================================================================
// ### CUSTOM ###
// ============================================================================

export function PreviewPanel({
  deploymentUrl,
  files,
  isDeploying,
  projectName,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fileList = Object.keys(files);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force iframe reload
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExportZip = async () => {
    const zip = new JSZip();

    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`);
  };

  const handleOpenExternal = () => {
    if (deploymentUrl) {
      window.open(deploymentUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-midnight-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-midnight-700 bg-midnight-950">
        <div className="flex items-center justify-between">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-midnight-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                transition-all duration-200
                ${viewMode === 'preview'
                  ? 'bg-aurora-cyan/20 text-aurora-cyan'
                  : 'text-midnight-400 hover:text-white'
                }
              `}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                transition-all duration-200
                ${viewMode === 'code'
                  ? 'bg-aurora-cyan/20 text-aurora-cyan'
                  : 'text-midnight-400 hover:text-white'
                }
              `}
            >
              <Code className="w-4 h-4" />
              Code
            </button>
          </div>

          {/* Device switcher (only in preview mode) */}
          {viewMode === 'preview' && (
            <div className="flex items-center gap-1 bg-midnight-800 rounded-lg p-1">
              {[
                { type: 'desktop' as DeviceType, icon: Monitor },
                { type: 'tablet' as DeviceType, icon: Tablet },
                { type: 'mobile' as DeviceType, icon: Smartphone },
              ].map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setDevice(type)}
                  className={`
                    p-2 rounded-md transition-all duration-200
                    ${device === type
                      ? 'bg-aurora-purple/20 text-aurora-purple'
                      : 'text-midnight-400 hover:text-white'
                    }
                  `}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {viewMode === 'preview' && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={!deploymentUrl || isRefreshing}
                  className="
                    p-2 rounded-lg bg-midnight-800 text-midnight-400
                    hover:text-white transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Refresh preview"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
                <button
                  onClick={handleOpenExternal}
                  disabled={!deploymentUrl}
                  className="
                    p-2 rounded-lg bg-midnight-800 text-midnight-400
                    hover:text-white transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleExportZip}
              disabled={fileList.length === 0}
              className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                bg-aurora-cyan/10 text-aurora-cyan text-sm font-medium
                hover:bg-aurora-cyan/20 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* URL bar */}
        {viewMode === 'preview' && deploymentUrl && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-midnight-800 rounded-lg">
            <Globe className="w-4 h-4 text-midnight-500" />
            <span className="text-sm text-midnight-300 font-mono truncate flex-1">
              {deploymentUrl}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'preview' ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center bg-[#1a1a2e] p-4"
            >
              {isDeploying ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-aurora-cyan/20 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-aurora-cyan animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-aurora-cyan/30 animate-ping" />
                  </div>
                  <div>
                    <h3 className="text-white font-display text-lg">Deploying...</h3>
                    <p className="text-midnight-400 text-sm mt-1">
                      Your preview will appear shortly
                    </p>
                  </div>
                </div>
              ) : deploymentUrl ? (
                <div
                  className="h-full bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
                  style={{ width: DEVICE_WIDTHS[device] }}
                >
                  <iframe
                    src={deploymentUrl}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                  <div className="w-20 h-20 rounded-full bg-midnight-800 flex items-center justify-center">
                    <Monitor className="w-10 h-10 text-midnight-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-display text-lg">No Preview Yet</h3>
                    <p className="text-midnight-400 text-sm mt-2">
                      Send a message in the chat to generate your first version.
                      Your live preview will appear here.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex"
            >
              {/* File list */}
              <div className="w-48 flex-shrink-0 bg-midnight-950 border-r border-midnight-700 overflow-y-auto">
                <div className="p-2">
                  <h3 className="text-midnight-500 text-xs uppercase tracking-wider px-2 py-2">
                    Files
                  </h3>
                  {fileList.length === 0 ? (
                    <p className="text-midnight-500 text-sm px-2 py-4">
                      No files yet
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {fileList.map((file) => (
                        <button
                          key={file}
                          onClick={() => setSelectedFile(file)}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm
                            transition-all duration-200 truncate
                            ${selectedFile === file
                              ? 'bg-aurora-cyan/20 text-aurora-cyan'
                              : 'text-midnight-300 hover:bg-midnight-800'
                            }
                          `}
                        >
                          {file}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Code viewer */}
              <div className="flex-1 overflow-auto p-4">
                {selectedFile && files[selectedFile] ? (
                  <pre className="text-sm font-mono text-midnight-200 whitespace-pre-wrap break-words">
                    <code>{files[selectedFile]}</code>
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-midnight-500 text-sm">
                      {fileList.length > 0
                        ? 'Select a file to view its contents'
                        : 'No files generated yet'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

