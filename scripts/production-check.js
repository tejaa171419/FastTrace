#!/usr/bin/env node

/**
 * Production Build Verification Script
 * Checks for production readiness and potential issues
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ProductionChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = {
      error: '❌',
      warning: '⚠️',
      info: '✅',
      title: '📋'
    }[type] || '•';

    console.log(`${prefix} [${timestamp}] ${message}`);

    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'info') this.info.push(message);
  }

  async checkEnvironmentFiles() {
    this.log('title', 'Checking Environment Configuration...');

    try {
      // Check for production env file
      const prodEnvPath = path.join(projectRoot, '.env.production');
      try {
        await fs.access(prodEnvPath);
        this.log('info', 'Production environment file exists');

        // Check required production variables
        const envContent = await fs.readFile(prodEnvPath, 'utf8');
        const requiredVars = [
          'VITE_API_BASE_URL',
          'VITE_ENABLE_DEV_FEATURES',
          'NODE_ENV'
        ];

        for (const varName of requiredVars) {
          if (!envContent.includes(varName)) {
            this.log('warning', `Missing environment variable: ${varName}`);
          } else {
            this.log('info', `Environment variable configured: ${varName}`);
          }
        }

        // Check for development features disabled
        if (envContent.includes('VITE_ENABLE_DEV_FEATURES=false')) {
          this.log('info', 'Development features are disabled for production');
        } else {
          this.log('error', 'Development features must be disabled in production');
        }

      } catch (error) {
        this.log('warning', 'Production environment file not found (.env.production)');
      }

    } catch (error) {
      this.log('error', `Environment check failed: ${error.message}`);
    }
  }

  async checkSourceCode() {
    this.log('title', 'Checking Source Code for Production Issues...');

    try {
      const srcPath = path.join(projectRoot, 'src');
      await this.checkDirectory(srcPath);
    } catch (error) {
      this.log('error', `Source code check failed: ${error.message}`);
    }
  }

  async checkDirectory(dirPath) {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        await this.checkDirectory(itemPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        await this.checkFile(itemPath);
      }
    }
  }

  async checkFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(projectRoot, filePath);

      // Check for console statements
      const consoleMatches = content.match(/console\.(log|debug|warn|error|info)/g);
      if (consoleMatches && !content.includes('// eslint-disable-next-line no-console')) {
        this.log('warning', `Console statements found in ${relativePath} (${consoleMatches.length} occurrences)`);
      }

      // Check for debugger statements
      if (content.includes('debugger')) {
        this.log('error', `Debugger statement found in ${relativePath}`);
      }

      // Check for development-only code
      if (content.includes('process.env.NODE_ENV === \'development\'')) {
        this.log('info', `Development environment check found in ${relativePath}`);
      }

      // Check for TODO/FIXME comments
      const todoMatches = content.match(/\/\/(.*?)(TODO|FIXME|XXX|HACK)(.*?)$/gm);
      if (todoMatches) {
        this.log('warning', `${todoMatches.length} TODO/FIXME comments found in ${relativePath}`);
      }

      // Check for hardcoded URLs
      const urlMatches = content.match(/https?:\/\/(localhost|127\.0\.0\.1)/g);
      if (urlMatches) {
        this.log('warning', `Hardcoded localhost URLs found in ${relativePath}`);
      }

      // Check for DevUserSwitcher usage
      if (content.includes('DevUserSwitcher') && !content.includes('process.env.NODE_ENV')) {
        this.log('error', `DevUserSwitcher without environment check in ${relativePath}`);
      }

    } catch (error) {
      this.log('warning', `Could not check file ${filePath}: ${error.message}`);
    }
  }

  async checkBuildOutput() {
    this.log('title', 'Checking Build Output...');

    try {
      const distPath = path.join(projectRoot, 'dist');
      
      try {
        await fs.access(distPath);
        this.log('info', 'Build output directory exists');

        // Check build size
        const buildSize = await this.getDirectorySize(distPath);
        const buildSizeMB = (buildSize / 1024 / 1024).toFixed(2);
        
        if (buildSize > 10 * 1024 * 1024) { // > 10MB
          this.log('warning', `Build size is large: ${buildSizeMB} MB`);
        } else {
          this.log('info', `Build size: ${buildSizeMB} MB`);
        }

        // Check for source maps in production
        const files = await fs.readdir(distPath, { recursive: true });
        const sourceMapFiles = files.filter(file => file.endsWith('.map'));
        
        if (sourceMapFiles.length > 0) {
          this.log('warning', `${sourceMapFiles.length} source map files found in build`);
        } else {
          this.log('info', 'No source maps in production build');
        }

        // Check for chunk splitting
        const jsFiles = files.filter(file => typeof file === 'string' && file.endsWith('.js'));
        if (jsFiles.length > 3) {
          this.log('info', `Code splitting working: ${jsFiles.length} JS chunks`);
        } else {
          this.log('warning', 'Limited code splitting detected');
        }

      } catch (error) {
        this.log('warning', 'Build output not found. Run "npm run build" first.');
      }

    } catch (error) {
      this.log('error', `Build output check failed: ${error.message}`);
    }
  }

  async checkDependencies() {
    this.log('title', 'Checking Dependencies...');

    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      // Check for development dependencies that might be included in production
      const devDeps = Object.keys(packageJson.devDependencies || {});
      const deps = Object.keys(packageJson.dependencies || {});

      // Check for large dependencies
      const largeDependencies = [
        '@types/',
        'eslint',
        'vite',
        '@vitejs/',
        'typescript'
      ];

      for (const dep of deps) {
        if (largeDependencies.some(large => dep.includes(large))) {
          this.log('warning', `Development dependency "${dep}" in production dependencies`);
        }
      }

      this.log('info', `${deps.length} production dependencies, ${devDeps.length} development dependencies`);

    } catch (error) {
      this.log('error', `Dependency check failed: ${error.message}`);
    }
  }

  async checkSecurityConfiguration() {
    this.log('title', 'Checking Security Configuration...');

    try {
      // Check vite.config.ts
      const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
      const viteConfig = await fs.readFile(viteConfigPath, 'utf8');

      if (viteConfig.includes('sourcemap: false') || viteConfig.includes('VITE_ENABLE_SOURCE_MAPS')) {
        this.log('info', 'Source maps properly configured');
      } else {
        this.log('warning', 'Source maps configuration not found');
      }

      if (viteConfig.includes('drop: mode === \'production\'')) {
        this.log('info', 'Console removal configured for production');
      } else {
        this.log('warning', 'Console removal not configured');
      }

    } catch (error) {
      this.log('error', `Security configuration check failed: ${error.message}`);
    }
  }

  async getDirectorySize(dirPath) {
    let size = 0;
    try {
      const items = await fs.readdir(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          size += await this.getDirectorySize(itemPath);
        } else {
          size += stat.size;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return size;
  }

  async runAllChecks() {
    console.log('🚀 Starting Production Readiness Check...\n');

    await this.checkEnvironmentFiles();
    console.log('');

    await this.checkSourceCode();
    console.log('');

    await this.checkBuildOutput();
    console.log('');

    await this.checkDependencies();
    console.log('');

    await this.checkSecurityConfiguration();
    console.log('');

    this.printSummary();
  }

  printSummary() {
    console.log('📊 Production Readiness Summary');
    console.log('='.repeat(50));
    
    if (this.errors.length > 0) {
      console.log(`❌ Errors: ${this.errors.length}`);
      this.errors.forEach(error => console.log(`   • ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${this.warnings.length}`);
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
      console.log('');
    }

    console.log(`✅ Checks Passed: ${this.info.length}`);
    console.log('');

    if (this.errors.length === 0) {
      if (this.warnings.length === 0) {
        console.log('🎉 Frontend is production ready!');
      } else {
        console.log('✅ Frontend is mostly production ready with some warnings to review.');
      }
    } else {
      console.log('❌ Frontend has critical issues that must be fixed before production deployment.');
      process.exit(1);
    }
  }
}

// Run the checker
const checker = new ProductionChecker();
checker.runAllChecks().catch(console.error);