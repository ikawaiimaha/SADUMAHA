import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useUiText } from '../context/I18nContext';
import './SaduIntro.css';

/**
 * The front door before sign-in: why SADU exists, drawn from the approval memo
 * (sadu-proposal, 15 October 2026). Structure, not motif: the loom shows plain
 * weave only, never decorative Al Sadu patterns.
 */

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const number = (n: number) => new Intl.NumberFormat('en-US').format(n);

/** Adds `is-in` once an element scrolls into view, so sections can animate in. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || !('IntersectionObserver' in window)) { setInView(true); return; }
    const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setInView(true); io.disconnect(); } }, { threshold: .25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

function CountUp({ value, run }: { value: number; run: boolean }) {
  const [shown, setShown] = useState(() => reducedMotion() ? value : 0);
  useEffect(() => {
    if (!run || reducedMotion()) { if (run) setShown(value); return; }
    let raf = 0, t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / 1600);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);
  return <bdi dir="ltr" className="si-num">{number(shown)}</bdi>;
}

/* ---------- The loom ---------- */

type Phase = 'scatter' | 'gather' | 'weave' | 'done';
const SCATTER_MS = 2600, GATHER_MS = 1700, WEAVE_MS = 5200;
const warpColour = '#7C6E5E', groundColour = '#1C2023', shuttleColour = '#D3A57A';
const fileColours = ['#C9BFAE', '#9A907F', '#B9875A', '#EFE6D6'];
// Plain bands of colour, woven row by row: structure only, no motifs.
const stripes = ['#4A5056', '#4A5056', '#B9875A', '#EFE6D6', '#EFE6D6', '#8B261E', '#EFE6D6', '#EFE6D6', '#B9875A', '#4A5056', '#4A5056', '#4A5056'];

type Fragment = { x: number; y: number; vx: number; vy: number; w: number; h: number; col: number; colour: string; copy: boolean; delay: number };

