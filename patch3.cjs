const fs = require('fs');
const content = fs.readFileSync('src/components/StoryMode.tsx', 'utf8');

const replacement = `            {current.type === 'leadership-portrait' ? (
              <div className="grid md:grid-cols-2 gap-8 h-full items-stretch flex-1">
                {current.portraitPosition === 'left' && (
                  <div className="flex justify-center items-center h-full bg-sadu-sand rounded-md border border-sadu-gold overflow-hidden">
                    <img src={current.imagePath} alt={isAr ? current.titleAr : current.titleEn} className="w-full h-full object-cover opacity-90 mix-blend-multiply" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex flex-col justify-center h-full space-y-6">
                  <p className="text-sm sm:text-lg font-editorial leading-relaxed text-sadu-charcoal">
                    {isAr ? current.contentAr : current.contentEn}
                  </p>
                  
                  <div className="p-4 rounded-md bg-sadu-sand border-s-4 rtl:border-s-0 rtl:border-e-4 border-sadu-brick text-xs sm:text-sm text-sadu-charcoal shadow-2xs">
                    <span className="font-semibold block text-sadu-brick mb-1">
                      {isAr ? current.highlightPrefixAr : current.highlightPrefixEn}
                    </span>
                    {isAr ? current.highlightBoxAr : current.highlightBoxEn}
                  </div>
                </div>
                {current.portraitPosition === 'right' && (
                  <div className="flex justify-center items-center h-full bg-sadu-sand rounded-md border border-sadu-gold overflow-hidden">
                    <img src={current.imagePath} alt={isAr ? current.titleAr : current.titleEn} className="w-full h-full object-cover opacity-90 mix-blend-multiply" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            ) : currentChapter < chapters.length - 1 ? (`;

const updatedContent = content.replace(
  "{currentChapter < chapters.length - 1 ? (", 
  replacement
);

fs.writeFileSync('src/components/StoryMode.tsx', updatedContent);
