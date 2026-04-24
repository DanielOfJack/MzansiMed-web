const { pool } = require('../config/database');

const createTables = async () => {
  try {
    // Check if we need to migrate the patients table
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients' AND column_name = 'street_address'
    `);
    
    if (tableInfo.rows.length === 0) {
      // Table exists but needs migration
      console.log('Migrating patients table to new address structure...');
      
      // Add new address columns
      await pool.query(`
        ALTER TABLE patients 
        ADD COLUMN IF NOT EXISTS street_address VARCHAR(255),
        ADD COLUMN IF NOT EXISTS suburb VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10)
      `);
      
      // Migrate existing address data
      const existingPatients = await pool.query('SELECT id, address FROM patients WHERE address IS NOT NULL');
      
      for (const patient of existingPatients.rows) {
        const addressParts = patient.address.split(',').map(part => part.trim());
        const streetAddress = addressParts[0] || '';
        const suburb = addressParts[1] || '';
        const city = addressParts[2] || '';
        const postalCode = addressParts[3] || '';
        
        await pool.query(`
          UPDATE patients 
          SET street_address = $1, suburb = $2, city = $3, postal_code = $4 
          WHERE id = $5
        `, [streetAddress, suburb, city, postalCode, patient.id]);
      }
      
      // Make the new columns NOT NULL after migration
      await pool.query(`
        ALTER TABLE patients 
        ALTER COLUMN street_address SET NOT NULL,
        ALTER COLUMN suburb SET NOT NULL,
        ALTER COLUMN city SET NOT NULL,
        ALTER COLUMN postal_code SET NOT NULL
      `);
      
      // Drop the old address column
      await pool.query(`ALTER TABLE patients DROP COLUMN IF EXISTS address`);
      
      console.log('Migration completed successfully');
    } else {
      // Create new table with new structure
      await pool.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          initials VARCHAR(10) NOT NULL,
          surname VARCHAR(100) NOT NULL,
          street_address VARCHAR(255) NOT NULL,
          suburb VARCHAR(100) NOT NULL,
          city VARCHAR(100) NOT NULL,
          postal_code VARCHAR(10) NOT NULL,
          cell_number VARCHAR(20) NOT NULL,
          home_language VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Create medications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100) NOT NULL,
        frequency VARCHAR(100) NOT NULL,
        interval VARCHAR(100),
        time_of_day VARCHAR(100),
        precautions TEXT[],
        english_instructions TEXT,
        translated_instructions TEXT,
        target_language VARCHAR(50),
        prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create pharmacists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pharmacists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        p_number VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create an index on surname for faster searching
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_surname ON patients(surname)
    `);

    // Create an index on cell_number for faster searching
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_cell_number ON patients(cell_number)
    `);

    // Create indexes for medications
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_medications_prescribed_date ON medications(prescribed_date)
    `);

    // Create index for pharmacists
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_pharmacists_p_number ON pharmacists(p_number)
    `);

    console.log('Database tables created successfully');

    // Insert sample data if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM patients');
    if (parseInt(rows[0].count) === 0) {
      await insertSampleData();
    }

    // Insert sample medications if table is empty
    const medicationRows = await pool.query('SELECT COUNT(*) FROM medications');
    if (parseInt(medicationRows.rows[0].count) === 0) {
      await insertSampleMedications();
    }

    // Insert sample pharmacists if table is empty
    const pharmacistRows = await pool.query('SELECT COUNT(*) FROM pharmacists');
    if (parseInt(pharmacistRows.rows[0].count) === 0) {
      await insertSamplePharmacists();
    }

  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

const insertSampleData = async () => {
  const samplePatients = [
    { initials: 'J.D.', surname: 'Smith', streetAddress: '123 Main Street', suburb: 'City Bowl', city: 'Cape Town', postalCode: '8001', cellNumber: '082 123 4567', homeLanguage: 'Afrikaans' },
    { initials: 'M.P.', surname: 'Johnson', streetAddress: '456 Oak Avenue', suburb: 'Sandton', city: 'Johannesburg', postalCode: '2000', cellNumber: '083 234 5678', homeLanguage: 'isiZulu' },
    { initials: 'S.K.', surname: 'Williams', streetAddress: '789 Pine Road', suburb: 'Berea', city: 'Durban', postalCode: '4001', cellNumber: '084 345 6789', homeLanguage: 'isiXhosa' },
    { initials: 'A.B.', surname: 'Brown', streetAddress: '321 Elm Street', suburb: 'Hatfield', city: 'Pretoria', postalCode: '0001', cellNumber: '085 456 7890', homeLanguage: 'Afrikaans' },
    { initials: 'L.M.', surname: 'Davis', streetAddress: '654 Maple Drive', suburb: 'Summerstrand', city: 'Port Elizabeth', postalCode: '6000', cellNumber: '086 567 8901', homeLanguage: 'isiZulu' },
    { initials: 'R.T.', surname: 'Wilson', streetAddress: '987 Cedar Lane', suburb: 'Universitas', city: 'Bloemfontein', postalCode: '9300', cellNumber: '087 678 9012', homeLanguage: 'Afrikaans' },
    { initials: 'N.F.', surname: 'Garcia', streetAddress: '147 Birch Court', suburb: 'Beacon Bay', city: 'East London', postalCode: '5201', cellNumber: '088 789 0123', homeLanguage: 'isiXhosa' },
    { initials: 'C.H.', surname: 'Martinez', streetAddress: '258 Walnut Place', suburb: 'Hadison Park', city: 'Kimberley', postalCode: '8300', cellNumber: '089 890 1234', homeLanguage: 'isiZulu' },
    { initials: 'D.R.', surname: 'Anderson', streetAddress: '369 Spruce Road', suburb: 'Bendor', city: 'Polokwane', postalCode: '0700', cellNumber: '081 901 2345', homeLanguage: 'Afrikaans' },
    { initials: 'T.L.', surname: 'Thompson', streetAddress: '741 Ash Street', suburb: 'Riverside', city: 'Nelspruit', postalCode: '1200', cellNumber: '082 012 3456', homeLanguage: 'isiXhosa' }
  ];

  try {
    for (const patient of samplePatients) {
      await pool.query(
        'INSERT INTO patients (initials, surname, street_address, suburb, city, postal_code, cell_number, home_language) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [patient.initials, patient.surname, patient.streetAddress, patient.suburb, patient.city, patient.postalCode, patient.cellNumber, patient.homeLanguage]
      );
    }
    console.log('Sample patient data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
};

const insertSampleMedications = async () => {
  try {
    // First, get patient IDs for linking medications
    const patientsResult = await pool.query('SELECT id, initials, surname FROM patients ORDER BY surname');
    const patients = patientsResult.rows;

    if (patients.length === 0) {
      console.log('No patients found, skipping medication insertion');
      return;
    }

    const sampleMedications = [
      // J.D. Smith medications (Afrikaans patient)
      {
        patientId: patients.find(p => p.initials === 'J.D.' && p.surname === 'Smith')?.id,
        name: 'Paracetamol, oral',
        dosage: '500mg tablet',
        frequency: 'Three times daily',
        interval: 'Every 8 hours',
        timeOfDay: 'morning, afternoon, evening',
        precautions: ['Take with food', 'Take with plenty of water'],
        englishInstructions: `Paracetamol, oral\nTake 500mg tablet three times daily every 8 hours.\nmorning 🌅, afternoon ☀️, evening 🌆\n\nPrecautions\n• Take with food\n• Take with plenty of water`,
        translatedInstructions: `Paracetamol, oral\nNeem 500mg tablet drie keer per dag elke 8 uur.\noggend 🌅, middag ☀️, aand 🌆\n\nVoorsorgmaatreëls\n• Neem saam met kos\n• Neem saam met baie water`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'J.D.' && p.surname === 'Smith')?.id,
        name: 'Amoxicillin, oral',
        dosage: '500mg capsule',
        frequency: 'Three times daily',
        interval: 'Every 8 hours',
        timeOfDay: 'morning, afternoon, evening',
        precautions: ['Take on empty stomach', 'Complete full course', 'May cause diarrhea'],
        englishInstructions: `Amoxicillin, oral\nTake 500mg capsule three times daily every 8 hours.\nmorning 🌅, afternoon ☀️, evening 🌆\n\nPrecautions\n• Take on empty stomach\n• Complete full course\n• May cause diarrhea`,
        translatedInstructions: `Amoxicillin, oral\nNeem 500mg kapsule drie keer per dag elke 8 uur.\noggend 🌅, middag ☀️, aand 🌆\n\nVoorsorgmaatreëls\n• Neem op leë maag\n• Voltooi volle kursus\n• Kan diarree veroorsaak`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'J.D.' && p.surname === 'Smith')?.id,
        name: 'Cetirizine, oral',
        dosage: '10mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'evening',
        precautions: ['May cause drowsiness', 'Avoid alcohol', 'Take with or without food'],
        englishInstructions: `Cetirizine, oral\nTake 10mg tablet once daily every 24 hours.\nevening 🌆\n\nPrecautions\n• May cause drowsiness\n• Avoid alcohol\n• Take with or without food`,
        translatedInstructions: `Cetirizine, oral\nNeem 10mg tablet een keer per dag elke 24 uur.\naand 🌆\n\nVoorsorgmaatreëls\n• Kan slaaperigheid veroorsaak\n• Vermy alkohol\n• Neem met of sonder kos`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
      },
      
      // M.P. Johnson medications (isiZulu patient)
      {
        patientId: patients.find(p => p.initials === 'M.P.' && p.surname === 'Johnson')?.id,
        name: 'Metformin, oral',
        dosage: '850mg tablet',
        frequency: 'Twice daily',
        interval: 'Every 12 hours',
        timeOfDay: 'morning, evening',
        precautions: ['Take with food', 'Monitor blood sugar', 'May cause stomach upset'],
        englishInstructions: `Metformin, oral\nTake 850mg tablet twice daily every 12 hours.\nmorning 🌅, evening 🌆\n\nPrecautions\n• Take with food\n• Monitor blood sugar\n• May cause stomach upset`,
        translatedInstructions: `Metformin, oral\nThatha i-850mg tablet kabili ngosuku every 12 hours.\nekuseni 🌅, kusihlwa 🌆\n\nIzexwayiso\n• Thatha nokudla\n• Qapha ushukela wegazi\n• Kungase kubangele ukuphazamiseka kwesisu`,
        targetLanguage: 'isiZulu',
        prescribedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'M.P.' && p.surname === 'Johnson')?.id,
        name: 'Amlodipine, oral',
        dosage: '5mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'morning',
        precautions: ['Take at same time daily', 'May cause swelling', 'Monitor blood pressure'],
        englishInstructions: `Amlodipine, oral\nTake 5mg tablet once daily every 24 hours.\nmorning 🌅\n\nPrecautions\n• Take at same time daily\n• May cause swelling\n• Monitor blood pressure`,
        translatedInstructions: `Amlodipine, oral\nThatha i-5mg tablet kanye ngosuku every 24 hours.\nekuseni 🌅\n\nIzexwayiso\n• Thatha ngesikhathi esifanayo nsuku zonke\n• Kungase kubangele ukuvuvuka\n• Qapha umfutho wegazi`,
        targetLanguage: 'isiZulu',
        prescribedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'M.P.' && p.surname === 'Johnson')?.id,
        name: 'Atorvastatin, oral',
        dosage: '20mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'evening',
        precautions: ['Take with or without food', 'Monitor liver function', 'Avoid grapefruit juice'],
        englishInstructions: `Atorvastatin, oral\nTake 20mg tablet once daily every 24 hours.\nevening 🌆\n\nPrecautions\n• Take with or without food\n• Monitor liver function\n• Avoid grapefruit juice`,
        translatedInstructions: `Atorvastatin, oral\nThatha i-20mg tablet kanye ngosuku every 24 hours.\nkusihlwa 🌆\n\nIzexwayiso\n• Thatha noma nokudla noma ngaphandle\n• Qapha umsebenzi wesibindi\n• Gwema ujusi we-grapefruit`,
        targetLanguage: 'isiZulu',
        prescribedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'M.P.' && p.surname === 'Johnson')?.id,
        name: 'Furosemide, oral',
        dosage: '40mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'morning',
        precautions: ['Take with plenty of water', 'May cause dizziness', 'Monitor kidney function'],
        englishInstructions: `Furosemide, oral\nTake 40mg tablet once daily every 24 hours.\nmorning 🌅\n\nPrecautions\n• Take with plenty of water\n• May cause dizziness\n• Monitor kidney function`,
        translatedInstructions: `Furosemide, oral\nThatha i-40mg tablet kanye ngosuku every 24 hours.\nekuseni 🌅\n\nIzexwayiso\n• Thatha namanzi amaningi\n• Kungase kubangele isiyezi\n• Qapha umsebenzi wezinso`,
        targetLanguage: 'isiZulu',
        prescribedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },

      // S.K. Williams medications (isiXhosa patient)
      {
        patientId: patients.find(p => p.initials === 'S.K.' && p.surname === 'Williams')?.id,
        name: 'Doxycycline, oral',
        dosage: '100mg capsule',
        frequency: 'Twice daily',
        interval: 'Every 12 hours',
        timeOfDay: 'morning, evening',
        precautions: ['Take with plenty of water', 'Avoid dairy products', 'May cause photosensitivity'],
        englishInstructions: `Doxycycline, oral\nTake 100mg capsule twice daily every 12 hours.\nmorning 🌅, evening 🌆\n\nPrecautions\n• Take with plenty of water\n• Avoid dairy products\n• May cause photosensitivity`,
        translatedInstructions: `Doxycycline, oral\nThatha i-100mg capsule kabini ngosuku every 12 hours.\nekuseni 🌅, ngokuhlwa 🌆\n\nIzilumkiso\n• Thatha namanzi amaningi\n• Gwema iimveliso zobisi\n• Kungabangela ukuba buthathaka ekukhanyeni`,
        targetLanguage: 'isiXhosa',
        prescribedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'S.K.' && p.surname === 'Williams')?.id,
        name: 'Fluconazole, oral',
        dosage: '150mg capsule',
        frequency: 'Once weekly',
        interval: 'Every 7 days',
        timeOfDay: 'morning',
        precautions: ['Take with or without food', 'Complete full course', 'Monitor liver function'],
        englishInstructions: `Fluconazole, oral\nTake 150mg capsule once weekly every 7 days.\nmorning 🌅\n\nPrecautions\n• Take with or without food\n• Complete full course\n• Monitor liver function`,
        translatedInstructions: `Fluconazole, oral\nThatha i-150mg capsule kanye ngeveki every 7 days.\nekuseni 🌅\n\nIzilumkiso\n• Thatha nokutya okanye ngaphandle\n• Gqiba lonke unyango\n• Jonga umsebenzi wesibindi`,
        targetLanguage: 'isiXhosa',
        prescribedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'S.K.' && p.surname === 'Williams')?.id,
        name: 'Prednisone, oral',
        dosage: '5mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'morning',
        precautions: ['Take with food', 'Do not stop suddenly', 'Monitor blood sugar'],
        englishInstructions: `Prednisone, oral\nTake 5mg tablet once daily every 24 hours.\nmorning 🌅\n\nPrecautions\n• Take with food\n• Do not stop suddenly\n• Monitor blood sugar`,
        translatedInstructions: `Prednisone, oral\nThatha i-5mg tablet kanye ngosuku every 24 hours.\nekuseni 🌅\n\nIzilumkiso\n• Thatha nokutya\n• Ungayeki ngequbuliso\n• Jonga iswekile yegazi`,
        targetLanguage: 'isiXhosa',
        prescribedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },

      // A.B. Brown medications (Afrikaans patient)
      {
        patientId: patients.find(p => p.initials === 'A.B.' && p.surname === 'Brown')?.id,
        name: 'Lansoprazole, oral',
        dosage: '30mg capsule',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'morning',
        precautions: ['Take before breakfast', 'Swallow whole', 'Take at least 2 hours before meals'],
        englishInstructions: `Lansoprazole, oral\nTake 30mg capsule once daily every 24 hours.\nmorning 🌅\n\nPrecautions\n• Take before breakfast\n• Swallow whole\n• Take at least 2 hours before meals`,
        translatedInstructions: `Lansoprazole, oral\nNeem 30mg kapsule een keer per dag elke 24 uur.\noggend 🌅\n\nVoorsorgmaatreëls\n• Neem voor ontbyt\n• Sluk heel\n• Neem ten minste 2 uur voor maaltye`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'A.B.' && p.surname === 'Brown')?.id,
        name: 'Carvedilol, oral',
        dosage: '6.25mg tablet',
        frequency: 'Twice daily',
        interval: 'Every 12 hours',
        timeOfDay: 'morning, evening',
        precautions: ['Take with food', 'Monitor blood pressure', 'May cause dizziness'],
        englishInstructions: `Carvedilol, oral\nTake 6.25mg tablet twice daily every 12 hours.\nmorning 🌅, evening 🌆\n\nPrecautions\n• Take with food\n• Monitor blood pressure\n• May cause dizziness`,
        translatedInstructions: `Carvedilol, oral\nNeem 6.25mg tablet twee keer per dag elke 12 uur.\noggend 🌅, aand 🌆\n\nVoorsorgmaatreëls\n• Neem saam met kos\n• Monitor bloeddruk\n• Kan duiseligheid veroorsaak`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'A.B.' && p.surname === 'Brown')?.id,
        name: 'Aspirin, oral',
        dosage: '100mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'evening',
        precautions: ['Take with food', 'Monitor for bleeding', 'Avoid other blood thinners'],
        englishInstructions: `Aspirin, oral\nTake 100mg tablet once daily every 24 hours.\nevening 🌆\n\nPrecautions\n• Take with food\n• Monitor for bleeding\n• Avoid other blood thinners`,
        translatedInstructions: `Aspirin, oral\nNeem 100mg tablet een keer per dag elke 24 uur.\naand 🌆\n\nVoorsorgmaatreëls\n• Neem saam met kos\n• Monitor vir bloeding\n• Vermy ander bloedverdunners`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
      },

      // L.M. Davis medications (isiZulu patient)
      {
        patientId: patients.find(p => p.initials === 'L.M.' && p.surname === 'Davis')?.id,
        name: 'Ferrous sulphate compound BPC (dried), oral',
        dosage: '200mg tablet',
        frequency: 'Three times daily',
        interval: 'Every 8 hours',
        timeOfDay: 'morning, afternoon, evening',
        precautions: ['Take on empty stomach', 'May cause constipation', 'Take with vitamin C'],
        englishInstructions: `Ferrous sulphate compound BPC (dried), oral\nTake 200mg tablet three times daily every 8 hours.\nmorning 🌅, afternoon ☀️, evening 🌆\n\nPrecautions\n• Take on empty stomach\n• May cause constipation\n• Take with vitamin C`,
        translatedInstructions: `Ferrous sulphate compound BPC (dried), oral\nThatha i-200mg tablet kathathu ngosuku every 8 hours.\nekuseni 🌅, emini ☀️, kusihlwa 🌆\n\nIzexwayiso\n• Thatha ngesisu esingenalutho\n• Kungase kubangele ukuvaleka kwesisu\n• Thatha ne-vitamin C`,
        targetLanguage: 'isiZulu',
        prescribedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'L.M.' && p.surname === 'Davis')?.id,
        name: 'Folic acid, oral',
        dosage: '5mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'morning',
        precautions: ['Take with or without food', 'Take with plenty of water', 'Store in cool place'],
        englishInstructions: `Folic acid, oral\nTake 5mg tablet once daily every 24 hours.\nmorning 🌅\n\nPrecautions\n• Take with or without food\n• Take with plenty of water\n• Store in cool place`,
        translatedInstructions: `Folic acid, oral\nThatha i-5mg tablet kanye ngosuku every 24 hours.\nekuseni 🌅\n\nIzexwayiso\n• Thatha noma nokudla noma ngaphandle\n• Thatha namanzi amaningi\n• Gcina endaweni epholile`,
        targetLanguage: 'isiZulu',
        prescribedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      },

      // R.T. Wilson medications (Afrikaans patient)
      {
        patientId: patients.find(p => p.initials === 'R.T.' && p.surname === 'Wilson')?.id,
        name: 'Hydrochlorothiazide, oral',
        dosage: '25mg tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'morning',
        precautions: ['Take with plenty of water', 'Monitor kidney function', 'May cause dizziness'],
        englishInstructions: `Hydrochlorothiazide, oral\nTake 25mg tablet once daily every 24 hours.\nmorning 🌅\n\nPrecautions\n• Take with plenty of water\n• Monitor kidney function\n• May cause dizziness`,
        translatedInstructions: `Hydrochlorothiazide, oral\nNeem 25mg tablet een keer per dag elke 24 uur.\noggend 🌅\n\nVoorsorgmaatreëls\n• Neem saam met baie water\n• Monitor nierfunksie\n• Kan duiseligheid veroorsaak`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patients.find(p => p.initials === 'R.T.' && p.surname === 'Wilson')?.id,
        name: 'Multivitamin, oral',
        dosage: '1 tablet',
        frequency: 'Once daily',
        interval: 'Every 24 hours',
        timeOfDay: 'morning',
        precautions: ['Take with food', 'Take with plenty of water', 'Store in dry place'],
        englishInstructions: `Multivitamin, oral\nTake 1 tablet once daily every 24 hours.\nmorning 🌅\n\nPrecautions\n• Take with food\n• Take with plenty of water\n• Store in dry place`,
        translatedInstructions: `Multivitamin, oral\nNeem 1 tablet een keer per dag elke 24 uur.\noggend 🌅\n\nVoorsorgmaatreëls\n• Neem saam met kos\n• Neem saam met baie water\n• Bêre op droë plek`,
        targetLanguage: 'Afrikaans',
        prescribedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const medication of sampleMedications) {
      if (medication.patientId) {
        await pool.query(
          `INSERT INTO medications (
            patient_id, name, dosage, frequency, interval, time_of_day, 
            precautions, english_instructions, translated_instructions, 
            target_language, prescribed_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            medication.patientId,
            medication.name,
            medication.dosage,
            medication.frequency,
            medication.interval,
            medication.timeOfDay,
            medication.precautions,
            medication.englishInstructions,
            medication.translatedInstructions,
            medication.targetLanguage,
            medication.prescribedDate
          ]
        );
      }
    }
    
    console.log('Sample medication data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample medication data:', error);
    throw error;
  }
};

const insertSamplePharmacists = async () => {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;

  const samplePharmacists = [
    { name: 'Daniel', surname: 'van Zyl', pNumber: 'P-10513', password: 'password123' },
    { name: 'Sarah', surname: 'Johnson', pNumber: 'P-10514', password: 'securepass456' },
    { name: 'Michael', surname: 'Smith', pNumber: 'P-10515', password: 'pharmacy789' },
    { name: 'Emma', surname: 'Wilson', pNumber: 'P-10516', password: 'medcare321' }
  ];

  try {
    for (const pharmacist of samplePharmacists) {
      const passwordHash = await bcrypt.hash(pharmacist.password, saltRounds);
      
      await pool.query(
        'INSERT INTO pharmacists (name, surname, p_number, password_hash) VALUES ($1, $2, $3, $4)',
        [pharmacist.name, pharmacist.surname, pharmacist.pNumber, passwordHash]
      );
    }
    console.log('Sample pharmacist data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample pharmacist data:', error);
    throw error;
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTables };
