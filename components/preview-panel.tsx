'use client';

// ============================================================================
// ### IMPORTS ###
// ============================================================================

import { SplitPreviewLayout } from './preview/SplitPreviewLayout';

// ============================================================================
// ### TYPES ###
// ============================================================================

import type { FileMap } from '@/types/project';

interface PreviewPanelProps {
  deploymentUrl: string | null;
  files: FileMap;
  isDeploying: boolean;
  projectName: string;
  ideaText?: string;
  isStreaming?: boolean;
  isAppReady?: boolean;
}

// ============================================================================
// ### CUSTOM ###
// ============================================================================

export function PreviewPanel({
  deploymentUrl,
  files,
  isDeploying,
  projectName,
  ideaText = '',
  isStreaming = false,
  isAppReady = false,
}: PreviewPanelProps) {
  const handleRefresh = () => {
    // Force iframe reload
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenExternal = () => {
    if (deploymentUrl) {
      window.open(deploymentUrl, '_blank');
    }
  };

  // Determine container status
  const containerStatus = isDeploying
    ? 'building'
    : deploymentUrl
    ? 'running'
    : null;

  // Always use split layout (mobile handling is done at page level)
  return (
    <div className="flex flex-col h-full bg-midnight-950">
      <SplitPreviewLayout
        containerUrl={deploymentUrl}
        containerStatus={containerStatus}
        containerName={projectName}
        ideaText={ideaText}
        onRefresh={handleRefresh}
        onOpenExternal={handleOpenExternal}
        isStreaming={isStreaming}
        isAppReady={isAppReady}
        className="h-full"
      />
    </div>
  );
}

