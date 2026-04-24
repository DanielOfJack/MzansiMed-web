# Medication Data Reset Script

## Purpose

This script empties the medications table and repopulates it with clean sample data using ONLY the standardized dropdown options from the CSV files.

## Problem It Solves

When medications are entered into the system, they may be stored with variations in format:
- **Frequency**: "Three times daily" vs "Three times a day" vs "tid"
- **Interval**: "q8h" vs "Every 8 hours"
- **Time of Day**: "morning, afternoon, evening" vs "Morning, Noon, Evening"
- **Dosage**: "500mg tablet" vs "1 tablet"

This causes issues when loading historical medications because the values don't match the dropdown options, resulting in:
- Empty or incomplete instruction generation
- Mismatched data when reopening medications
- Poor user experience

## What It Does

The `resetMedicationData.js` script:

1. **Deletes all existing medications** from the database (patient data is preserved)
2. **Inserts fresh sample medications** using ONLY standardized values:
   - Frequency: "Once a day", "Twice a day", "Three times a day", "Four times a day"
   - Dosage: "1 tablet", "1 capsule", etc. (exact CSV values)
   - Interval: "Every 4 hours", "Every 6 hours", "Every 8 hours", "Every 12 hours"
   - Time of Day: "Morning", "Noon", "Evening", "Night"
   - Precautions: Only from the Precautions.csv list
3. **Leaves instructions NULL** - they will be generated fresh in the frontend
4. **Reports all operations** for verification

## How to Run

### Prerequisites

- Backend server dependencies installed (`npm install`)
- PostgreSQL database running
- Database connection configured in `backend/config/database.js`
- `.env` file with correct database credentials

### Running the Script

From the **backend** directory:

\`\`\`bash
cd /Users/danny/Software/MzansiMed/MzansiMed-web/backend
node scripts/resetMedicationData.js
\`\`\`

### Expected Output

\`\`\`
🔄 Resetting medication data...

📋 Step 1: Clearing existing medications...
   ✅ Deleted 23 existing medication(s)

📋 Step 2: Loading patient data...
   ✅ Found 10 patient(s)

📋 Step 3: Inserting new sample medications with standardized data...

   ✓ Added Paracetamol, oral for J.D. Smith
   ✓ Added Amoxicillin, oral for J.D. Smith
   ✓ Added Cetirizine, oral for J.D. Smith
   ✓ Added Metformin, oral for M.P. Johnson
   ...

✅ Successfully inserted 19 new medication(s)

📊 Summary:
   • All data uses standardized dropdown options
   • Frequency: "Once a day", "Twice a day", "Three times a day", etc.
   • Dosage: "1 tablet", "1 capsule", etc.
   • Intervals: "Every 4 hours", "Every 8 hours", "Every 12 hours"
   • Time of Day: "Morning", "Noon", "Evening", "Night"
   • Precautions: Standardized options from CSV
   • Instructions will be generated fresh in the frontend

✨ All done!
\`\`\`

## Standardized Values Used

### Frequency Options (from Frequency.csv)
- "Once a day"
- "Twice a day"
- "Three times a day"
- "Four times a day"
- "As needed"

### Dosage Options (from Dosage.csv - examples)
- "1 tablet"
- "2 tablets"
- "Half tablet"
- "Quarter tablet"
- "1 capsule"
- "2 capsules"
- "1 puff"
- "2 puffs"

### Interval Options (from Intervals.csv)
- "Every 4 hours"
- "Every 6 hours"
- "Every 8 hours"
- "Every 12 hours"

### Time of Day Options (from Time_of_Day.csv)
- "Morning"
- "Noon"
- "Evening"
- "Night"

### Precaution Options (from Precautions.csv - examples)
- "Before meals"
- "After meals"
- "With meals"
- "Without regard to meals"
- "Keep out of reach of children"
- "Avoid alcohol"
- "Monitor blood sugar levels regularly"
- Many more...

## Safety

- The script **deletes all medications** but **preserves patient data**
- All operations are **logged** for verification
- Sample data is immediately re-inserted with standardized values
- Instructions are NOT pre-generated - they will be created fresh in the frontend

## When to Run

Run this script:

1. **During development** - To reset to a clean state with standardized data
2. **After CSV updates** - When dropdown options have been modified
3. **To fix data issues** - When historical data is causing problems
4. **For testing** - To ensure a consistent test environment

⚠️ **Warning**: This deletes ALL medications. Do NOT run on production data unless you have a backup!

## Frontend Integration

The frontend also has matching logic for any edge cases:

- File: `pharmacist-portal/src/utils/medicationDataMatcher.ts`
- Used by: `LoadPreviousMedicationsPage.tsx`
- Automatically matches variations to dropdown options in real-time

This provides **flexible data handling**:
1. Backend has clean, standardized data
2. Frontend can still handle variations if needed
3. Instructions are generated fresh when loading medications

## Troubleshooting

### Script fails to connect to database

- Check your `.env` file has correct database credentials
- Ensure PostgreSQL is running
- Verify database name exists

### No patients found

- Run `node scripts/setupDatabase.js` first to create patients
- Check: `psql -d your_database -c "SELECT COUNT(*) FROM patients;"`

### No medications inserted

- Check patient data exists (see above)
- Verify database connection is working
- Check console output for specific errors

### Data not reflected in frontend

- Clear browser localStorage
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Check browser console for errors
- Verify backend server is running

## Notes

- This is a **development tool** - use with caution on production data
- Always backup your database before running
- Patient data is preserved - only medications are reset
- Instructions are generated fresh in the frontend for maximum flexibility
- All values match exactly with CSV dropdown options

## Related Files

- **This script**: `backend/scripts/resetMedicationData.js`
- **Backend routes**: `backend/routes/medications.js`
- **Frontend matcher**: `pharmacist-portal/src/utils/medicationDataMatcher.ts`
- **CSV sources**: `translations_db/*.csv`
- **Deprecated**: `backend/scripts/normalizeMedicationData.js` (old approach)

