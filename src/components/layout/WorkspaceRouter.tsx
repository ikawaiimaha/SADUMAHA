import React from 'react';
import { type RoleKey, type WorkspaceTab } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';

import { LeadershipView } from '../workspaces/LeadershipView';
import { CoordinatorView } from '../workspaces/CoordinatorView';
import { CommitteeView } from '../workspaces/CommitteeView';
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

export const WorkspaceRouter: React.FC<WorkspaceRouterProps> = ({ currentRole, activeTab }) => {
  const workspace = useWorkspace();

  const primaryView = (() => {
    switch (currentRole) {
      case 'COORDINATOR':
        return <CoordinatorView />;
      case 'DIRECTORATE':
      case 'LEADERSHIP':
        return <DirectorateDashboard />;
      case 'COMMITTEE':
        return <CommitteeView />;
      case 'TECHNICAL_MUSEUM':
      case 'TECHNICAL':
      case 'VENUE_ADMIN':
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
      case 'ARTIST':
        return <ArtistView />;
      case 'ARCHIVE':
        return <ArchiveView />;
      default:
        return <CoordinatorView />;
    }
  })();

  if (activeTab === 'dossiers') return <CommitteeView />;
  if (activeTab === 'approved-scope') return <ScopeContractsView />;
  if (activeTab === 'contracts') return currentRole === 'FINANCE' ? <FinanceDashboard /> : <ScopeContractsView />;
  if (activeTab === 'operations') {
    switch (currentRole) {
      case 'TECHNICAL_MUSEUM':
      case 'TECHNICAL':
        return <OperationsView initialSubTab="technical" />;
      case 'VENUE_ADMIN':
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

  return primaryView;
};