function Loom({ onPhase, replayKey }: { onPhase: (p: Phase) => void; replayKey: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let W = 0, H = 0, cell = 10, cols = 0, rows = 0, raf = 0, t0 = 0, lastPhase: Phase | '' = '';
    let fragments: Fragment[] = [];
    const reduce = reducedMotion();
    const setPhase = (p: Phase) => { if (p !== lastPhase) { lastPhase = p; onPhase(p); } };
    const seed = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
    function size() {
      const r = el!.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      el!.width = Math.round(W * dpr); el!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Math.max(8, Math.round(Math.min(W / 30, H / 26)));
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
      // Scattered files: each belongs to a warp column; about one in five is a copy of another.
      fragments = [];
      const count = Math.round(cols * 2.6);
      for (let i = 0; i < count; i++) {
        const copy = seed(i + 7) < .2;
        fragments.push({
          x: seed(i + 1) * W, y: seed(i + 2) * H, vx: (seed(i + 3) - .5) * .25, vy: (seed(i + 4) - .5) * .25,
          w: cell * (1.1 + seed(i + 5) * .9), h: cell * (1.4 + seed(i + 6) * .8), col: i % cols,
          colour: copy ? '#8B261E' : fileColours[i % fileColours.length], copy, delay: seed(i + 8) * .35,
        });
      }
    }
    const ease = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    function background() { ctx!.fillStyle = groundColour; ctx!.fillRect(0, 0, W, H); }
    function warp(alpha: number) {
      ctx!.globalAlpha = alpha; ctx!.fillStyle = warpColour;
      for (let c = 0; c < cols; c++) ctx!.fillRect(c * cell + cell * .3, 0, cell * .4, H);
      ctx!.globalAlpha = 1;
    }
    function weft(row: number, from: number, to: number) {
      // One pass of the weft: over one warp thread, under the next, alternating each row.
      const colour = stripes[row % stripes.length], y = H - (row + 1) * cell;
      for (let c = from; c < to; c++) {
        ctx!.fillStyle = colour;
        if ((c + row) % 2 === 0) ctx!.fillRect(c * cell, y + cell * .16, cell, cell * .68);
        else {
          ctx!.fillRect(c * cell, y + cell * .16, cell * .3, cell * .68); ctx!.fillRect(c * cell + cell * .7, y + cell * .16, cell * .3, cell * .68);
          ctx!.fillStyle = warpColour; ctx!.fillRect(c * cell + cell * .3, y, cell * .4, cell);
        }
      }
    }
    function file(f: Fragment, x: number, y: number, w: number, h: number, alpha: number) {
      ctx!.globalAlpha = alpha; ctx!.fillStyle = f.colour;
      const r = Math.min(w, h) * .18;
      ctx!.beginPath();
      if (ctx!.roundRect) ctx!.roundRect(x - w / 2, y - h / 2, w, h, r); else ctx!.rect(x - w / 2, y - h / 2, w, h);
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }
    function drawScatter(ms: number) {
      background();
      for (const f of fragments) {
        const x = (f.x + f.vx * ms / 16 + W) % W, y = (f.y + f.vy * ms / 16 + H) % H;
        file(f, x, y, f.w, f.h, f.copy ? .95 : .55);
        // A copy sits slightly offset from its twin, like the same file saved again.
        if (f.copy) file({ ...f, colour: '#E07A6C' }, x + f.w * .28, y - f.h * .22, f.w, f.h, .45);
      }
    }
    function drawGather(p: number) {
      background();
      warp(ease(p) * .9);
      for (const f of fragments) {
        const q = ease(Math.min(1, Math.max(0, (p - f.delay) / (1 - f.delay))));
        const sx = (f.x + f.vx * SCATTER_MS / 16 + W) % W, sy = (f.y + f.vy * SCATTER_MS / 16 + H) % H;
        const tx = f.col * cell + cell / 2;
        const x = sx + (tx - sx) * q, y = sy + (H / 2 - sy) * q;
        // Files become threads: narrow and tall. Copies fold into their twin and disappear.
        const w = f.w + (cell * .4 - f.w) * q, h = f.h + (H - f.h) * q;
        file(f, x, y, w, h, (f.copy ? .95 : .55) * (1 - q));
      }
    }
    function drawWeave(done: number) {
      background();
      warp(1);
      const total = done * rows, full = Math.floor(total), part = total - full;
      for (let row = 0; row < Math.min(full, rows); row++) weft(row, 0, cols);
      if (full < rows && done < 1) {
        const n = Math.floor(part * cols), ltr = full % 2 === 0;
        if (ltr) weft(full, 0, n); else weft(full, cols - n, cols);
        // The shuttle carries the thread across the open row.
        const x = ltr ? n * cell : (cols - n) * cell - cell * 2.4, y = H - (full + 1) * cell;
        ctx!.fillStyle = shuttleColour; ctx!.beginPath();
        if (ctx!.roundRect) ctx!.roundRect(x, y - cell * .15, cell * 2.4, cell * 1.3, cell * .65); else ctx!.rect(x, y - cell * .15, cell * 2.4, cell * 1.3);
        ctx!.fill();
      }
    }
    function frame(t: number) {
      if (!t0) t0 = t;
      const ms = t - t0;
      if (ms < SCATTER_MS) { setPhase('scatter'); drawScatter(ms); }
      else if (ms < SCATTER_MS + GATHER_MS) { setPhase('gather'); drawGather((ms - SCATTER_MS) / GATHER_MS); }
      else if (ms < SCATTER_MS + GATHER_MS + WEAVE_MS) { setPhase('weave'); drawWeave((ms - SCATTER_MS - GATHER_MS) / WEAVE_MS); }
      else { setPhase('done'); drawWeave(1); return; }
      raf = requestAnimationFrame(frame);
    }
    size();
    if (reduce) { setPhase('done'); drawWeave(1); }
    else raf = requestAnimationFrame(frame);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { size(); if (lastPhase === 'done') drawWeave(1); }) : null;
    ro?.observe(el);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [onPhase, replayKey]);
  return <canvas ref={canvas} className="si-loom" aria-hidden="true"/>;
}

/* ---------- Page ---------- */

