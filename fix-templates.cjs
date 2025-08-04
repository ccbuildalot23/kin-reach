const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'src/pages/Contacts.tsx',
  'src/pages/Index.tsx', 
  'src/pages/Sounds.tsx',
  'src/pages/CrisisAlert.tsx',
  'src/pages/ResetPassword.tsx',
  'src/components/navigation/BottomNavigation.tsx',
  'src/components/SMSTest.tsx',
  'src/components/CrisisButton.tsx',
  'src/components/SupportRequestTest.tsx',
  'src/components/notifications/NotificationBell.tsx',
  'src/components/CrisisAlertButton.tsx',
  'src/components/ConnectButton.tsx'
];

// Pattern to match problematic template literals in className
const pattern = /className=\{`([^`]+)`\}/g;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace template literals with string concatenation
    content = content.replace(pattern, (match, inner) => {
      // Simple conversion - just replace ${} with string concat
      const converted = inner.replace(/\$\{([^}]+)\}/g, '" + $1 + "');
      return `className={"${converted}"}`;
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Template literal fixes complete!');