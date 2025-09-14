const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Helper function to parse CSV data
const parseCSV = (csvData) => {
  const lines = csvData.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const medications = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    
    if (values.length >= headers.length) {
      const medication = {};
      headers.forEach((header, index) => {
        medication[header] = values[index] || '';
      });
      medications.push(medication);
    }
  }

  return medications;
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

// Cache for medication data to avoid repeated file reads
let medicationCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Helper function to read and cache medication data
const getMedicationData = async () => {
  // Check if cache is still valid
  if (medicationCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return medicationCache;
  }

  const csvPath = path.join(__dirname, '../../translations_db/medications.csv');
  
  try {
    const csvData = await fs.readFile(csvPath, 'utf8');
    const medications = parseCSV(csvData);
    
    // Cache the data
    medicationCache = medications;
    cacheTimestamp = Date.now();
    
    return medications;
  } catch (error) {
    console.error('Error reading medications CSV:', error);
    throw new Error('Could not load medication data');
  }
};

// Route to get all medications
router.get('/', async (req, res) => {
  try {
    const medications = await getMedicationData();
    
    res.json({
      success: true,
      data: medications,
      total: medications.length
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medications'
    });
  }
});

// Route to search medications
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 50 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    const medications = await getMedicationData();
    const searchTerm = query.toLowerCase().trim();
    
    // Search in name and searchTerms fields
    const filteredMedications = medications.filter(med => {
      const nameMatch = med.name.toLowerCase().includes(searchTerm);
      const searchTermsMatch = med.searchTerms.toLowerCase().includes(searchTerm);
      return nameMatch || searchTermsMatch;
    });

    // Sort by relevance (exact matches first, then partial matches)
    filteredMedications.sort((a, b) => {
      const aNameExact = a.name.toLowerCase() === searchTerm;
      const bNameExact = b.name.toLowerCase() === searchTerm;
      
      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;
      
      const aNameStarts = a.name.toLowerCase().startsWith(searchTerm);
      const bNameStarts = b.name.toLowerCase().startsWith(searchTerm);
      
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;
      
      return 0;
    });

    // Apply limit
    const limitedResults = filteredMedications.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedResults,
      total: filteredMedications.length,
      limit: parseInt(limit),
      query: query
    });
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search medications'
    });
  }
});

// Route to get medication suggestions (for autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    const medications = await getMedicationData();
    const searchTerm = query.toLowerCase().trim();
    
    // Get medication names that start with the search term
    const suggestions = medications
      .filter(med => med.name.toLowerCase().startsWith(searchTerm))
      .slice(0, parseInt(limit))
      .map(med => ({
        id: med.id,
        name: med.name
      }));

    res.json({
      success: true,
      data: suggestions,
      query: query
    });
  } catch (error) {
    console.error('Error getting medication suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medication suggestions'
    });
  }
});

// Route to get a specific medication by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const medications = await getMedicationData();
    
    const medication = medications.find(med => med.id === id);
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.json({
      success: true,
      data: medication
    });
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication'
    });
  }
});

// Route to clear medication cache (useful for development)
router.post('/cache/clear', (req, res) => {
  medicationCache = null;
  cacheTimestamp = 0;
  res.json({
    success: true,
    message: 'Medication cache cleared'
  });
});

module.exports = router;
