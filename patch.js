const fs = require('fs');
const content = fs.readFileSync('src/components/StoryMode.tsx', 'utf8');

let newContent = content.replace(
  /({isAr \? 'الذاكرة المؤسسية المعتمدة:' : 'A Unified Institutional Archive:'})/g,
  "{isAr ? current.highlightPrefixAr : current.highlightPrefixEn}"
);

fs.writeFileSync('src/components/StoryMode.tsx', newContent);
