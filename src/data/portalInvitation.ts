import type { BilateralContract } from '../types/contractStage6';

/** Rehearsal record, not a bearer token, email receipt or authenticated identity. */
export interface PortalInvitation {
  id: string;
  artistId: string;
  status: 'INVITATION_DISPATCHED' | 'IDENTITY_CONFIRMED';
  originalName: string;
  dispatchedAt: string;
  draft: BilateralContract;
  legalName?: string;
  confirmedAt?: string;
}
export type InvitationAction =
  | {type:'dispatch-invitation';actor:string;pipelineReady:boolean;id:string;at:string;contract:BilateralContract}
  | {type:'confirm-identity';actor:string;pipelineReady:boolean;invitationId:string;legalName:string;at:string};

export function validLegalName(value:string):boolean {
  // Preserve international names and mononyms; do not guess first/family-name boundaries.
  return value.trim().length > 0 && value.trim().length <= 150 && /\p{L}/u.test(value)
    && !/[\p{Cc}\p{Cf}<>]/u.test(value);
}
