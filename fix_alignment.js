const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('page.js')) results.push(file);
        }
    });
    return results;
}
 
const files = walk('src/app/dashboard');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("key: 'actions',") && !content.includes("align: 'right',")) {
        content = content.replace(/key: 'actions',\s*label: 'Action(s?)',/g, "key: 'actions',\n      align: 'right',\n      label: 'Action$1',");
        
        // Also fix the padding in the render div which is pushing the buttons left
        // from: className="flex items-center justify-end gap-2 pr-6"
        // to:   className="flex items-center justify-end gap-2"
        content = content.replace(/className="flex items-center justify-end gap-2 pr-6"/g, 'className="flex items-center justify-end gap-2"');
        
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
});

console.log(`Updated ${count} files.`);
