const { pool } = require('../config/database');

/**
 * This script empties the medications table and repopulates it with sample data
 * using ONLY standardized dropdown options from the CSV files
 */

const resetMedicationData = async () => {
  try {
    console.log('🔄 Resetting medication data...\n');
    
    // Step 1: Delete all existing medications
    console.log('📋 Step 1: Clearing existing medications...');
    const deleteResult = await pool.query('DELETE FROM medications');
    console.log(`   ✅ Deleted ${deleteResult.rowCount} existing medication(s)\n`);
    
    // Step 2: Get patient IDs for linking medications
    console.log('📋 Step 2: Loading patient data...');
    const patientsResult = await pool.query('SELECT id, initials, surname, home_language FROM patients ORDER BY surname');
    const patients = patientsResult.rows;
    
    if (patients.length === 0) {
      console.log('   ❌ No patients found. Please run setupDatabase.js first to create patients.');
      return;
    }
    console.log(`   ✅ Found ${patients.length} patient(s)\n`);
    
    // Step 3: Insert new sample medications using ONLY standardized options
    console.log('📋 Step 3: Inserting new sample medications with standardized data...\n');
    
    const sampleMedications = [
      // J.D. Smith medications (Afrikaans patient)
      {
        patientSelector: { initials: 'J.D.', surname: 'Smith' },
        name: 'Paracetamol, oral',
        dosage: '1 tablet',  // From Dosage.csv
        frequency: 'Three times a day',  // From Frequency.csv
        interval: 'Every 8 hours',  // From Intervals.csv
        timeOfDay: 'Morning, Noon, Evening',  // From Time_of_Day.csv
        precautions: ['With meals', 'Keep out of reach of children'],  // From Precautions.csv
        prescribedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'J.D.', surname: 'Smith' },
        name: 'Amoxicillin, oral',
        dosage: '1 capsule',
        frequency: 'Three times a day',
        interval: 'Every 8 hours',
        timeOfDay: 'Morning, Noon, Evening',
        precautions: ['Before meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'J.D.', surname: 'Smith' },
        name: 'Cetirizine, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Evening',
        precautions: ['Without regard to meals', 'Avoid alcohol'],
        prescribedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
      },
      
      // M.P. Johnson medications (isiZulu patient)
      {
        patientSelector: { initials: 'M.P.', surname: 'Johnson' },
        name: 'Metformin, oral',
        dosage: '1 tablet',
        frequency: 'Twice a day',
        interval: 'Every 12 hours',
        timeOfDay: 'Morning, Evening',
        precautions: ['With meals', 'Monitor blood sugar levels regularly'],
        prescribedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'M.P.', surname: 'Johnson' },
        name: 'Amlodipine, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['Without regard to meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'M.P.', surname: 'Johnson' },
        name: 'Atorvastatin, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Evening',
        precautions: ['Without regard to meals', 'Avoid alcohol'],
        prescribedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'M.P.', surname: 'Johnson' },
        name: 'Furosemide, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['Without regard to meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },

      // S.K. Williams medications (isiXhosa patient)
      {
        patientSelector: { initials: 'S.K.', surname: 'Williams' },
        name: 'Doxycycline, oral',
        dosage: '1 capsule',
        frequency: 'Twice a day',
        interval: 'Every 12 hours',
        timeOfDay: 'Morning, Evening',
        precautions: ['Before meals', 'Avoid alcohol'],
        prescribedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'S.K.', surname: 'Williams' },
        name: 'Fluconazole, oral',
        dosage: '1 capsule',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['Without regard to meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'S.K.', surname: 'Williams' },
        name: 'Prednisone, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['With meals', 'Monitor blood sugar levels regularly'],
        prescribedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },

      // A.B. Brown medications (Afrikaans patient)
      {
        patientSelector: { initials: 'A.B.', surname: 'Brown' },
        name: 'Lansoprazole, oral',
        dosage: '1 capsule',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['Before meals', 'Swallow whole'],
        prescribedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'A.B.', surname: 'Brown' },
        name: 'Carvedilol, oral',
        dosage: '1 tablet',
        frequency: 'Twice a day',
        interval: 'Every 12 hours',
        timeOfDay: 'Morning, Evening',
        precautions: ['With meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'A.B.', surname: 'Brown' },
        name: 'Aspirin, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Evening',
        precautions: ['With meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
      },

      // L.M. Davis medications (isiZulu patient)
      {
        patientSelector: { initials: 'L.M.', surname: 'Davis' },
        name: 'Ferrous sulphate compound BPC (dried), oral',
        dosage: '1 tablet',
        frequency: 'Three times a day',
        interval: 'Every 8 hours',
        timeOfDay: 'Morning, Noon, Evening',
        precautions: ['Before meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'L.M.', surname: 'Davis' },
        name: 'Folic acid, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['Without regard to meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      },

      // R.T. Wilson medications (Afrikaans patient)
      {
        patientSelector: { initials: 'R.T.', surname: 'Wilson' },
        name: 'Hydrochlorothiazide, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['Without regard to meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
      },
      {
        patientSelector: { initials: 'R.T.', surname: 'Wilson' },
        name: 'Multivitamin, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['With meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      },
      
      // N.F. Garcia medications (isiXhosa patient)
      {
        patientSelector: { initials: 'N.F.', surname: 'Garcia' },
        name: 'Ibuprofen, oral',
        dosage: '1 tablet',
        frequency: 'Three times a day',
        interval: 'Every 8 hours',
        timeOfDay: 'Morning, Noon, Evening',
        precautions: ['With meals', 'Keep out of reach of children'],
        prescribedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      
      // C.H. Martinez medications (isiZulu patient)
      {
        patientSelector: { initials: 'C.H.', surname: 'Martinez' },
        name: 'Losartan, oral',
        dosage: '1 tablet',
        frequency: 'Once a day',
        interval: null,
        timeOfDay: 'Morning',
        precautions: ['Without regard to meals', 'Monitor blood sugar levels regularly'],
        prescribedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      }
    ];

    let insertedCount = 0;
    
    for (const medication of sampleMedications) {
      // Find the patient
      const patient = patients.find(p => 
        p.initials === medication.patientSelector.initials && 
        p.surname === medication.patientSelector.surname
      );
      
      if (!patient) {
        console.log(`   ⚠️  Patient ${medication.patientSelector.initials} ${medication.patientSelector.surname} not found, skipping medication`);
        continue;
      }
      
      // Leave english_instructions and translated_instructions as NULL
      // They will be generated fresh when loaded in the frontend
      await pool.query(
        `INSERT INTO medications (
          patient_id, name, dosage, frequency, interval, time_of_day, 
          precautions, english_instructions, translated_instructions, 
          target_language, prescribed_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          patient.id,
          medication.name,
          medication.dosage,
          medication.frequency,
          medication.interval,
          medication.timeOfDay,
          medication.precautions,
          null,  // english_instructions will be generated in frontend
          null,  // translated_instructions will be generated in frontend
          patient.home_language,
          medication.prescribedDate
        ]
      );
      
      insertedCount++;
      console.log(`   ✓ Added ${medication.name} for ${patient.initials} ${patient.surname}`);
    }
    
    console.log(`\n✅ Successfully inserted ${insertedCount} new medication(s)`);
    console.log('\n📊 Summary:');
    console.log(`   • All data uses standardized dropdown options`);
    console.log(`   • Frequency: "Once a day", "Twice a day", "Three times a day", etc.`);
    console.log(`   • Dosage: "1 tablet", "1 capsule", etc.`);
    console.log(`   • Intervals: "Every 4 hours", "Every 8 hours", "Every 12 hours"`);
    console.log(`   • Time of Day: "Morning", "Noon", "Evening", "Night"`);
    console.log(`   • Precautions: Standardized options from CSV`);
    console.log(`   • Instructions will be generated fresh in the frontend\n`);
    
  } catch (error) {
    console.error('\n❌ Error resetting medication data:', error);
    throw error;
  }
};

// Run reset if this file is executed directly
if (require.main === module) {
  resetMedicationData()
    .then(() => {
      console.log('✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Reset failed:', error);
      process.exit(1);
    });
}

module.exports = { resetMedicationData };

