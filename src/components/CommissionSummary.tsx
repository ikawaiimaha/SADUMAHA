import React from 'react';
import { COMMISSION } from '../data/commissionScenario';
import type { BilateralContract } from '../types/contractStage6';

export const panel = 'rounded-lg border border-[#D9CEBA] bg-white p-5 shadow-sm text-start';
export const actionButton = 'rounded-md bg-[#8B4513] ps-5 pe-5 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4513]';

export function CommissionSummary({ isAr, showTechnical = true }: { isAr: boolean; showTechnical?: boolean }) {
  return <div className="space-y-2 text-start">
    <p className="font-semibold">{isAr ? COMMISSION.artistNameAr : COMMISSION.artistName}</p>
    {showTechnical && <p>{isAr ? COMMISSION.titleAr : COMMISSION.title} · <bdi>{COMMISSION.weightKg}</bdi> {isAr ? 'كغ' : 'kg'}</p>}
    <p className="text-sm text-[#594F47]">{isAr
      ? 'سيناريو خيالي محلي. لا مستندات حقيقية أو اعتماد مؤسسي أو تحويل مالي. تُفقد التغييرات عند تحديث الصفحة.'
      : 'Local fictional scenario. No real documents, institutional approval or money transfer. Refresh resets the demo.'}</p>
  </div>;
}

export function AgreementMilestones({ contract, isAr }: { contract: BilateralContract; isAr: boolean }) {
  const t = contract.tranches;
  const rows = [
    [isAr ? 'مقدّم' : 'Advance', t.advancePercentage, t.advanceAmount],
    [isAr ? 'التسليم' : 'Delivery', t.deliveryPercentage, t.deliveryAmount],
    [isAr ? 'بعد الافتتاح' : 'Post-Opening', t.installationPercentage, t.installationAmount],
  ];
  return <section className={panel} aria-label={isAr ? 'جدول الاتفاقية' : 'Agreement schedule'}>
    <h2 className="font-serif text-xl font-bold mb-3">{isAr ? 'اتفاقية المنسق — ثلاث دفعات' : 'Coordinator agreement — three tranches'}</h2>
    <p className="text-sm mb-3">{isAr ? 'الإجمالي' : 'Total'}: <bdi>{contract.productionCost.toLocaleString(isAr ? 'ar-AE' : 'en-AE')} AED</bdi></p>
    <div className="overflow-x-auto"><table className="w-full text-sm text-start">
      <thead><tr>{(isAr ? ['المرحلة', 'النسبة', 'المبلغ (درهم)'] : ['Milestone', 'Percentage', 'Amount (AED)']).map(h => <th key={h} scope="col" className="text-start py-2 pe-4">{h}</th>)}</tr></thead>
      <tbody>{rows.map(([name, percent, amount]) => <tr key={name} className="border-t border-[#D9CEBA]">
        <th scope="row" className="text-start py-3 pe-4">{name}</th><td className="pe-4"><bdi>{percent}%</bdi></td><td><bdi>{Number(amount).toLocaleString(isAr ? 'ar-AE' : 'en-AE')}</bdi></td>
      </tr>)}</tbody>
    </table></div>
    <p className="mt-3 text-sm">{isAr ? 'شروط الشحن' : 'Shipping terms'}: {contract.shippingTerms}</p>
    {contract.specialConditions && <p className="mt-2 text-sm">{isAr ? 'الشروط الخاصة' : 'Special conditions'}: {contract.specialConditions}</p>}
    <p className="mt-3 text-sm text-[#594F47]">{isAr
      ? 'قاعدة العرض: المقدّم بعد قبول الاتفاقية وتسجيل أدلة العلاقات العامة والفريق الفني. للتسليم وما بعد الافتتاح أدلة مستقلة لم تُسجّل بعد.'
      : 'Demo rule: advance follows agreement acceptance and recorded PR and Technical evidence. Delivery and Post-Opening require separate evidence, not yet recorded.'}</p>
  </section>;
}
