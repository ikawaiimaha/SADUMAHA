const fs = require('fs');
let content = fs.readFileSync('src/components/StoryMode.tsx', 'utf8');

const regex = /    \{\s*id: 'leadership',[\s\S]*?highlightBoxAr: [^}]+\s*\},\n/;
content = content.replace(regex, '');

fs.writeFileSync('src/components/StoryMode.tsx', content);
