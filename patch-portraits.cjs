const fs = require('fs');

let content = fs.readFileSync('src/components/StoryMode.tsx', 'utf8');

// 1. Update the file extensions from .png to .jpg
content = content.replace(/sultan_portrait\.png/g, 'sultan_portrait.jpg');
content = content.replace(/owais_portrait\.png/g, 'owais_portrait.jpg');
content = content.replace(/qaseer_portrait\.png/g, 'qaseer_portrait.jpg');

// 2. Update the CSS cropping to respect the vertical hierarchy
const oldImgTag = 'className="w-full h-full object-cover opacity-90 mix-blend-multiply"';
const newImgTag = 'className="w-full h-full object-cover object-[center_10%] opacity-90 mix-blend-multiply"';

content = content.replace(new RegExp(oldImgTag, 'g'), newImgTag);

fs.writeFileSync('src/components/StoryMode.tsx', content);
console.log('Portrait cropping logic and extensions updated successfully.');
