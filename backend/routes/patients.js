const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../config/database');
const router = express.Router();

// Validation middleware
const validatePatient = [
  body('initials')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Initials must be between 1 and 10 characters'),
  body('surname')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Surname must be between 1 and 100 characters'),
  body('address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Address is required'),
  body('cellNumber')
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Cell number must contain only digits, spaces, hyphens, plus signs, and parentheses'),
  body('homeLanguage')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Home language is required and must be less than 50 characters')
];

// GET /api/patients - Get all patients or search patients
router.get('/', [
  query('search').optional().trim(),
  query('initials').optional().trim(),
  query('surname').optional().trim(),
  query('address').optional().trim(),
  query('cellNumber').optional().trim(),
  query('homeLanguage').optional().trim(),
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
      search,
      initials,
      surname,
      address,
      cellNumber,
      homeLanguage,
      limit = 50,
      offset = 0
    } = req.query;

    let query = 'SELECT * FROM patients WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Build dynamic WHERE clause based on provided filters
    if (search) {
      paramCount++;
      query += ` AND (
        initials ILIKE $${paramCount} OR 
        surname ILIKE $${paramCount} OR 
        address ILIKE $${paramCount} OR 
        cell_number ILIKE $${paramCount} OR 
        home_language ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    if (initials) {
      paramCount++;
      query += ` AND initials ILIKE $${paramCount}`;
      params.push(`%${initials}%`);
    }

    if (surname) {
      paramCount++;
      query += ` AND surname ILIKE $${paramCount}`;
      params.push(`%${surname}%`);
    }

    if (address) {
      paramCount++;
      query += ` AND address ILIKE $${paramCount}`;
      params.push(`%${address}%`);
    }

    if (cellNumber) {
      paramCount++;
      query += ` AND cell_number ILIKE $${paramCount}`;
      params.push(`%${cellNumber}%`);
    }

    if (homeLanguage) {
      paramCount++;
      query += ` AND home_language ILIKE $${paramCount}`;
      params.push(`%${homeLanguage}%`);
    }

    // Add ordering and pagination
    query += ' ORDER BY surname, initials';
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM patients WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (
        initials ILIKE $${countParamCount} OR 
        surname ILIKE $${countParamCount} OR 
        address ILIKE $${countParamCount} OR 
        cell_number ILIKE $${countParamCount} OR 
        home_language ILIKE $${countParamCount}
      )`;
      countParams.push(`%${search}%`);
    }

    if (initials) {
      countParamCount++;
      countQuery += ` AND initials ILIKE $${countParamCount}`;
      countParams.push(`%${initials}%`);
    }

    if (surname) {
      countParamCount++;
      countQuery += ` AND surname ILIKE $${countParamCount}`;
      countParams.push(`%${surname}%`);
    }

    if (address) {
      countParamCount++;
      countQuery += ` AND address ILIKE $${countParamCount}`;
      countParams.push(`%${address}%`);
    }

    if (cellNumber) {
      countParamCount++;
      countQuery += ` AND cell_number ILIKE $${countParamCount}`;
      countParams.push(`%${cellNumber}%`);
    }

    if (homeLanguage) {
      countParamCount++;
      countQuery += ` AND home_language ILIKE $${countParamCount}`;
      countParams.push(`%${homeLanguage}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Transform database fields to match frontend expectations
    const patients = result.rows.map(patient => ({
      id: patient.id,
      initials: patient.initials,
      surname: patient.surname,
      address: patient.address,
      cellNumber: patient.cell_number,
      homeLanguage: patient.home_language,
      createdAt: patient.created_at,
      updatedAt: patient.updated_at
    }));

    res.json({
      success: true,
      data: patients,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/patients/:id - Get a specific patient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    const patient = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: patient.id,
        initials: patient.initials,
        surname: patient.surname,
        address: patient.address,
        cellNumber: patient.cell_number,
        homeLanguage: patient.home_language,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// POST /api/patients - Create a new patient
router.post('/', validatePatient, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { initials, surname, address, cellNumber, homeLanguage } = req.body;

    // Check if a patient with the same details already exists
    const existingPatient = await db.query(
      'SELECT id FROM patients WHERE initials = $1 AND surname = $2 AND cell_number = $3',
      [initials, surname, cellNumber]
    );

    if (existingPatient.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A patient with these initials, surname, and cell number already exists'
      });
    }

    const result = await db.query(
      'INSERT INTO patients (initials, surname, address, cell_number, home_language) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [initials, surname, address, cellNumber, homeLanguage]
    );

    const patient = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        id: patient.id,
        initials: patient.initials,
        surname: patient.surname,
        address: patient.address,
        cellNumber: patient.cell_number,
        homeLanguage: patient.home_language,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// PUT /api/patients/:id - Update a patient
router.put('/:id', validatePatient, async (req, res) => {
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
    const { initials, surname, address, cellNumber, homeLanguage } = req.body;

    // Check if patient exists
    const existingPatient = await db.query('SELECT id FROM patients WHERE id = $1', [id]);
    
    if (existingPatient.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    // Check if another patient with the same details already exists (excluding current patient)
    const duplicatePatient = await db.query(
      'SELECT id FROM patients WHERE initials = $1 AND surname = $2 AND cell_number = $3 AND id != $4',
      [initials, surname, cellNumber, id]
    );

    if (duplicatePatient.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Another patient with these initials, surname, and cell number already exists'
      });
    }

    const result = await db.query(
      'UPDATE patients SET initials = $1, surname = $2, address = $3, cell_number = $4, home_language = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [initials, surname, address, cellNumber, homeLanguage, id]
    );

    const patient = result.rows[0];

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        id: patient.id,
        initials: patient.initials,
        surname: patient.surname,
        address: patient.address,
        cellNumber: patient.cell_number,
        homeLanguage: patient.home_language,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// DELETE /api/patients/:id - Delete a patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
