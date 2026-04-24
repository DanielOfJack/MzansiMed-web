const { pool } = require('../config/database');

/**
 * This script normalizes existing medication data to match standardized dropdown options
 */

// Mapping tables for normalization
const FREQUENCY_MAPPINGS = {
  // Normalize various formats to standard CSV options
  'once daily': 'Once a day',
  'once a day': 'Once a day',
  'once per day': 'Once a day',
  'one time daily': 'Once a day',
  'once': 'Once a day',
  
  'twice daily': 'Twice a day',
  'twice a day': 'Twice a day',
  'twice per day': 'Twice a day',
  'two times daily': 'Twice a day',
  'twice': 'Twice a day',
  'bid': 'Twice a day',
  
  'three times daily': 'Three times a day',
  'three times a day': 'Three times a day',
  'three times per day': 'Three times a day',
  'thrice daily': 'Three times a day',
  'tid': 'Three times a day',
  
  'four times daily': 'Four times a day',
  'four times a day': 'Four times a day',
  'four times per day': 'Four times a day',
  'qid': 'Four times a day',
  
  'as needed': 'As needed',
  'prn': 'As needed',
  'as required': 'As needed',
  'when needed': 'As needed'
};

const INTERVAL_MAPPINGS = {
  'every 4 hours': 'Every 4 hours',
  'q4h': 'Every 4 hours',
  'every four hours': 'Every 4 hours',
  
  'every 6 hours': 'Every 6 hours',
  'q6h': 'Every 6 hours',
  'every six hours': 'Every 6 hours',
  
  'every 8 hours': 'Every 8 hours',
  'q8h': 'Every 8 hours',
  'every eight hours': 'Every 8 hours',
  
  'every 12 hours': 'Every 12 hours',
  'q12h': 'Every 12 hours',
  'every twelve hours': 'Every 12 hours'
};

const TIME_OF_DAY_MAPPINGS = {
  'morning': 'Morning',
  'mornings': 'Morning',
  'am': 'Morning',
  'in the morning': 'Morning',
  
  'noon': 'Noon',
  'midday': 'Noon',
  'lunch': 'Noon',
  'afternoon': 'Noon', // Map afternoon to Noon as closest match
  
  'evening': 'Evening',
  'evenings': 'Evening',
  'pm': 'Evening',
  'in the evening': 'Evening',
  
  'night': 'Night',
  'nights': 'Night',
  'bedtime': 'Night',
  'at night': 'Night',
  'before bed': 'Night'
};

const DOSAGE_UNIT_MAPPINGS = {
  // Extract numeric value and unit, then map to standard format
  // e.g., "500mg tablet" -> "1 tablet", "1000mg 2 tablets" -> "2 tablets"
  'tablet': 'tablet',
  'tablets': 'tablets',
  'capsule': 'capsule',
  'capsules': 'capsules',
  'puff': 'puff',
  'puffs': 'puffs',
  'spray': 'spray',
  'sprays': 'sprays',
  'drop': 'drop',
  'drops': 'drops',
  'teaspoon': 'teaspoon',
  'teaspoons': 'teaspoons',
  'sachet': 'sachet',
  'sachets': 'sachets'
};

function normalizeFrequency(frequency) {
  if (!frequency) return null;
  
  const normalized = frequency.toLowerCase().trim();
  return FREQUENCY_MAPPINGS[normalized] || frequency;
}

function normalizeInterval(interval) {
  if (!interval) return null;
  
  const normalized = interval.toLowerCase().trim();
  return INTERVAL_MAPPINGS[normalized] || interval;
}

function normalizeTimeOfDay(timeOfDay) {
  if (!timeOfDay) return null;
  
  // Handle multiple times separated by commas
  const times = timeOfDay.split(',').map(t => t.trim().toLowerCase());
  const normalizedTimes = times.map(time => {
    return TIME_OF_DAY_MAPPINGS[time] || time;
  });
  
  // Remove duplicates and join
  const unique = [...new Set(normalizedTimes)];
  return unique.join(', ');
}

function normalizeDosage(dosage) {
  if (!dosage) return null;
  
  // Try to extract number and unit from dosage string
  // Examples: "500mg tablet", "2 tablets", "1000mg 2 capsules"
  const lowerDosage = dosage.toLowerCase().trim();
  
  // Check for explicit count (e.g., "2 tablets", "half tablet", "1 capsule")
  const countMatches = [
    { pattern: /^(1|one)\s+(tablet|capsule)s?$/i, result: '1 {unit}' },
    { pattern: /^(2|two)\s+(tablet|capsule)s?$/i, result: '2 {unit}s' },
    { pattern: /^(3|three)\s+(tablet|capsule)s?$/i, result: '3 {unit}s' },
    { pattern: /^(half|1\/2)\s+(tablet|capsule)s?$/i, result: 'Half {unit}' },
    { pattern: /^(quarter|1\/4)\s+(tablet|capsule)s?$/i, result: 'Quarter {unit}' },
    { pattern: /^(1|one)\s+puffs?$/i, result: '1 puff' },
    { pattern: /^(2|two)\s+puffs?$/i, result: '2 puffs' },
    { pattern: /^(3|three)\s+puffs?$/i, result: '3 puffs' },
    { pattern: /^(4|four)\s+puffs?$/i, result: '4 puffs' },
    { pattern: /^(1|one)\s+sprays?$/i, result: '1 spray' },
    { pattern: /^(2|two)\s+sprays?$/i, result: '2 sprays' },
    { pattern: /^(1|one)\s+teaspoons?$/i, result: '1 teaspoon' },
    { pattern: /^(2|two)\s+teaspoons?$/i, result: '2 teaspoons' }
  ];
  
  for (const { pattern, result } of countMatches) {
    const match = lowerDosage.match(pattern);
    if (match) {
      const unit = match[2];
      return result.replace('{unit}', unit);
    }
  }
  
  // Check for dosage with mg/mcg (e.g., "500mg tablet", "10mg 2 tablets")
  const mgPattern = /(\d+\.?\d*)\s*(mg|mcg|g|ml)\s+(\d+)?\s*(tablet|capsule|puff|spray|drop|teaspoon|sachet)s?/i;
  const mgMatch = lowerDosage.match(mgPattern);
  
  if (mgMatch) {
    const count = mgMatch[3] || '1';
    const unit = mgMatch[4];
    
    if (count === '1') {
      return `1 ${unit}`;
    } else if (count === '2') {
      return `2 ${unit}s`;
    } else if (count === '3') {
      return `3 ${unit}s`;
    }
  }
  
  // Check for simple pattern like "500mg tablet" (no count means 1)
  const simplePattern = /(\d+\.?\d*)\s*(mg|mcg|g|ml)\s+(tablet|capsule|puff|spray|drop|teaspoon|sachet)s?$/i;
  const simpleMatch = lowerDosage.match(simplePattern);
  
  if (simpleMatch) {
    const unit = simpleMatch[3];
    return `1 ${unit}`;
  }
  
  // If nothing matches, return original
  return dosage;
}

async function normalizeMedicationData() {
  try {
    console.log('Starting medication data normalization...\n');
    
    // Get all medications
    const result = await pool.query('SELECT * FROM medications ORDER BY created_at DESC');
    const medications = result.rows;
    
    console.log(`Found ${medications.length} medications to process\n`);
    
    let updatedCount = 0;
    const changes = [];
    
    for (const med of medications) {
      const updates = {};
      let hasChanges = false;
      
      // Normalize dosage
      const normalizedDosage = normalizeDosage(med.dosage);
      if (normalizedDosage !== med.dosage) {
        updates.dosage = normalizedDosage;
        hasChanges = true;
        changes.push({
          id: med.id,
          field: 'dosage',
          old: med.dosage,
          new: normalizedDosage
        });
      }
      
      // Normalize frequency
      const normalizedFrequency = normalizeFrequency(med.frequency);
      if (normalizedFrequency !== med.frequency) {
        updates.frequency = normalizedFrequency;
        hasChanges = true;
        changes.push({
          id: med.id,
          field: 'frequency',
          old: med.frequency,
          new: normalizedFrequency
        });
      }
      
      // Normalize interval
      if (med.interval) {
        const normalizedInterval = normalizeInterval(med.interval);
        if (normalizedInterval !== med.interval) {
          updates.interval = normalizedInterval;
          hasChanges = true;
          changes.push({
            id: med.id,
            field: 'interval',
            old: med.interval,
            new: normalizedInterval
          });
        }
      }
      
      // Normalize time of day
      if (med.time_of_day) {
        const normalizedTimeOfDay = normalizeTimeOfDay(med.time_of_day);
        if (normalizedTimeOfDay !== med.time_of_day) {
          updates.time_of_day = normalizedTimeOfDay;
          hasChanges = true;
          changes.push({
            id: med.id,
            field: 'time_of_day',
            old: med.time_of_day,
            new: normalizedTimeOfDay
          });
        }
      }
      
      // Update the database if there are changes
      if (hasChanges) {
        const updateFields = Object.keys(updates);
        const updateValues = Object.values(updates);
        const setClauses = updateFields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
        
        await pool.query(
          `UPDATE medications SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $${updateFields.length + 1}`,
          [...updateValues, med.id]
        );
        
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Normalization complete!`);
    console.log(`   ${updatedCount} medications updated`);
    console.log(`   ${medications.length - updatedCount} medications unchanged\n`);
    
    if (changes.length > 0) {
      console.log('Changes made:');
      console.log('─'.repeat(80));
      
      for (const change of changes) {
        console.log(`Field: ${change.field}`);
        console.log(`  OLD: "${change.old}"`);
        console.log(`  NEW: "${change.new}"`);
        console.log('─'.repeat(80));
      }
    }
    
  } catch (error) {
    console.error('Error normalizing medication data:', error);
    throw error;
  }
}

// Run normalization if this file is executed directly
if (require.main === module) {
  normalizeMedicationData()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Normalization failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  normalizeMedicationData,
  normalizeFrequency,
  normalizeInterval,
  normalizeTimeOfDay,
  normalizeDosage
};

