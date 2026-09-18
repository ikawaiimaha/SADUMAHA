const fs = require('fs');
const path = require('path');

function fixImageReferences(dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip heavy directories
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                fixImageReferences(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            const originalContent = fs.readFileSync(fullPath, 'utf8');
            const newContent = originalContent
                .replace(/sultan_portrait\.png/g, 'sultan_portrait.jpg')
                .replace(/owais_portrait\.png/g, 'owais_portrait.jpg')
                .replace(/qaseer_portrait\.png/g, 'qaseer_portrait.jpg');

            if (originalContent !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`✅ Patched leftover PNG references in: ${fullPath}`);
            }
        }
    });
}

console.log('Scanning codebase for broken .png references...');
fixImageReferences('.');
console.log('\nPatch complete.');
