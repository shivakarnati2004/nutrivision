const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Sherya\\Downloads\\ezgif-468941e864d2b3d6-jpg';
const destDir = path.join(__dirname, 'public', 'sequence');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg')).sort();

files.forEach((file, index) => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, `frame-${index}.jpg`);
    fs.copyFileSync(srcPath, destPath);
});

console.log(`Copied and renamed ${files.length} frames.`);
