const fs = require('fs');
const path = require('path');
const swaggerSpec = require('../config/swagger');
const yaml = require('js-yaml');

async function generateYAML() {
  try {
    // Convert JSON spec to YAML
    const yamlContent = yaml.dump(swaggerSpec, {
      indent: 2,
      lineWidth: -1,
      noRefs: false,
      sortKeys: false
    });

    // Write to file
    const outputPath = path.join(__dirname, '../swagger.yaml');
    fs.writeFileSync(outputPath, yamlContent, 'utf8');

    console.log('✅ Swagger YAML file generated successfully!');
    console.log(`📄 File location: ${outputPath}`);
    console.log('');
    console.log('You can now:');
    console.log('  - Import this YAML into Postman');
    console.log('  - Use it with Swagger Editor');
    console.log('  - Share it with API consumers');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating YAML:', error.message);
    console.error('');
    console.error('Note: If you see "js-yaml not found", install it:');
    console.error('  npm install js-yaml --save-dev');
    process.exit(1);
  }
}

generateYAML();



