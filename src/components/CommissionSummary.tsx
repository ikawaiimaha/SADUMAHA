import { useMockupText } from '../i18n/useMockupText';
import React from 'react';
import { COMMISSION } from '../data/commissionScenario';
import type { BilateralContract } from '../types/contractStage6';

export const panel = 'rounded-lg border border-[#D9CEBA] bg-white p-5 shadow-sm text-start';
export const actionButton = 'rounded-md bg-[#8B261E] ps-5 pe-5 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E]';

export function CommissionSummary({ isAr, showTechnical = true, legalName }: { isAr: boolean; showTechnical?: boolean; legalName?:string }) {
  return <div className="space-y-2 text-start">
    <p className="font-semibold">{legalName ?? (isAr ? COMMISSION.artistNameAr : COMMISSION.artistName)}</p>
    {showTechnical && <p>{isAr ? COMMISSION.titleAr : COMMISSION.title} · <bdi>{COMMISSION.weightKg}</bdi> {isAr ? 'كغ' : 'kg'}</p>}

  </div>;
}

export function AgreementMilestones({ contract, isAr }: { contract: BilateralContract; isAr: boolean }) {
  const tr = useMockupText(isAr);
  const t = contract.tranches;
  const rows = [
    [isAr ? 'مقدّم' : 'Advance', t.advancePercentage, t.advanceAmount],
    [isAr ? 'التسليم' : 'Delivery', t.deliveryPercentage, t.deliveryAmount],
    [isAr ? 'الإكمال والإعادة' : 'Completion & Return', t.installationPercentage, t.installationAmount],
  ];
  return <section className={panel} aria-label={isAr ? 'جدول الاتفاقية' : 'Agreement schedule'}>
    <p className="mb-3 text-base">{isAr ? 'الثيمة المنشورة عند إعداد الاتفاقية:' : 'Published theme when drafted:'} <bdi>{contract.themeArabic ?? (isAr ? 'لم تُنشر بعد' : 'Not published yet')}</bdi></p>
    <h2 className="font-serif text-xl font-bold mb-3">{isAr ? 'اتفاقية المنسق — جدول الدفعات' : 'Coordinator agreement — payment schedule'}</h2>
    <p className="text-sm mb-3">{isAr ? 'الإجمالي' : 'Total'}: <bdi>{contract.productionCost.toLocaleString(isAr ? 'ar-AE' : 'en-AE')} {isAr ? 'درهم' : 'AED'}</bdi></p>
    <div className="overflow-x-auto"><table className="w-full text-sm text-start">
      <thead><tr>{(isAr ? ['المرحلة', 'النسبة', 'المبلغ (درهم)'] : ['Milestone', 'Percentage', 'Amount (AED)']).map(h => <th key={h} scope="col" className="text-start py-2 pe-4">{h}</th>)}</tr></thead>
      <tbody>{rows.filter(([,percent])=>Number(percent)>0).map(([name, percent, amount]) => <tr key={name} className="border-t border-[#D9CEBA]">
        <th scope="row" className="text-start py-3 pe-4">{name}</th><td className="pe-4"><bdi>{percent}%</bdi></td><td><bdi>{Number(amount).toLocaleString(isAr ? 'ar-AE' : 'en-AE')}</bdi></td>
      </tr>)}</tbody>
    </table></div>
    <p className="mt-3 text-sm">{isAr ? 'شروط الشحن' : 'Shipping terms'}: {tr(contract.shippingTerms)}</p>
    {contract.venue && <p className="mt-2 text-sm">{isAr ? 'موقع العرض ومرجع الموافقة' : 'Venue and clearance'}: {contract.venue} · {contract.venueClearanceReference || (isAr ? 'موقع تابع للدائرة' : 'Department venue')}</p>}
    {contract.specialConditions && <p className="mt-2 text-sm">{isAr ? 'الشروط الخاصة' : 'Special conditions'}: {contract.specialConditions}</p>}
    <p className="mt-3 text-sm text-[#594F47]">{isAr
      ? 'قاعدة العرض: المقدّم بعد قبول الاتفاقية وتسجيل أدلة العلاقات العامة والفريق الفني. يتطلب التسليم الاستلام الفعلي؛ ويتطلب الإكمال إغلاق المعرض والإعادة الآمنة وتسوية الحالة.'
      : 'Demo rule: advance follows agreement acceptance and recorded PR and Technical evidence. Delivery requires physical receipt. Completion requires exhibition closure, safe return and condition reconciliation.'}</p>
  </section>;
}
