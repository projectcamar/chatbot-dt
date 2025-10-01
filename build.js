const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = 'public';
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Copy files to public directory
const filesToCopy = ['index.html', '_redirects'];

filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(publicDir, file));
        console.log(`Copied ${file} to public/`);
    } else {
        console.log(`Warning: ${file} not found`);
    }
});

console.log('Build completed - Static site ready');
