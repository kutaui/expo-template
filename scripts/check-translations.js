/* eslint-disable */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babelParser = require('@babel/parser');
const BASE_DIR = path.resolve(__dirname, '../src');

require('dotenv').config();

function extractKeysWithScope(code) {
  const keys = [];
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const scopes = new Map();

  function traverseNode(node) {
    if (!node) return;
    
    // Look for useLocale hook calls with scope parameter
    if (
      node.type === 'VariableDeclarator' &&
      node.init?.type === 'CallExpression' &&
      node.init.callee?.name === 'useLocale' &&
      node.init.arguments[0]?.type === 'StringLiteral'
    ) {
      const scope = node.init.arguments[0].value;
      const tFunction = node.id.properties?.find((p) => p.key.name === 't')?.value.name;

      if (tFunction) {
        scopes.set(tFunction, scope);
      }
    }

    // Look for t function calls within the scope
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      scopes.has(node.callee.name) &&
      node.arguments[0]?.type === 'StringLiteral'
    ) {
      const scope = scopes.get(node.callee.name);
      const key = node.arguments[0].value;

      if (scope) {
        keys.push(`${scope}.${key}`);
      } else {
        keys.push(key);
      }
    }

    Object.values(node).forEach((child) => {
      if (typeof child === 'object') {
        traverseNode(child);
      }
    });
  }

  traverseNode(ast);
  return keys;
}

function findTranslationKeys(dir) {
  const files = glob.sync(`${dir}/**/*.{js,jsx,ts,tsx}`);
  const keys = new Set();

  files.forEach((file) => {
    try {
      const code = fs.readFileSync(file, 'utf-8');
      const extractedKeys = extractKeysWithScope(code);
      extractedKeys.forEach((key) => keys.add(key));
    } catch (error) {
      console.warn(`Error parsing file ${file}:`, error.message);
    }
  });

  return keys;
}

function flattenObject(obj, parentKey = '', result = {}) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

function compareKeys(extractedKeys, translations) {
  const missingKeys = [];
  const flatTranslations = flattenObject(translations);

  extractedKeys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(flatTranslations, key)) {
      missingKeys.push(key);
    }
  });

  return missingKeys;
}

function getAllTranslationFiles() {
  const translationsDir = path.join(BASE_DIR, 'assets/locale');
  try {
    const files = fs.readdirSync(translationsDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));
    return jsonFiles.map((file) => path.join(translationsDir, file));
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

async function run() {
  const projectDir = BASE_DIR;
  const files = getAllTranslationFiles();
  const allMissingKeys = [];

  try {
    await Promise.all(
      files.map(async (file) => {
        const translationFile = path.resolve(file);
        const extractedKeys = findTranslationKeys(projectDir);
        const translations = JSON.parse(fs.readFileSync(translationFile, 'utf-8'));

        const missingKeys = compareKeys(extractedKeys, translations);
        const language = path.basename(file, '.json');

        if (missingKeys.length > 0) {
          console.log(`Missing keys for ${language}:`, JSON.stringify(missingKeys, null, 2));
          allMissingKeys.push({ language, keys: missingKeys });
        } else {
          console.log(`No missing keys found for ${language}`);
        }
      })
    );

    if (allMissingKeys.length > 0) {
      throw new Error('Missing translation keys found in one or more languages.');
    } else {
      console.log('✅ All translation keys are present in all languages.');
    }
  } catch (error) {
    console.error('Translation validation failed:', error);
    process.exit(1);
  }
}

run();