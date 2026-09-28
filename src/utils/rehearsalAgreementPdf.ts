import type { BilateralContract } from '../types/contractStage6';

/** Rasterized browser text preserves international names without substituting glyphs. */
export async function buildRehearsalAgreement(c:BilateralContract):Promise<Blob> {
  const {jsPDF}=await import('jspdf');
  await document.fonts.ready;
  const pdf=new jsPDF({compress:true});
  const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;
  const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');
  const rows=[
    'SADU — REHEARSAL AGREEMENT',
    'FICTIONAL / NON-BINDING / NO EXTERNAL DISPATCH',
    `Record: ${c.id}`,`Generated from terms sent: ${c.sentAt ?? 'Not recorded'}`,
    `Artist legal name: ${c.artistName}`,`Nationality: ${c.nationality}`,
    `Work: ${c.proposedWorkTitle}`,`Medium: ${c.medium}`,
    `Theme: ${c.themeArabic ?? 'Isolated rehearsal — unpublished'}`,
    `Scope: ${c.participationCategory ?? 'Not recorded'} / ${c.artworkCount ?? 'Not recorded'} work(s)`,
    `Production grant: AED ${c.productionCost}`,`Venue: ${c.venue ?? 'Not recorded'}`,
    `Venue clearance reference: ${c.venueClearanceReference || 'Not required / not recorded'}`,
    `Shipping: ${c.shippingTerms}`,`Shipping liability: ${c.shippingLiability ?? 'Not recorded'}`,
    `Crate: ${c.crate?.reference ?? 'Not recorded'} / ${c.crate?.lengthCm} x ${c.crate?.widthCm} x ${c.crate?.heightCm} cm / ${c.crate?.grossWeightKg} kg`,
    `Advance: ${c.tranches.advancePercentage}% / AED ${c.tranches.advanceAmount}`,
    `Delivery: ${c.tranches.deliveryPercentage}% / AED ${c.tranches.deliveryAmount}`,
    `Completion: ${c.tranches.installationPercentage}% / AED ${c.tranches.installationAmount}`,
    `Special conditions: ${c.specialConditions || 'None recorded'}`,
    'This document is a prototype terms summary, not a signed legal agreement.',
    'Identity confirmation does not authorize payment or substitute for passport verification.',
  ];
  let y=90;
  const reset=()=>{context.fillStyle='#F7F1E6';context.fillRect(0,0,1240,1754);context.fillStyle='#1A1817';context.font='26px sans-serif';};
  const flush=()=>{pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297);};
  reset();
  for(const row of rows){
    let line='';
    for(const character of row){
      if(context.measureText(line+character).width>1080){
        context.fillText(line,80,y);y+=40;line='';
        if(y>1630){flush();pdf.addPage();reset();y=90;}
      }
      line+=character;
    }
    context.fillText(line,80,y);y+=55;
    if(y>1630){flush();pdf.addPage();reset();y=90;}
  }
  flush();return pdf.output('blob');
}
