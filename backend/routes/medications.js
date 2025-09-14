const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const router = express.Router();

// Validation middleware
const validateMedication = [
  body('patientId')
    .isUUID()
    .withMessage('Patient ID must be a valid UUID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Medication name must be between 1 and 255 characters'),
  body('dosage')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dosage must be between 1 and 100 characters'),
  body('frequency')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Frequency must be between 1 and 100 characters'),
  body('interval')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Interval must be less than 100 characters'),
  body('timeOfDay')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Time of day must be less than 100 characters'),
  body('precautions')
    .optional()
    .isArray()
    .withMessage('Precautions must be an array'),
  body('englishInstructions')
    .optional()
    .trim(),
  body('translatedInstructions')
    .optional()
    .trim(),
  body('targetLanguage')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Target language must be less than 50 characters')
];

// GET /api/medications - Get all medications or medications for a specific patient
router.get('/', [
  query('patientId').optional().isUUID().withMessage('Patient ID must be a valid UUID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      patientId,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        m.*,
        p.initials,
        p.surname,
        p.home_language as patient_home_language
      FROM medications m
      JOIN patients p ON m.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by patient if specified
    if (patientId) {
      paramCount++;
      query += ` AND m.patient_id = $${paramCount}`;
      params.push(patientId);
    }

    // Add ordering and pagination
    query += ' ORDER BY m.prescribed_date DESC, m.created_at DESC';
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM medications m
      JOIN patients p ON m.patient_id = p.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (patientId) {
      countParamCount++;
      countQuery += ` AND m.patient_id = $${countParamCount}`;
      countParams.push(patientId);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Transform database fields to match frontend expectations
    const medications = result.rows.map(medication => ({
      id: medication.id,
      patientId: medication.patient_id,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      interval: medication.interval,
      timeOfDay: medication.time_of_day,
      precautions: medication.precautions || [],
      englishInstructions: medication.english_instructions,
      translatedInstructions: medication.translated_instructions,
      targetLanguage: medication.target_language,
      prescribedDate: medication.prescribed_date,
      createdAt: medication.created_at,
      updatedAt: medication.updated_at,
      patient: {
        initials: medication.initials,
        surname: medication.surname,
        homeLanguage: medication.patient_home_language
      }
    }));

    res.json({
      success: true,
      data: medications,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/medications/:id - Get a specific medication
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        m.*,
        p.initials,
        p.surname,
        p.home_language as patient_home_language
      FROM medications m
      JOIN patients p ON m.patient_id = p.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    const medication = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: medication.id,
        patientId: medication.patient_id,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        interval: medication.interval,
        timeOfDay: medication.time_of_day,
        precautions: medication.precautions || [],
        englishInstructions: medication.english_instructions,
        translatedInstructions: medication.translated_instructions,
        targetLanguage: medication.target_language,
        prescribedDate: medication.prescribed_date,
        createdAt: medication.created_at,
        updatedAt: medication.updated_at,
        patient: {
          initials: medication.initials,
          surname: medication.surname,
          homeLanguage: medication.patient_home_language
        }
      }
    });
  } catch (error) {
    console.error('Error fetching medication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// POST /api/medications - Create a new medication
router.post('/', validateMedication, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { 
      patientId, name, dosage, frequency, interval, timeOfDay, 
      precautions, englishInstructions, translatedInstructions, targetLanguage 
    } = req.body;

    // Verify patient exists
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const result = await db.query(
      `INSERT INTO medications (
        patient_id, name, dosage, frequency, interval, time_of_day, 
        precautions, english_instructions, translated_instructions, target_language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        patientId, name, dosage, frequency, interval, timeOfDay,
        precautions, englishInstructions, translatedInstructions, targetLanguage
      ]
    );

    const medication = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      data: {
        id: medication.id,
        patientId: medication.patient_id,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        interval: medication.interval,
        timeOfDay: medication.time_of_day,
        precautions: medication.precautions || [],
        englishInstructions: medication.english_instructions,
        translatedInstructions: medication.translated_instructions,
        targetLanguage: medication.target_language,
        prescribedDate: medication.prescribed_date,
        createdAt: medication.created_at,
        updatedAt: medication.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// PUT /api/medications/:id - Update a medication
router.put('/:id', validateMedication, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { 
      patientId, name, dosage, frequency, interval, timeOfDay, 
      precautions, englishInstructions, translatedInstructions, targetLanguage 
    } = req.body;

    // Check if medication exists
    const existingMedication = await db.query('SELECT id FROM medications WHERE id = $1', [id]);
    
    if (existingMedication.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    // Verify patient exists
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [patientId]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const result = await db.query(
      `UPDATE medications SET 
        patient_id = $1, name = $2, dosage = $3, frequency = $4, interval = $5, 
        time_of_day = $6, precautions = $7, english_instructions = $8, 
        translated_instructions = $9, target_language = $10, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $11 RETURNING *`,
      [
        patientId, name, dosage, frequency, interval, timeOfDay,
        precautions, englishInstructions, translatedInstructions, targetLanguage, id
      ]
    );

    const medication = result.rows[0];

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: {
        id: medication.id,
        patientId: medication.patient_id,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        interval: medication.interval,
        timeOfDay: medication.time_of_day,
        precautions: medication.precautions || [],
        englishInstructions: medication.english_instructions,
        translatedInstructions: medication.translated_instructions,
        targetLanguage: medication.target_language,
        prescribedDate: medication.prescribed_date,
        createdAt: medication.created_at,
        updatedAt: medication.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// DELETE /api/medications/:id - Delete a medication
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM medications WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }

    res.json({
      success: true,
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
