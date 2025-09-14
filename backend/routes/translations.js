const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Translation utilities for parsing CSV data
const parseCSV = (csvData) => {
  const lines = csvData.trim().split('\n');
  const options = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    
    // Handle CSV parsing with quoted values that may contain commas
    const values = parseCSVLine(line);
    
    if (values.length >= 4) {
      options.push({
        english: values[0],
        afrikaans: values[1],
        isiXhosa: values[2],
        isiZulu: values[3]
      });
    }
  }

  return options;
};

// Helper function to parse CSV line handling quoted values
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
};

// Generic translation function
const translateOption = (englishText, targetLanguage, options) => {
  const option = options.find(opt => opt.english === englishText);
  
  if (!option) return englishText;

  switch (targetLanguage.toLowerCase()) {
    case 'afrikaans':
      return option.afrikaans;
    case 'isixhosa':
      return option.isiXhosa;
    case 'isizulu':
      return option.isiZulu;
    default:
      return englishText;
  }
};

// Hardcoded translations for static words
const getStaticTranslations = () => {
  return {
    take: {
      english: 'take',
      afrikaans: 'vat',
      isiXhosa: 'thabatha',
      isiZulu: 'thatha'
    },
    precautionsHeader: {
      english: 'Precautions',
      afrikaans: 'Voorsorgmaatreëls',
      isiXhosa: 'Ukulumkela',
      isiZulu: 'Ukuqaphela'
    }
  };
};

// Cache for CSV data to avoid repeated file reads
let csvCache = {};

// Helper function to read and cache CSV data
const getCsvData = async (type) => {
  if (csvCache[type]) {
    return csvCache[type];
  }

  const csvPath = path.join(__dirname, '../../translations_db', `${type}.csv`);
  
  try {
    const csvData = await fs.readFile(csvPath, 'utf8');
    const parsedData = parseCSV(csvData);
    csvCache[type] = parsedData;
    return parsedData;
  } catch (error) {
    console.error(`Error reading ${type} CSV:`, error);
    throw new Error(`Could not load ${type} translation data`);
  }
};

// Route to get all translation options for a specific type
router.get('/:type/options', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['Dosage', 'Frequency', 'Intervals', 'Time_of_Day', 'Precautions'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid translation type. Valid types are: ${validTypes.join(', ')}`
      });
    }

    const options = await getCsvData(type);
    
    res.json({
      success: true,
      data: {
        type,
        options,
        englishOptions: options.map(option => option.english)
      }
    });
  } catch (error) {
    console.error('Error fetching translation options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translation options'
    });
  }
});

// Route to get all translation types and their options
router.get('/options', async (req, res) => {
  try {
    const types = ['Dosage', 'Frequency', 'Intervals', 'Time_of_Day', 'Precautions'];
    const allOptions = {};

    for (const type of types) {
      try {
        const options = await getCsvData(type);
        allOptions[type.toLowerCase()] = {
          options,
          englishOptions: options.map(option => option.english)
        };
      } catch (error) {
        console.error(`Error loading ${type}:`, error);
        allOptions[type.toLowerCase()] = {
          options: [],
          englishOptions: []
        };
      }
    }

    // Add static translations
    allOptions.static = getStaticTranslations();

    res.json({
      success: true,
      data: allOptions
    });
  } catch (error) {
    console.error('Error fetching all translation options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch translation options'
    });
  }
});

// Route to translate specific text
router.post('/translate', async (req, res) => {
  try {
    const { text, type, targetLanguage } = req.body;

    if (!text || !type || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: text, type, and targetLanguage'
      });
    }

    // Handle static translations
    if (type === 'static') {
      const staticTranslations = getStaticTranslations();
      if (staticTranslations[text]) {
        const translation = staticTranslations[text][targetLanguage.toLowerCase()] || text;
        return res.json({
          success: true,
          data: {
            originalText: text,
            translatedText: translation,
            targetLanguage
          }
        });
      }
      
      return res.json({
        success: true,
        data: {
          originalText: text,
          translatedText: text,
          targetLanguage
        }
      });
    }

    // Handle CSV-based translations
    const validTypes = ['Dosage', 'Frequency', 'Intervals', 'Time_of_Day', 'Precautions'];
    const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid translation type. Valid types are: ${validTypes.join(', ')}, static`
      });
    }

    const options = await getCsvData(normalizedType);
    const translatedText = translateOption(text, targetLanguage, options);

    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        targetLanguage
      }
    });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate text'
    });
  }
});

// Route to translate multiple texts
router.post('/translate/batch', async (req, res) => {
  try {
    const { translations, targetLanguage } = req.body;

    if (!translations || !Array.isArray(translations) || !targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: translations (array) and targetLanguage'
      });
    }

    const results = [];
    const staticTranslations = getStaticTranslations();

    for (const item of translations) {
      const { text, type } = item;
      
      if (!text || !type) {
        results.push({
          originalText: text || '',
          translatedText: text || '',
          targetLanguage,
          error: 'Missing text or type'
        });
        continue;
      }

      try {
        // Handle static translations
        if (type === 'static') {
          const translation = staticTranslations[text] ? 
            (staticTranslations[text][targetLanguage.toLowerCase()] || text) : text;
          
          results.push({
            originalText: text,
            translatedText: translation,
            targetLanguage
          });
          continue;
        }

        // Handle CSV-based translations
        const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        const validTypes = ['Dosage', 'Frequency', 'Intervals', 'Time_of_Day', 'Precautions'];
        
        if (!validTypes.includes(normalizedType)) {
          results.push({
            originalText: text,
            translatedText: text,
            targetLanguage,
            error: 'Invalid type'
          });
          continue;
        }

        const options = await getCsvData(normalizedType);
        const translatedText = translateOption(text, targetLanguage, options);

        results.push({
          originalText: text,
          translatedText,
          targetLanguage
        });
      } catch (error) {
        console.error(`Error translating ${text}:`, error);
        results.push({
          originalText: text,
          translatedText: text,
          targetLanguage,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in batch translation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform batch translation'
    });
  }
});

// Route to clear translation cache (useful for development)
router.post('/cache/clear', (req, res) => {
  csvCache = {};
  res.json({
    success: true,
    message: 'Translation cache cleared'
  });
});

module.exports = router;
