export const PHYSICAL_STATUSES = Object.freeze(['Pending_Shipment', 'In_Transit', 'Customs_Clearance', 'On_Site_Sharjah', 'Installed']);
export const PHYSICAL_TRANSITIONS = Object.freeze({
  Pending_Shipment: Object.freeze(['In_Transit', 'On_Site_Sharjah']),
  In_Transit: Object.freeze(['Customs_Clearance', 'On_Site_Sharjah']),
  Customs_Clearance: Object.freeze(['On_Site_Sharjah']),
  On_Site_Sharjah: Object.freeze(['Installed']),
  Installed: Object.freeze([]),
});
