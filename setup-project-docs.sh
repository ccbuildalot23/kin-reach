#!/bin/bash
# setup-project-docs.sh
# Quick setup script for Serenity project documentation in Codex

echo "🚀 Setting up Serenity Project Documentation System"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "No package.json found. Are you in the project root?"
    echo "Please navigate to your Serenity project root and run again."
    exit 1
fi

print_status "Creating documentation generator script..."

# Create the main documentation script
cat > create-project-docs.js << 'EOFDOCS'
// create-project-docs.js
const fs = require('fs');
const path = require('path');

// [Insert the full create-project-docs.js content here]
// Note: In actual use, paste the complete script from the artifact above

console.log('📝 Documentation generator created successfully!');
console.log('Run with: node create-project-docs.js');
EOFDOCS

print_success "Documentation generator created"

# Make it executable
chmod +x create-project-docs.js

# Add to package.json scripts
print_status "Adding npm scripts..."
if command -v npm &> /dev/null; then
    npm pkg set scripts.docs:update="node create-project-docs.js"
    npm pkg set scripts.docs:view="cat PROJECT_DOCS.md"
    npm pkg set scripts.docs:quick="cat QUICK_REFERENCE.md"
    print_success "Added npm scripts"
else
    print_error "npm not found, skipping package.json update"
fi

# Create helper scripts
print_status "Creating helper scripts..."

# Context grabber
cat > grab-context.sh << 'EOF'
#!/bin/bash
echo "🎯 Grabbing Serenity Project Context..."
echo "======================================"
echo ""
if [ -f "PROJECT_DOCS.md" ]; then
    cat PROJECT_DOCS.md
else
    echo "No PROJECT_DOCS.md found. Run: node create-project-docs.js"
fi
echo ""
echo "📊 Current Status:"
git status --short 2>/dev/null || echo "Not a git repository"
EOF
chmod +x grab-context.sh
print_success "Created grab-context.sh"

# Feature checker
cat > check-features.sh << 'EOF'
#!/bin/bash
echo "🔍 Serenity Feature File Check"
echo "=============================="
echo ""
echo "📬 Notification System: $(find . -name "*notification*" -type f | grep -E "\.(ts|tsx)$" | grep -v node_modules | wc -l) files"
echo "📱 SMS System: $(find . -name "*sms*" -o -name "*SMS*" -type f | grep -E "\.(ts|tsx)$" | grep -v node_modules | wc -l) files"
echo "☎️  Phone System: $(find . -name "*phone*" -o -name "*Phone*" -type f | grep -E "\.(ts|tsx)$" | grep -v node_modules | wc -l) files"
echo "🔐 Auth System: $(find . -name "*auth*" -o -name "*Auth*" -type f | grep -E "\.(ts|tsx)$" | grep -v node_modules | wc -l) files"
echo "⚡ Edge Functions: $(find ./supabase/functions -name "*.ts" 2>/dev/null | wc -l) functions"
echo "🗄️  SQL Files: $(find . -name "*.sql" | grep -v node_modules | wc -l) files"
EOF
chmod +x check-features.sh
print_success "Created check-features.sh"

# Quick update script
cat > quick-update.sh << 'EOF'
#!/bin/bash
echo "⚡ Quick Documentation Update"
echo "==========================="
node create-project-docs.js
if [ $? -eq 0 ]; then
    echo ""
    echo "📊 Summary:"
    echo "- Total files: $(grep -c "^src/" important-files.txt 2>/dev/null || echo "0")"
    echo "- Last updated: $(date)"
    echo ""
    echo "View with: cat PROJECT_DOCS.md"
fi
EOF
chmod +x quick-update.sh
print_success "Created quick-update.sh"

# Create initial .gitignore entries if needed
print_status "Updating .gitignore..."
if [ -f ".gitignore" ]; then
    # Check if entries already exist
    if ! grep -q "project-info.json" .gitignore; then
        echo "" >> .gitignore
        echo "# Project documentation (regenerated)" >> .gitignore
        echo "project-info.json" >> .gitignore
        echo "important-files.txt" >> .gitignore
        print_success "Updated .gitignore"
    else
        print_success ".gitignore already configured"
    fi
fi

# Run the documentation generator for the first time
print_status "Generating initial documentation..."
node create-project-docs.js

if [ $? -eq 0 ]; then
    print_success "Initial documentation generated!"
    echo ""
    echo "📁 Created files:"
    echo "  - PROJECT_DOCS.md (main documentation)"
    echo "  - QUICK_REFERENCE.md (quick reference)"
    echo "  - important-files.txt (file listing)"
    echo "  - project-info.json (machine-readable data)"
    echo ""
    echo "🔧 Helper scripts:"
    echo "  - ./grab-context.sh (get context for chats)"
    echo "  - ./check-features.sh (check feature files)"
    echo "  - ./quick-update.sh (quick docs update)"
    echo ""
    echo "📚 NPM Scripts added:"
    echo "  - npm run docs:update (update documentation)"
    echo "  - npm run docs:view (view main docs)"
    echo "  - npm run docs:quick (view quick reference)"
else
    print_error "Failed to generate initial documentation"
    echo "Please check for errors and try running manually:"
    echo "  node create-project-docs.js"
fi

# Create bash aliases file
print_status "Creating bash aliases..."
cat > serenity-aliases.sh << 'EOF'
# Serenity Project Aliases
alias docs='node create-project-docs.js'
alias docs-view='cat PROJECT_DOCS.md'
alias docs-quick='cat QUICK_REFERENCE.md'
alias serenity-status='./check-features.sh'
alias serenity-update='./quick-update.sh'
alias serenity-context='./grab-context.sh'

echo "Serenity aliases loaded! Commands:"
echo "  docs           - Update documentation"
echo "  docs-view      - View main documentation"
echo "  docs-quick     - View quick reference"
echo "  serenity-status - Check feature files"
echo "  serenity-update - Quick docs update"
echo "  serenity-context - Grab context for chats"
EOF
print_success "Created serenity-aliases.sh"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Load aliases: source serenity-aliases.sh"
echo "2. View documentation: cat PROJECT_DOCS.md"
echo "3. Check features: ./check-features.sh"
echo ""
echo "💡 Pro tip: Add to your .bashrc:"
echo "   echo 'source ~/serenity-aliases.sh' >> ~/.bashrc"
echo ""
echo "📝 Remember to run 'npm run docs:update' after major changes!"
echo ""
echo "🙏 Recovery First - Happy coding, Christopher!"
