export type SpatialModification = 'FLOOR_TREATMENT' | 'LIGHTING_RIG' | 'WALL_PAINT';
export interface SpatialTicket {
  status:'PENDING_CURATOR_REVIEW'|'REJECTED_ASSET_RISK'|'APPROVED_ALTERNATIVE';
  modificationType:SpatialModification;
  material:'Vinyl'|'Carpet';
  history:{status:SpatialTicket['status'];material:SpatialTicket['material'];at:string}[];
  workOrder?:{reference:string;at:string};
}
export const initialSpatialTicket:SpatialTicket={status:'PENDING_CURATOR_REVIEW',modificationType:'FLOOR_TREATMENT',material:'Vinyl',history:[]};
export function transitionSpatialTicket(state:SpatialTicket,action:{type:'modify';value:SpatialModification}|{type:'reject'|'approve-alternative';at:string}):SpatialTicket {
 if(action.type==='modify')return state.status==='PENDING_CURATOR_REVIEW'&&['FLOOR_TREATMENT','LIGHTING_RIG','WALL_PAINT'].includes(action.value)?{...state,modificationType:action.value}:state;
 if(!Number.isFinite(Date.parse(action.at)))return state;
 if(action.type==='reject'&&state.status==='PENDING_CURATOR_REVIEW')return {...state,status:'REJECTED_ASSET_RISK',history:[...state.history,{status:'REJECTED_ASSET_RISK',material:'Vinyl',at:action.at}]};
 if(action.type==='approve-alternative'&&state.status==='REJECTED_ASSET_RISK')return {...state,status:'APPROVED_ALTERNATIVE',material:'Carpet',history:[...state.history,{status:'APPROVED_ALTERNATIVE',material:'Carpet',at:action.at}],workOrder:{reference:'DEMO-WO-FATMI-001',at:action.at}};
 return state;
}
