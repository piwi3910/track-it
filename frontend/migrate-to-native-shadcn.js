#!/usr/bin/env node

// Migration script to convert wrapper components to native shadcn usage

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Button prop mappings
const buttonPropMappings = {
  // Mantine variant to shadcn variant
  variantMap: {
    'filled': 'default',
    'outline': 'outline', 
    'light': 'secondary',
    'subtle': 'ghost',
    'default': 'default',
    'gradient': 'default',
    'white': 'outline',
  },
  // Mantine size to shadcn size/className
  sizeMap: {
    'xs': 'sm',
    'sm': 'sm',
    'md': 'default',
    'lg': 'lg',
    'xl': 'lg',
  },
  // Mantine color to variant override
  colorMap: {
    'red': 'destructive',
    'green': 'default', // with custom green class
    'blue': 'default',
    'yellow': 'default', // with custom yellow class
    'orange': 'default', // with custom orange class
    'gray': 'secondary',
    'dark': 'secondary',
  }
};

// Convert AppButton to Button
function migrateButton(content) {
  // Update imports
  content = content.replace(
    /import\s*{\s*AppButton\s*}\s*from\s*['"]@\/components\/ui\/AppButton['"]/g,
    "import { Button } from '@/components/ui/button'"
  );
  
  // Replace component usage with prop conversion
  content = content.replace(/<AppButton\s+([^>]*?)(\/>|>[\s\S]*?<\/AppButton>)/g, (match, props, closing) => {
    let newProps = props;
    let classNames = [];
    
    // Handle fullWidth
    if (/fullWidth/.test(newProps)) {
      classNames.push('w-full');
      newProps = newProps.replace(/fullWidth\s*=?\s*{?true}?\s*/g, '');
    }
    
    // Handle loading
    const loadingMatch = newProps.match(/loading\s*=\s*{([^}]+)}/);
    if (loadingMatch || /loading\s*(?!=)/.test(newProps)) {
      // We'll need to handle loading state in the button content
      newProps = newProps.replace(/loading\s*=?\s*{?[^}\s]*}?\s*/g, '');
    }
    
    // Handle leftSection/rightSection
    const leftSectionMatch = newProps.match(/leftSection\s*=\s*{([^}]+)}/);
    const rightSectionMatch = newProps.match(/rightSection\s*=\s*{([^}]+)}/);
    if (leftSectionMatch || rightSectionMatch) {
      // These will need to be moved into button content
      newProps = newProps.replace(/leftSection\s*=\s*{[^}]+}\s*/g, '');
      newProps = newProps.replace(/rightSection\s*=\s*{[^}]+}\s*/g, '');
    }
    
    // Handle variant
    const variantMatch = newProps.match(/variant\s*=\s*["']([^"']+)["']/);
    if (variantMatch) {
      const mantineVariant = variantMatch[1];
      const shadcnVariant = buttonPropMappings.variantMap[mantineVariant] || 'default';
      newProps = newProps.replace(/variant\s*=\s*["'][^"']+["']\s*/g, `variant="${shadcnVariant}" `);
    }
    
    // Handle size
    const sizeMatch = newProps.match(/size\s*=\s*["']([^"']+)["']/);
    if (sizeMatch) {
      const mantineSize = sizeMatch[1];
      const shadcnSize = buttonPropMappings.sizeMap[mantineSize] || 'default';
      newProps = newProps.replace(/size\s*=\s*["'][^"']+["']\s*/g, `size="${shadcnSize}" `);
    }
    
    // Handle color (requires custom className)
    const colorMatch = newProps.match(/color\s*=\s*["']([^"']+)["']/);
    if (colorMatch) {
      const color = colorMatch[1];
      if (color === 'red') {
        newProps = newProps.replace(/color\s*=\s*["']red["']\s*/g, 'variant="destructive" ');
      } else {
        // For other colors, we'll add custom classes
        newProps = newProps.replace(/color\s*=\s*["'][^"']+["']\s*/g, '');
      }
    }
    
    // Handle mt, mb, ml, mr props
    const spacingProps = {
      'mt': 'mt-',
      'mb': 'mb-',
      'ml': 'ml-',
      'mr': 'mr-',
      'mx': 'mx-',
      'my': 'my-'
    };
    
    Object.entries(spacingProps).forEach(([prop, className]) => {
      const spacingMatch = newProps.match(new RegExp(`${prop}\\s*=\\s*["']([^"']+)["']`));
      if (spacingMatch) {
        const value = spacingMatch[1];
        // Convert Mantine spacing to Tailwind (xs: 1, sm: 2, md: 4, lg: 6, xl: 8)
        const spacingMap = { xs: '1', sm: '2', md: '4', lg: '6', xl: '8' };
        classNames.push(className + (spacingMap[value] || '4'));
        newProps = newProps.replace(new RegExp(`${prop}\\s*=\\s*["'][^"']+["']\\s*`), '');
      }
    });
    
    // Handle radius
    newProps = newProps.replace(/radius\s*=\s*["'][^"']+["']\s*/g, '');
    
    // Handle compact
    if (/compact/.test(newProps)) {
      classNames.push('px-2 py-1');
      newProps = newProps.replace(/compact\s*=?\s*{?true}?\s*/g, '');
    }
    
    // Add or merge className
    const existingClassMatch = newProps.match(/className\s*=\s*["']([^"']+)["']/);
    if (existingClassMatch) {
      classNames.push(existingClassMatch[1]);
      newProps = newProps.replace(/className\s*=\s*["'][^"']+["']\s*/g, '');
    }
    
    if (classNames.length > 0) {
      newProps = `className="${classNames.join(' ')}" ${newProps}`;
    }
    
    // Clean up any double spaces
    newProps = newProps.replace(/\s+/g, ' ').trim();
    
    return `<Button ${newProps}${closing}`;
  });
  
  return content;
}

// Convert AppBadge to Badge
function migrateBadge(content) {
  // Update imports
  content = content.replace(
    /import\s*{\s*AppBadge\s*}\s*from\s*['"]@\/components\/ui\/AppBadge['"]/g,
    "import { Badge } from '@/components/ui/badge'"
  );
  
  // Replace component usage
  content = content.replace(/<AppBadge/g, '<Badge');
  content = content.replace(/<\/AppBadge>/g, '</Badge>');
  
  return content;
}

// Main migration function
async function migrateFile(filePath) {
  console.log(`Migrating ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Apply migrations
  content = migrateButton(content);
  content = migrateBadge(content);
  
  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed for ${filePath}`);
  }
}

// Find all TypeScript files
async function main() {
  const files = glob.sync('src/**/*.tsx', { 
    cwd: path.resolve(__dirname),
    absolute: true 
  });
  
  console.log(`Found ${files.length} TypeScript files to check...`);
  
  for (const file of files) {
    await migrateFile(file);
  }
  
  console.log('\n✨ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Fix any remaining type errors');
  console.log('3. Update button content for loading states and icons');
  console.log('4. Test the application');
}

main().catch(console.error);