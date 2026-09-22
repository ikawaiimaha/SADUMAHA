import React from 'react';
import { type RoleKey, type WorkspaceTab } from '../../types';
import { ROLE_PROFILES } from '../../data/mockData';
import { CommitteeView } from '../workspaces/CommitteeView';
import { CoordinatorView } from '../workspaces/CoordinatorView';
import { ArtistView } from '../workspaces/ArtistView';
import { ScopeContractsView } from '../workspaces/ScopeContractsView';
import { OperationsView } from '../workspaces/OperationsView';
import { CommunicationView } from '../workspaces/CommunicationView';
import { ArchiveView } from '../workspaces/ArchiveView';
import { DirectorateDashboard } from '../workspaces/DirectorateDashboard';
import { TechnicalMuseumDashboard } from '../workspaces/TechnicalMuseumDashboard';
import { PrProtocolDashboard } from '../workspaces/PrProtocolDashboard';
import { FinanceDashboard } from '../workspaces/FinanceDashboard';
import { LogisticsDashboard } from '../workspaces/LogisticsDashboard';
import { EditorialDashboard } from '../workspaces/EditorialDashboard';

export interface WorkspaceRouterProps {
  currentRole: RoleKey;
  activeTab: WorkspaceTab;
}

const ForbiddenView: React.FC = () => (
  <div className="m-8 flex min-h-64 items-center justify-center rounded-lg border-2 border-dashed border-sadu-gold/50 bg-sadu-sand p-8 font-mono text-sm text-sadu-muted">
    <div className="space-y-2 text-center"><span className="block text-lg font-bold text-sadu-brick">403 FORBIDDEN</span><span>Module not found or access denied for the current role.</span></div>
  </div>
);

function renderOverview(currentRole: RoleKey) {
  switch (currentRole) {
    case 'DIRECTORATE':
    case 'LEADERSHIP':
      return <DirectorateDashboard />;
    case 'COORDINATOR':
    case 'SDC_COORDINATOR':
      return <CoordinatorView />;
    case 'COMMITTEE':
      return <CommitteeView />;
    case 'ARTIST':
      return <ArtistView />;
    case 'TECHNICAL_MUSEUM':
    case 'TECHNICAL':
    case 'VENUE_ADMIN':
    case 'SAF_TECHNICIAN':
    case 'SMA_VENUE_ADMIN':
      return <TechnicalMuseumDashboard />;
    case 'PR_PROTOCOL':
    case 'PR_VISA':
      return <PrProtocolDashboard />;
    case 'EDITORIAL':
      return <EditorialDashboard />;
    case 'FINANCE':
      return <FinanceDashboard />;
    case 'LOGISTICS':
      return <LogisticsDashboard />;
    case 'ARCHIVE':
      return <ArchiveView />;
    default:
      return <ForbiddenView />;
  }
}

export const WorkspaceRouter: React.FC<WorkspaceRouterProps> = ({ currentRole, activeTab }) => {
  const permittedViews = ROLE_PROFILES[currentRole]?.permittedViews ?? [];
  if (!permittedViews.includes(activeTab)) return <ForbiddenView />;

  if (activeTab === 'overview') return renderOverview(currentRole);
  if (activeTab === 'dossiers') return <CommitteeView />;
  if (activeTab === 'approved-scope') return <ScopeContractsView />;
  if (activeTab === 'contracts') return currentRole === 'FINANCE' ? <FinanceDashboard /> : <ScopeContractsView />;
  if (activeTab === 'operations') {
    switch (currentRole) {
      case 'TECHNICAL_MUSEUM':
      case 'TECHNICAL':
      case 'SAF_TECHNICIAN':
        return <OperationsView initialSubTab="technical" />;
      case 'VENUE_ADMIN':
      case 'SMA_VENUE_ADMIN':
        return <TechnicalMuseumDashboard />;
      case 'PR_PROTOCOL':
      case 'PR_VISA':
        return <PrProtocolDashboard />;
      case 'EDITORIAL':
        return <EditorialDashboard />;
      case 'FINANCE':
        return <FinanceDashboard />;
      case 'LOGISTICS':
        return <LogisticsDashboard />;
      default:
        return <OperationsView />;
    }
  }
  if (activeTab === 'communications') return currentRole === 'LOGISTICS' ? <LogisticsDashboard /> : <CommunicationView />;
  if (activeTab === 'archive') return <ArchiveView />;
  return <ForbiddenView />;
};