const CASES = [
  { then: ['Two months of emails with an artist’s studio before we learned they only make large new commissions, when the round needed existing works.', 'شهران من المراسلات مع استوديو أحد الفنانين قبل أن نعلم أنه لا ينتج إلا أعمالاً جديدة كبيرة بالتكليف، في حين كانت الدورة تتطلب أعمالاً قائمة.'], now: ['Every case states “existing work” or “new commission” before the Committee sees it.', 'يحدد كل ملف ترشيح «عملاً قائماً» أو «تكليفاً بعمل جديد» قبل أن تراه اللجنة.'] },
  { then: ['An artist’s proposal was declined in a three-word message after the coordinator had contacted them.', 'رُفض مقترح أحد الفنانين برسالة من ثلاث كلمات بعد أن تواصل المنسق معه.'], now: ['The invitation list is built only from recorded decisions, and every decision keeps the Committee’s reason.', 'لا تُبنى قائمة الدعوات إلا من القرارات المسجلة، ويُسجَّل كل قرار مع السبب الذي تقدمه اللجنة.'] },
  { then: ['An artist’s name was wrong in an internal directive, and the error carried into the letters that followed.', 'ورد اسم فنان خطأً في توجيه داخلي، وانتقل الخطأ إلى ما تلاه من مراسلات.'], now: ['One case per artist holds the approved Arabic and English name, and every document takes it from there.', 'ملف واحد لكل فنان باسمه العربي والإنجليزي المعتمد، ومنه يُنقل الاسم إلى بقية المراسلات والوثائق.'] },
  { then: ['Artists were asked to resend the titles and images of their works, weeks after they had sent them.', 'طُلب من فنانين إعادة إرسال عناوين أعمالهم وصورها، وقد أرسلوها قبل أسابيع.'], now: ['Profile, works, sources and CV sit in one case, with a dated copy in the shared folder.', 'النبذة التعريفية والأعمال ومصادرها والسيرة الذاتية في ملف واحد، مع نسخة مؤرخة في المجلد المشترك.'] },
  { then: ['When an artist withdrew late for health reasons, the search for a replacement started from zero.', 'حين انسحب فنان في وقت متأخر لأسباب صحية، بدأ البحث عن بديل من الصفر.'], now: ['Every candidate’s case and decision is kept, so a replacement starts from a list already reviewed.', 'تبقى ملفات جميع المرشحين وقراراتهم محفوظة، فيبدأ البحث عن بديل من قائمة سبقت مراجعتها.'] },
] as const;

const MILESTONES = [
  { date: new Date(2026, 9, 15), label: ['15 Oct 2026', '15 أكتوبر 2026'], title: ['Memo for approval', 'المذكرة للموافقة'], body: ['Reviewed with Fatima Al Zarooni, then presented to the Director.', 'تُراجَع مع فاطمه الزرعوني، ثم تُعرض على المدير.'] },
  { date: new Date(2026, 10, 16), label: ['16 Nov 2026', '16 نوفمبر 2026'], title: ['Scouting begins', 'بدء رصد الفنانين'], body: ['Artists and art ideas from published sources only, with no artist contact.', 'الفنانون والأفكار الفنية من المصادر المنشورة فقط، دون التواصل مع الفنانين.'] },
  { date: new Date(2027, 3, 15), label: ['Around April 2027', 'أبريل 2027 تقريباً'], title: ['Exhibitors chosen', 'اختيار العارضين'], body: ['Proposals gathered and the Committee decides, on the date the festival sets.', 'جمع المقترحات وقرار اللجنة، في الموعد الذي تحدده إدارة المهرجان.'] },
  { date: new Date(2027, 4, 1), label: ['Two weeks later', 'بعد أسبوعين'], title: ['Pilot report', 'تقرير المرحلة التجريبية'], body: ['Each target met or not, then the decision on a Cultural Affairs project for the Department’s other events.', 'تحقق كل هدف أو عدمه، ثم البتّ في تحويله إلى مشروع يخدم فعاليات الدائرة الأخرى.'] },
  { date: new Date(2027, 11, 1), label: ['December 2027', 'ديسمبر 2027'], title: ['Sharjah Islamic Arts Festival', 'مهرجان الشارقة للفنون الإسلامية'], body: ['The exhibitors SADU helped choose open to the public.', 'يفتتح العارضون الذين ساعد السدو في اختيارهم.'] },
] as const;

/** Where "today" sits along the evenly spaced timeline, as 0..1. */
function todayAlong(now: Date) {
  const n = MILESTONES.length - 1;
  if (now <= MILESTONES[0].date) return 0;
  for (let i = 0; i < n; i++) {
    const a = MILESTONES[i].date.getTime(), b = MILESTONES[i + 1].date.getTime();
    if (now.getTime() <= b) return (i + (now.getTime() - a) / (b - a)) / n;
  }
  return 1;
}

function Section({ id, className = '', children, label }: { id?: string; className?: string; children: (inView: boolean) => ReactNode; label?: string }) {
  const [ref, inView] = useReveal<HTMLElement>();
  return <section id={id} ref={ref} aria-label={label} className={`si-section ${className} ${inView ? 'is-in' : ''}`}>{children(inView)}</section>;
}

