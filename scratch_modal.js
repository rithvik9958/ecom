const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, 'src/app/dashboard');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('confirm(') && !content.includes('confirm`')) return;
  if (content.includes('ConfirmDeleteModal')) return; // Already processed
  
  console.log(`Processing: ${filePath}`);
  
  // 1. Calculate relative depth for import
  const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src/components/dashboard/ConfirmDeleteModal'));
  const importPath = relativePath.replace(/\\/g, '/');
  
  // 2. Add import statement
  if (content.includes("import { Edit2, Trash2")) {
    content = content.replace(/(import.*lucide-react.*)/, `$1\nimport ConfirmDeleteModal from '${importPath}'`);
  } else if (content.includes("lucide-react")) {
    content = content.replace(/(import.*lucide-react.*)/, `$1\nimport ConfirmDeleteModal from '${importPath}'`);
  } else {
    // Just put it after first line
    content = content.replace(/^(.*)/, `$1\nimport ConfirmDeleteModal from '${importPath}'`);
  }
  
  // 3. Add state
  if (!content.includes('const [confirmModal')) {
    content = content.replace(/(const \[toasts,\s*setToasts\]\s*=\s*useState\(\[\]\))/, `$1\n  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })`);
  }
  if (!content.includes('const [confirmModal') && content.includes('function addToast')) {
     content = content.replace(/(function addToast)/, `const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })\n\n  $1`);
  }

  // 4. Replace single delete
  content = content.replace(/if \(!confirm\(['"`](.*?)['"`]\)\) return/g, (match, msg) => {
    return `try {\n      setConfirmModal({ isOpen: false, type: 'single', id: null })`; // We are removing the return and just nesting inside try
  });

  // 5. Replace button click triggers (very brittle regex, maybe manual is better)
  // Actually, wait, replacing handleDelete logic and button clicks via regex is very dangerous.
  
}

// ... this is too brittle.
