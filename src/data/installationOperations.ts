export interface CrateSpec { reference: string; lengthCm: number; widthCm: number; heightCm: number; grossWeightKg: number }
export const validCrate = (crate?: CrateSpec): crate is CrateSpec => Boolean(crate?.reference.trim() && [crate.lengthCm,crate.widthCm,crate.heightCm,crate.grossWeightKg].every(n=>Number.isFinite(n)&&n>0));
export const vehicleTypes = ['3-Ton Hydraulic Pickup','Climate-Controlled Fine Art Van','Standard Transit'] as const;
export interface FleetTicket { appliesToRevision?: number; isSuperseded?: boolean; id: string; contractId: string; artistId: string; crate: CrateSpec; vehicle: string; status:'PENDING_FLEET_ASSIGNMENT'|'IN_TRANSIT'; requestedAt:string; transitAt?:string }
export interface ExecutiveImpound { id:string; artistId:string; directives:string; issuedAt:string; acknowledgedAt?:string }

export interface DockInspection { lengthCm:number; widthCm:number; heightCm:number; grossWeightKg:number; seal:'MATCH'|'TAMPERED'; condition:'INTACT'|'MINOR_DAMAGE'|'SEVERE_DAMAGE' }
export const validDockInspection=(v?:DockInspection):v is DockInspection=>Boolean(v&&[v.lengthCm,v.widthCm,v.heightCm,v.grossWeightKg].every(n=>Number.isFinite(n)&&n>0&&n<=100000)&&['MATCH','TAMPERED'].includes(v.seal)&&['INTACT','MINOR_DAMAGE','SEVERE_DAMAGE'].includes(v.condition));