export default function SaduIntro({ signedIn, onContinue }: { signedIn: boolean; onContinue: () => void }) {
  const { t, isAr, toggleLang } = useUiText();
  const [phase, setPhase] = useState<Phase>('scatter');
  const [replay, setReplay] = useState(0);
  const [withSadu, setWithSadu] = useState(false);
  const onPhase = useCallback((p: Phase) => setPhase(p), []);
  const now = new Date();
  const scoutingIn = Math.ceil((MILESTONES[1].date.getTime() - now.getTime()) / 86400000);
  const along = todayAlong(now);
  const L = (pair: readonly [string, string]) => isAr ? pair[1] : pair[0];
  useEffect(() => { document.title = isAr ? 'سدو · لماذا السدو' : 'SADU · Why SADU'; }, [isAr]);
  const cta = signedIn ? t('Open Nominations', 'فتح الترشيحات') : t('Sign in to Nominations', 'الدخول إلى الترشيحات');
  const caption: Record<Phase, string> = {
    scatter: t('Today: 117,557 files, about one in five a copy.', 'اليوم: 117,557 ملفاً، نحو ملف من كل خمسة نسخة مكررة.'),
    gather: t('Each department becomes one thread.', 'كل قسم يصبح خيطاً واحداً.'),
    weave: t('Every nomination passes through all of them.', 'كل ترشيح يمرّ عبرها جميعاً.'),
    done: t('One record for every artist, across every event.', 'سجل واحد لكل فنان، في كل فعالية.'),
  };
  return <div className="sadu-intro" lang={isAr ? 'ar' : 'en'} dir={isAr ? 'rtl' : 'ltr'}>
    <header className="si-top">
      <a href="#si-hero" className="si-brand"><span className="si-brand-mark">{isAr ? 'سدو' : 'SADU'}</span><span className="si-brand-sub">{t('Cultural Affairs · Sharjah Department of Culture', 'إدارة الشؤون الثقافية · دائرة الثقافة')}</span></a>
      <button type="button" className="si-ghost" lang={isAr ? 'en' : 'ar'} onClick={toggleLang}>{isAr ? 'English' : 'العربية'}</button>
      <button type="button" className="si-ghost si-ghost-strong" onClick={onContinue}>{signedIn ? t('Nominations', 'الترشيحات') : t('Sign in', 'تسجيل الدخول')}</button>
    </header>
    <main>

    <section id="si-hero" className="si-hero">
      <div className="si-hero-copy">
        <p className="si-eyebrow">{t('For all the Department’s events · First pilot: Sharjah Islamic Arts Festival, December 2027', 'لكل فعاليات الدائرة · التجربة الأولى: مهرجان الشارقة للفنون الإسلامية، ديسمبر 2027')}</p>
        <h1 className="si-title"><span className="si-title-main">{isAr ? 'السدو' : 'SADU'}</span><span className="si-title-twin" lang={isAr ? 'en' : 'ar'}>{isAr ? 'SADU' : 'السدو'}</span></h1>
        <p className="si-claim">{t('One record for every artist and every work, across all the Department’s events.', 'سجل واحد لكل فنان ولكل عمل، في كل فعاليات الدائرة.')}</p>
        <p className="si-sub">{t('The Department works with many artists in Arab and Islamic art, and many take part in more than one of its events. Today every team keeps its own copy of the same artist, and artists are asked again for material they already sent. SADU keeps each artist once, for every event, from scouting to the Committee’s decision.', 'تعمل الدائرة مع فنانين كثيرين في الفنون العربية والإسلامية، ويشارك كثير منهم في أكثر من فعالية. واليوم يحفظ كل قسم نسخته من ملف الفنان نفسه، ويُطلب من الفنانين إرسال ما سبق أن أرسلوه. يحفظ السدو كل فنان مرة واحدة لكل الفعاليات، من رصده حتى قرار اللجنة.')}</p>
        <div className="si-actions">
          <button type="button" className="si-cta" onClick={onContinue}>{cta}</button>
          <a className="si-link" href="#si-why">{t('Why SADU', 'لماذا السدو')} <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      <figure className="si-loom-wrap">
        <ol className={`si-threads ${phase === 'gather' || phase === 'weave' ? 'is-on' : ''} ${phase === 'done' ? 'is-done' : ''}`} aria-hidden="true">
            {[['Coordination', 'التنسيق'], ['Editorial', 'التحرير'], ['PR', 'العلاقات العامة'], ['Protocol', 'التشريفات'], ['Committee', 'اللجنة']].map(([en, ar]) => <li key={en}>{isAr ? ar : en}</li>)}
          </ol>
        <div className="si-loom-frame">
          <Loom onPhase={onPhase} replayKey={replay}/>
        </div>
        <figcaption className="si-loom-caption"><span aria-live="polite"><span key={phase} className="si-caption-line">{caption[phase]}</span></span>
          {phase === 'done' && !reducedMotion() && <button type="button" className="si-replay" onClick={() => setReplay(r => r + 1)}>{t('Replay', 'إعادة')}</button>}
        </figcaption>
      </figure>
      <p className="si-proverb"><span lang="ar">السَّدى واللُّحمة: خيوط كثيرة، ونسيج واحد.</span><span lang="en">Warp and weft: many threads, one cloth.</span></p>
    </section>

    <Section id="si-why" className="si-light" label={t('Why SADU exists', 'لماذا وُجد السدو')}>{inView => <div className="si-wrap">
      <p className="si-eyebrow si-eyebrow-dark">{t('Why SADU exists', 'لماذا وُجد السدو')}</p>
      <h2 className="si-h2">{t('Everything is saved. Nothing can be found.', 'كل شيء محفوظ، ولا شيء يمكن العثور عليه.')}</h2>
      <div className="si-why">
        <dl className="si-stats">
          <div className="si-stat"><dt><CountUp value={117557} run={inView}/></dt><dd>{t('files in 11,875 folders of the shared drive', 'ملفاً في 11,875 مجلداً في المجلد المشترك')}</dd></div>
          <div className="si-stat"><dt><CountUp value={815} run={inView}/> <small>{t('GB', 'غيغابايت')}</small></dt><dd>{t('of files with no index', 'من الملفات دون فهرسة')}</dd></div>
          <div className="si-stat si-stat-alert"><dt><CountUp value={23050} run={inView}/></dt><dd>{t('duplicates with the same name and size: about one file in five', 'نسخة مكررة بالاسم والحجم نفسيهما، أي نحو ملف من كل خمسة')}</dd></div>
          <div className="si-stat"><dt><CountUp value={2621} run={inView}/></dt><dd>{t('files named as passports, visas, ID cards or bank details, open to most staff', 'ملفاً تشير أسماؤها إلى جوازات سفر أو تأشيرات أو بطاقات هوية أو بيانات مصرفية، ومعظمها متاح لمعظم الموظفين')}</dd></div>
        </dl>
        <figure className="si-fifth" aria-label={t('About one file in five is a duplicate', 'نحو ملف من كل خمسة نسخة مكررة')}>
          <div className="si-grid" aria-hidden="true">{Array.from({ length: 100 }, (_, i) => <span key={i} style={{ transitionDelay: `${(i % 10) * 35 + Math.floor(i / 10) * 35}ms` }} className={[3, 8, 12, 17, 21, 26, 34, 39, 45, 48, 52, 57, 63, 66, 71, 75, 82, 87, 93, 98].includes(i) ? 'is-copy' : ''}/>)}</div>
          <figcaption>{t('Every square is a file. The red ones are copies of a file that already exists.', 'كل مربع ملف، والمربعات الحمراء نسخ من ملف موجود أصلاً.')}</figcaption>
        </figure>
      </div>
      <p className="si-lede">{t('Each department saves its own copy of the same artist’s files inside the other departments’ folders. Nobody knows which copy is the latest, artists are asked to resend what they already sent, and personal documents stay open far more widely than they should.', 'يحتفظ كل قسم بنسخته من ملفات الفنان نفسه داخل مجلدات الأقسام الأخرى. والنتيجة أنه لا أحد يعرف أي نسخة هي الأحدث، ويُطلب من الفنانين إعادة إرسال ما سبق أن أرسلوه، وتبقى الوثائق الشخصية متاحة على نطاق أوسع بكثير مما ينبغي.')}</p>
      <p className="si-source">{t('Source: a count of file names and sizes in the Department’s shared drive on 31 August 2026, without opening any file. Duplicates are counted conservatively; renamed copies are not included.', 'المصدر: حصر لأسماء الملفات وأحجامها في المجلد المشترك للدائرة بتاريخ 31 أغسطس 2026، دون فتح أي ملف. احتُسبت النسخ المكررة بتحفظ؛ فلا تشمل النسخ التي غُيّرت أسماؤها.')}</p>
    </div>}</Section>

    <Section className="si-light si-cases-band" label={t('From our own work', 'من واقع عملنا')}>{() => <div className="si-wrap">
      <div className="si-cases-head">
        <div><p className="si-eyebrow si-eyebrow-dark">{t('From our own work', 'من واقع عملنا')}</p>
          <h2 className="si-h2">{t('Five recent nominations. Five threads that broke.', 'خمسة ترشيحات حديثة، وخمسة خيوط انقطعت.')}</h2></div>
        <div className="si-switch" role="group" aria-label={t('Show', 'اعرض')}>
          <button type="button" aria-pressed={!withSadu} onClick={() => setWithSadu(false)}>{t('What happened', 'ما حدث')}</button>
          <button type="button" aria-pressed={withSadu} onClick={() => setWithSadu(true)}>{t('With SADU', 'مع السدو')}</button>
        </div>
      </div>
      <ol className={`si-cases ${withSadu ? 'is-sadu' : ''}`}>
        {CASES.map((c, i) => <li key={i} className="si-case" style={{ transitionDelay: `${i * 70}ms` }}>
          <div className="si-case-inner" style={{ transitionDelay: `${i * 70}ms` }}>
            <div className="si-face si-face-then" aria-hidden={withSadu}><span className="si-case-n">{String(i + 1).padStart(2, '0')}</span><p className="si-face-label">{t('What happened', 'ما حدث')}</p><p>{L(c.then)}</p></div>
            <div className="si-face si-face-now" aria-hidden={!withSadu}><span className="si-case-n">{String(i + 1).padStart(2, '0')}</span><p className="si-face-label">{t('With SADU', 'مع السدو')}</p><p>{L(c.now)}</p></div>
          </div>
        </li>)}
      </ol>
      <p className="si-source">{t('Names withheld; details available on request.', 'حُجبت الأسماء، والتفاصيل متاحة عند الطلب.')}</p>
    </div>}</Section>

    <Section className="si-dark" label={t('The pilot', 'المرحلة التجريبية')}>{() => <div className="si-wrap">
      <p className="si-eyebrow">{t('The pilot', 'المرحلة التجريبية')}</p>
      <h2 className="si-h2">{t('First pilot: one nomination round at the Sharjah Islamic Arts Festival.', 'التجربة الأولى: دورة ترشيحات واحدة في مهرجان الشارقة للفنون الإسلامية.')}</h2>
      {scoutingIn > 0 && <p className="si-countdown"><bdi dir="ltr" className="si-num">{scoutingIn}</bdi> {t(scoutingIn === 1 ? 'day until scouting begins' : 'days until scouting begins', 'يوماً حتى بدء رصد الفنانين')}</p>}
      <div className="si-timeline" style={{ ['--si-today' as string]: along }}>
        <div className="si-track" aria-hidden="true"><span className="si-track-fill"/><span className="si-today"><span>{t('Today', 'اليوم')}</span></span></div>
        <ol>{MILESTONES.map((m, i) => <li key={i} className={now >= m.date ? 'is-past' : ''} style={{ transitionDelay: `${300 + i * 140}ms` }}>
          <span className="si-node" aria-hidden="true"/>
          <p className="si-when">{L(m.label)}</p><h3>{L(m.title)}</h3><p>{L(m.body)}</p>
        </li>)}</ol>
      </div>
      <dl className="si-scale">
        <div><dt><bdi dir="ltr">40</bdi></dt><dd>{t('expected nominations', 'ترشيحاً متوقعاً')}</dd></div>
        <div><dt><bdi dir="ltr">3</bdi></dt><dd>{t('staff using SADU', 'من الموظفين يستخدمون السدو')}</dd></div>
        <div><dt><bdi dir="ltr">0</bdi></dt><dd>{t('personal documents in the pilot', 'وثائق شخصية في المرحلة التجريبية')}</dd></div>
        <div><dt>{t('AED 200', '200 درهم')}</dt><dd>{t('a month for hosting; no new budget or licences', 'شهرياً للاستضافة، دون ميزانية جديدة أو تراخيص')}</dd></div>
      </dl>
    </div>}</Section>

    <Section className="si-light" label={t('What changes and what does not', 'ما الذي يتغير وما الذي لا يتغير')}>{() => <div className="si-wrap">
      <div className="si-two">
        <div className="si-col si-col-change"><p className="si-eyebrow si-eyebrow-dark">{t('What SADU changes', 'ما الذي يغيّره السدو')}</p>
          <ul>
            <li>{t('One record per nomination, from the moment the artist’s files first arrive.', 'سجل واحد لكل ترشيح، منذ اللحظة التي تصل فيها ملفات الفنان أول مرة.')}</li>
            <li>{t('The Committee presentation is prepared from the cases, not rebuilt by hand.', 'يُعدّ العرض التقديمي للجنة من الملفات نفسها، لا من جديد يدوياً.')}</li>
            <li>{t('Every decision is recorded with the reason the Committee gives.', 'يُسجَّل كل قرار مع السبب الذي تقدمه اللجنة.')}</li>
            <li>{t('Exports go to one dated “SADU export” folder, so departments stop copying files.', 'تُحفظ الملفات المُصدَّرة في مجلد واحد مؤرخ باسم «SADU export»، فتتوقف الأقسام عن نسخ الملفات.')}</li>
          </ul></div>
        <div className="si-col"><p className="si-eyebrow si-eyebrow-dark">{t('What stays the same', 'ما الذي يبقى كما هو')}</p>
          <ul>
            <li>{t('The Committee process, and its decision still given by email.', 'مسار اللجنة، واستمرار صدور قرارها بالبريد الإلكتروني.')}</li>
            <li>{t('No personal documents until the Sharjah Digital Department has reviewed hosting and security.', 'لا وثائق شخصية قبل مراجعة دائرة الشارقة الرقمية للاستضافة وأمن المعلومات.')}</li>
            <li>{t('The General Exhibition Coordinator or the Director can stop the pilot at any time.', 'للمنسقة العامة للمعارض أو للمدير إيقاف المرحلة التجريبية في أي وقت.')}</li>
            <li>{t('Nothing is lost if it stops: everything is already in the shared folder.', 'لا يضيع شيء إذا توقفت: كل شيء محفوظ مسبقاً في المجلد المشترك.')}</li>
          </ul></div>
      </div>
      <h2 className="si-h2 si-h2-small">{t('What the pilot will prove', 'ما ستثبته المرحلة التجريبية')}</h2>
      <ul className="si-targets">
        <li><strong>{t('30% less', '30% أقل')}</strong><span>{t('time per nomination case, measured against the current way', 'من الوقت لكل ملف ترشيح، مقارنةً بالطريقة الحالية')}</span></li>
        <li><strong>{t('3 days', '3 أيام')}</strong><span>{t('working days at most to prepare the Committee presentation', 'عمل أو أقل لإعداد العرض التقديمي للجنة')}</span></li>
        <li><strong>{t('5 or fewer', '5 أو أقل')}</strong><span>{t('cases returned for missing information', 'ملفات معادة لنقص المعلومات')}</span></li>
        <li><strong>{t('None', 'صفر')}</strong><span>{t('artist files passed around by email, WhatsApp or WeTransfer, apart from the Committee presentation', 'ملفات فنانين متبادلة عبر البريد أو واتساب أو WeTransfer، باستثناء العرض التقديمي للجنة')}</span></li>
      </ul>
    </div>}</Section>

    <section className="si-close">
      <div className="si-strip" aria-hidden="true"/>
      <div className="si-wrap">
        <p className="si-close-line" lang="ar">خيوط كثيرة، ونسيج واحد.</p>
        <p className="si-close-line si-close-en" lang="en">Many threads, one cloth.</p>
        <button type="button" className="si-cta" onClick={onContinue}>{cta}</button>
        <p className="si-credit">{t('Prepared by Maha Alsuwaidi, Exhibition Technician and liaison between artists and the Department. Guided and reviewed by Fatima Ahmed Mohamed Al Zarooni, General Exhibition Coordinator, Cultural Affairs.', 'أعدّته مها السويدي، فني معارض، وحلقة الوصل بين الفنانين ودائرة الثقافة، بتوجيه ومراجعة فاطمه أحمد محمد الزرعوني، منسق معرض عام في إدارة الشؤون الثقافية.')}</p>
        <a className="si-link si-link-quiet" href="https://sadu-proposal.vercel.app" target="_blank" rel="noreferrer">{t('Read the full approval memo', 'قراءة مذكرة الموافقة كاملة')} <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    </main>
  </div>;
}
