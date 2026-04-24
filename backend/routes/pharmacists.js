const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const router = express.Router();

// Get all pharmacists
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, surname, p_number, created_at, updated_at
      FROM pharmacists 
      ORDER BY surname, name
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        surname: row.surname,
        pNumber: row.p_number,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching pharmacists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacists',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get pharmacist by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT id, name, surname, p_number, created_at, updated_at
      FROM pharmacists 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    const pharmacist = result.rows[0];
    res.json({
      success: true,
      data: {
        id: pharmacist.id,
        name: pharmacist.name,
        surname: pharmacist.surname,
        pNumber: pharmacist.p_number,
        createdAt: pharmacist.created_at,
        updatedAt: pharmacist.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching pharmacist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacist',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new pharmacist
router.post('/',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('surname')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Surname must be between 1 and 100 characters'),
    body('pNumber')
      .trim()
      .matches(/^P-\d+$/)
      .withMessage('P-Number must be in format P-XXXXX'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { name, surname, pNumber, password } = req.body;

      // Check if P-number already exists
      const existingPharmacist = await pool.query(
        'SELECT id FROM pharmacists WHERE p_number = $1',
        [pNumber]
      );

      if (existingPharmacist.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'P-number already exists'
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new pharmacist
      const result = await pool.query(`
        INSERT INTO pharmacists (name, surname, p_number, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, surname, p_number, created_at, updated_at
      `, [name, surname, pNumber, passwordHash]);

      const newPharmacist = result.rows[0];
      res.status(201).json({
        success: true,
        message: 'Pharmacist created successfully',
        data: {
          id: newPharmacist.id,
          name: newPharmacist.name,
          surname: newPharmacist.surname,
          pNumber: newPharmacist.p_number,
          createdAt: newPharmacist.created_at,
          updatedAt: newPharmacist.updated_at
        }
      });
    } catch (error) {
      console.error('Error creating pharmacist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create pharmacist',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Update pharmacist
router.put('/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters'),
    body('surname')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Surname must be between 1 and 100 characters'),
    body('pNumber')
      .optional()
      .trim()
      .matches(/^P-\d+$/)
      .withMessage('P-Number must be in format P-XXXXX'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  async (req, res) => {
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
      const { name, surname, pNumber, password } = req.body;

      // Check if pharmacist exists
      const existingPharmacist = await pool.query(
        'SELECT id FROM pharmacists WHERE id = $1',
        [id]
      );

      if (existingPharmacist.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pharmacist not found'
        });
      }

      // Check if new P-number conflicts with existing ones (if pNumber is being updated)
      if (pNumber) {
        const conflictingPharmacist = await pool.query(
          'SELECT id FROM pharmacists WHERE p_number = $1 AND id != $2',
          [pNumber, id]
        );

        if (conflictingPharmacist.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'P-number already exists'
          });
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCounter}`);
        updateValues.push(name);
        paramCounter++;
      }

      if (surname !== undefined) {
        updateFields.push(`surname = $${paramCounter}`);
        updateValues.push(surname);
        paramCounter++;
      }

      if (pNumber !== undefined) {
        updateFields.push(`p_number = $${paramCounter}`);
        updateValues.push(pNumber);
        paramCounter++;
      }

      if (password !== undefined) {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        updateFields.push(`password_hash = $${paramCounter}`);
        updateValues.push(passwordHash);
        paramCounter++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const query = `
        UPDATE pharmacists 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, name, surname, p_number, created_at, updated_at
      `;

      const result = await pool.query(query, updateValues);
      const updatedPharmacist = result.rows[0];

      res.json({
        success: true,
        message: 'Pharmacist updated successfully',
        data: {
          id: updatedPharmacist.id,
          name: updatedPharmacist.name,
          surname: updatedPharmacist.surname,
          pNumber: updatedPharmacist.p_number,
          createdAt: updatedPharmacist.created_at,
          updatedAt: updatedPharmacist.updated_at
        }
      });
    } catch (error) {
      console.error('Error updating pharmacist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update pharmacist',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Delete pharmacist
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if pharmacist exists
    const existingPharmacist = await pool.query(
      'SELECT id FROM pharmacists WHERE id = $1',
      [id]
    );

    if (existingPharmacist.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacist not found'
      });
    }

    // Delete pharmacist
    await pool.query('DELETE FROM pharmacists WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Pharmacist deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pharmacist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pharmacist',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Authenticate pharmacist (for login)
router.post('/auth',
  [
    body('pNumber')
      .trim()
      .notEmpty()
      .withMessage('P-Number is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { pNumber, password } = req.body;

      // Find pharmacist by P-number
      const result = await pool.query(
        'SELECT id, name, surname, p_number, password_hash FROM pharmacists WHERE p_number = $1',
        [pNumber]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid P-number or password'
        });
      }

      const pharmacist = result.rows[0];

      // Compare password
      const passwordValid = await bcrypt.compare(password, pharmacist.password_hash);

      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid P-number or password'
        });
      }

      // Return pharmacist data (without password hash)
      res.json({
        success: true,
        message: 'Authentication successful',
        data: {
          id: pharmacist.id,
          name: pharmacist.name,
          surname: pharmacist.surname,
          pNumber: pharmacist.p_number
        }
      });
    } catch (error) {
      console.error('Error authenticating pharmacist:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;
