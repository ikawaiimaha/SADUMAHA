const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Use regex with positive lookbehind or specific boundaries to avoid messing up unexpected things
  // But since Tailwind classes are space or quote separated, we can use a more precise regex.
  // Match `ml-` preceded by space, quote, double-quote, backtick, colon, or minus.
  const prefix = `(?<=['"\`\\s:\\-])`;

  content = content.replace(new RegExp(`${prefix}ml-`, 'g'), 'ms-');
  content = content.replace(new RegExp(`${prefix}mr-`, 'g'), 'me-');
  content = content.replace(new RegExp(`${prefix}pl-`, 'g'), 'ps-');
  content = content.replace(new RegExp(`${prefix}pr-`, 'g'), 'pe-');
  
  content = content.replace(new RegExp(`${prefix}left-`, 'g'), 'start-');
  content = content.replace(new RegExp(`${prefix}right-`, 'g'), 'end-');
  
  content = content.replace(new RegExp(`${prefix}border-l-`, 'g'), 'border-s-');
  content = content.replace(new RegExp(`${prefix}border-r-`, 'g'), 'border-e-');
  content = content.replace(new RegExp(`${prefix}border-l\\b`, 'g'), 'border-s');
  content = content.replace(new RegExp(`${prefix}border-r\\b`, 'g'), 'border-e');
  
  content = content.replace(new RegExp(`${prefix}rounded-l-`, 'g'), 'rounded-s-');
  content = content.replace(new RegExp(`${prefix}rounded-r-`, 'g'), 'rounded-e-');
  content = content.replace(new RegExp(`${prefix}rounded-l\\b`, 'g'), 'rounded-s');
  content = content.replace(new RegExp(`${prefix}rounded-r\\b`, 'g'), 'rounded-e');
  
  content = content.replace(new RegExp(`${prefix}rounded-tl-`, 'g'), 'rounded-ss-');
  content = content.replace(new RegExp(`${prefix}rounded-tr-`, 'g'), 'rounded-se-');
  content = content.replace(new RegExp(`${prefix}rounded-bl-`, 'g'), 'rounded-es-');
  content = content.replace(new RegExp(`${prefix}rounded-br-`, 'g'), 'rounded-ee-');
  
  content = content.replace(new RegExp(`${prefix}text-left\\b`, 'g'), 'text-start');
  content = content.replace(new RegExp(`${prefix}text-right\\b`, 'g'), 'text-end');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files with logical properties.`);
