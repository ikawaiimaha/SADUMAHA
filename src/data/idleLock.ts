export const IDLE_WARNING_MS=9*60*1000;
export const IDLE_LOCK_MS=10*60*1000;
export type IdlePhase='active'|'warning'|'locked';
export function idlePhase(lastActivity:number,now:number,alreadyLocked=false):IdlePhase {
 if(alreadyLocked||now-lastActivity>=IDLE_LOCK_MS)return 'locked';
 return now-lastActivity>=IDLE_WARNING_MS?'warning':'active';
}
