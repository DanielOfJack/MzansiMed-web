import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TranslationOption, medicationOptionsApi } from '../services/api';
import { 
  loadAllTranslationOptions,
  translateDosage, 
  translateFrequency,
  translateInterval,
  translateTimeOfDay,
  translatePrecautions,
  translateTake,
  translatePrecautionsHeader
} from '../utils/backendTranslationUtils';
import './AddMedicationPage.css';

interface MedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  interval: string;
  timeOfDay: string;
  precautions: string[];
}

interface InstructionDisplay {
  english: string;
  translated: string;
  selectedLanguage: string;
}

// Structure to track different parts of instructions
interface InstructionStructure {
  sections: {
    medicationName: string;
    dosageLine: string;
    dosageLineUserContent: string; // User content on same line as dosage, after the period
    timeOfDay: string;
    precautionsHeader: string;
    precautionsList: string[];
  };
  userContent: {
    beforeMedication: string;
    afterMedication: string;
    afterDosage: string;
    afterTimeOfDay: string;
    afterPrecautions: string;
  };
  lastGenerated: {
    english: string;
    translated: string;
  };
}

interface MedicationTab {
  id: number;
  name: string;
  isActive: boolean;
  formData: MedicationForm;
  instructions: InstructionDisplay;
}

const AddMedicationPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [medicationForm, setMedicationForm] = useState<MedicationForm>({
    name: '',
    dosage: '',
    frequency: '',
    interval: '',
    timeOfDay: '',
    precautions: []
  });

  const [instructionDisplay, setInstructionDisplay] = useState<InstructionDisplay>({
    english: '',
    translated: 'This will have the translated instructions',
    selectedLanguage: 'isiZulu'
  });

  // Track instruction structure for smart updates
  const [instructionStructure, setInstructionStructure] = useState<InstructionStructure>({
    sections: {
      medicationName: '',
      dosageLine: '',
      dosageLineUserContent: '',
      timeOfDay: '',
      precautionsHeader: '',
      precautionsList: []
    },
    userContent: {
      beforeMedication: '',
      afterMedication: '',
      afterDosage: '',
      afterTimeOfDay: '',
      afterPrecautions: ''
    },
    lastGenerated: {
      english: '',
      translated: ''
    }
  });

  const [showDropdowns, setShowDropdowns] = useState({
    medication: false,
    dosage: false,
    frequency: false,
    interval: false,
    timeOfDay: false,
    precautions: false
  });

  // Translation options state - loaded from backend API
  const [translationOptions, setTranslationOptions] = useState<{
    dosageOptions: TranslationOption[];
    englishDosageOptions: string[];
    frequencyOptions: TranslationOption[];
    englishFrequencyOptions: string[];
    intervalOptions: TranslationOption[];
    englishIntervalOptions: string[];
    timeOfDayOptions: TranslationOption[];
    englishTimeOfDayOptions: string[];
    precautionOptions: TranslationOption[];
    englishPrecautionOptions: string[];
  }>({
    dosageOptions: [],
    englishDosageOptions: [],
    frequencyOptions: [],
    englishFrequencyOptions: [],
    intervalOptions: [],
    englishIntervalOptions: [],
    timeOfDayOptions: [],
    englishTimeOfDayOptions: [],
    precautionOptions: [],
    englishPrecautionOptions: []
  });

  const [translationsLoaded, setTranslationsLoaded] = useState(false);

  // Medication options state - loaded from backend API
  const [medicationNames, setMedicationNames] = useState<string[]>([]);
  const [medicationsLoaded, setMedicationsLoaded] = useState(false);

  // Get patient data from localStorage to determine target language
  const [patientLanguage, setPatientLanguage] = useState<string>('');
  
  // Load translation options and medications from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load translations and medications in parallel
        const [allOptions, medicationsResponse] = await Promise.all([
          loadAllTranslationOptions(),
          medicationOptionsApi.getAll()
        ]);
        
        // Set translation options
        setTranslationOptions({
          dosageOptions: allOptions.dosage.options,
          englishDosageOptions: allOptions.dosage.englishOptions,
          frequencyOptions: allOptions.frequency.options,
          englishFrequencyOptions: allOptions.frequency.englishOptions,
          intervalOptions: allOptions.intervals.options,
          englishIntervalOptions: allOptions.intervals.englishOptions,
          timeOfDayOptions: allOptions.time_of_day.options,
          englishTimeOfDayOptions: allOptions.time_of_day.englishOptions,
          precautionOptions: allOptions.precautions.options,
          englishPrecautionOptions: allOptions.precautions.englishOptions
        });
        
        // Set medication options
        if (medicationsResponse.success) {
          setMedicationNames(medicationsResponse.data.map(med => med.name));
        }
        
        setTranslationsLoaded(true);
        setMedicationsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty arrays as fallback
        setTranslationsLoaded(true);
        setMedicationsLoaded(true);
      }
    };

    loadData();
  }, []);
  
  useEffect(() => {
    const patientData = localStorage.getItem('patientData');
    if (patientData) {
      try {
        const parsedData = JSON.parse(patientData);
        setPatientLanguage(parsedData.homeLanguage || '');
      } catch (error) {
        console.error('Error parsing patient data:', error);
      }
    }
  }, []);

  const [medicationTabs, setMedicationTabs] = useState<MedicationTab[]>([]);

  const [nextTabId, setNextTabId] = useState(2);

  // Create a default tab when no existing data is found
  const createDefaultTab = () => {
    const defaultTab: MedicationTab = {
      id: 1,
      name: 'Medication 1',
      isActive: true,
      formData: {
        name: '',
        dosage: '',
        frequency: '',
        interval: '',
        timeOfDay: '',
        precautions: []
      },
      instructions: {
        english: '',
        translated: 'This will have the translated instructions',
        selectedLanguage: 'isiZulu'
      }
    };
    
    setMedicationTabs([defaultTab]);
    setNextTabId(2);
    setMedicationForm(defaultTab.formData);
    setInstructionDisplay(defaultTab.instructions);
    
    // Save to localStorage
    localStorage.setItem('medicationTabs', JSON.stringify([defaultTab]));
  };

  // Load existing medication data from localStorage
  useEffect(() => {
    const storedTabs = localStorage.getItem('medicationTabs');
    if (storedTabs) {
      try {
        const parsedTabs = JSON.parse(storedTabs);
        if (parsedTabs.length > 0) {
          setMedicationTabs(parsedTabs);
          
          // Set the next tab ID to be one more than the highest existing ID
          const maxId = Math.max(...parsedTabs.map((tab: MedicationTab) => tab.id));
          setNextTabId(maxId + 1);
          
          // Find the active tab and load its data into the form
          const activeTab = parsedTabs.find((tab: MedicationTab) => tab.isActive);
          if (activeTab) {
            setMedicationForm(activeTab.formData);
            setInstructionDisplay(activeTab.instructions);
          }
        } else {
          // Create a default tab if no tabs exist
          createDefaultTab();
        }
      } catch (error) {
        console.error('Error parsing medication tabs:', error);
        // Create a default tab if there's an error
        createDefaultTab();
      }
    } else {
      // Create a default tab if no localStorage data exists
      createDefaultTab();
    }
  }, []);

  // Set up keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleKeyNavigation(e);
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [medicationTabs]);

  // Medication names are now loaded from backend API in medicationNames state

  // Abbreviations mapping for quick entry
  const frequencyAbbreviations: { [key: string]: string } = {
    'tid': 'Three times daily',
    'bid': 'Twice daily',
    'qd': 'Once daily',
    'qid': 'Four times daily',
    'qw': 'Once weekly',
    'biw': 'Twice weekly',
    'q2w': 'Every two weeks'
  };

  // Interval abbreviations mapping
  const intervalAbbreviations: { [key: string]: string } = {
    'q4h': 'Every 4 hours',
    'q6h': 'Every 6 hours',
    'q8h': 'Every 8 hours',
    'q12h': 'Every 12 hours',
    'qd': 'Every 24 hours',
    'q2d': 'Every 48 hours',
    'q3d': 'Every 72 hours'
  };

  // Dosage abbreviations mapping
  const dosageAbbreviations: { [key: string]: string } = {
    'tab': 'tablet',
    'tabs': 'tablets'
  };

  // Time of day abbreviations mapping
  const timeOfDayAbbreviations: { [key: string]: string } = {
    'm.': 'morning',
    'n.': 'night',
    'p.m.': 'afternoon'
  };


  const [precautionSearch, setPrecautionSearch] = useState('');

  // Handler for when user edits instruction text directly
  const handleInstructionChange = (type: 'english' | 'translated', newContent: string) => {
    if (type === 'english') {
      // Parse the new content to extract user additions
      const newStructure = parseInstructionContent(newContent);
      
      // Update the instruction structure to track user changes
      setInstructionStructure(prevStructure => ({
        ...prevStructure,
        userContent: newStructure.userContent,
        // Keep the generated sections unless they've been completely removed
        sections: {
          ...prevStructure.sections,
          // Only update if the new structure has these sections
          medicationName: newStructure.sections.medicationName || prevStructure.sections.medicationName,
          dosageLine: newStructure.sections.dosageLine || prevStructure.sections.dosageLine,
          timeOfDay: newStructure.sections.timeOfDay || prevStructure.sections.timeOfDay,
          precautionsHeader: newStructure.sections.precautionsHeader || prevStructure.sections.precautionsHeader,
          precautionsList: newStructure.sections.precautionsList.length > 0 
            ? newStructure.sections.precautionsList 
            : prevStructure.sections.precautionsList
        }
      }));

      // Update the display
      setInstructionDisplay(prev => ({
        ...prev,
        english: newContent
      }));

      // Sync changes to translated version (for now, just mirror the structure)
      syncToTranslatedInstructions(newContent);
    } else {
      // For translated instructions, just update the display for now
      setInstructionDisplay(prev => ({
        ...prev,
        translated: newContent
      }));
    }

    // Update the active tab data
    const updatedInstructions = {
      ...instructionDisplay,
      [type]: newContent
    };
    updateActiveTabData(medicationForm, updatedInstructions);
  };

  // Sync English changes to translated instructions (preserving user additions)
  const syncToTranslatedInstructions = (englishContent: string) => {
    // Parse the English content to understand the structure
    const englishStructure = parseInstructionContent(englishContent);
    
    // Parse the current translated content to preserve existing translated sections
    const currentTranslatedStructure = parseInstructionContent(instructionDisplay.translated, true);
    
    // For now, we'll mirror the user additions without translation
    // In the future, this could be enhanced to translate user additions
    const translatedStructure: InstructionStructure = {
      sections: {
        // Keep existing translated sections (they'll be updated by form changes)
        ...currentTranslatedStructure.sections,
        // Mirror inline user content from English
        dosageLineUserContent: englishStructure.sections.dosageLineUserContent
      },
      userContent: {
        // Mirror user content from English (in the future, could translate this)
        beforeMedication: englishStructure.userContent.beforeMedication,
        afterMedication: englishStructure.userContent.afterMedication,
        afterDosage: englishStructure.userContent.afterDosage,
        afterTimeOfDay: englishStructure.userContent.afterTimeOfDay,
        afterPrecautions: englishStructure.userContent.afterPrecautions
      },
      lastGenerated: currentTranslatedStructure.lastGenerated
    };

    // Reconstruct translated content
    const newTranslatedContent = reconstructInstructionContent(translatedStructure);
    
    setInstructionDisplay(prev => ({
      ...prev,
      translated: newTranslatedContent || 'This will have the translated instructions'
    }));
  };

  // Utility function to parse existing instruction content to preserve user additions
  const parseInstructionContent = (content: string, isTranslated: boolean = false): InstructionStructure => {
    const lines = content.split('\n');
    const structure: InstructionStructure = {
      sections: {
        medicationName: '',
        dosageLine: '',
        dosageLineUserContent: '',
        timeOfDay: '',
        precautionsHeader: '',
        precautionsList: []
      },
      userContent: {
        beforeMedication: '',
        afterMedication: '',
        afterDosage: '',
        afterTimeOfDay: '',
        afterPrecautions: ''
      },
      lastGenerated: {
        english: '',
        translated: ''
      }
    };

    let currentSection = 'beforeMedication';
    let medicationNameFound = false;
    let precautionsStarted = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle non-empty lines for section detection
      if (trimmedLine) {
        // Detect medication name (first non-empty line)
        if (!medicationNameFound && currentSection === 'beforeMedication') {
          structure.sections.medicationName = trimmedLine;
          medicationNameFound = true;
          currentSection = 'afterMedication';
          return;
        }

        // Detect dosage/instruction line (starts with ℹ️)
        if (trimmedLine.startsWith('ℹ️')) {
          // Split the line at the first period to separate generated content from user content
          const periodIndex = trimmedLine.indexOf('.');
          if (periodIndex !== -1) {
            // Include the period in the generated part
            structure.sections.dosageLine = trimmedLine.substring(0, periodIndex + 1);
            // Everything after the period is user content
            const afterPeriod = trimmedLine.substring(periodIndex + 1).trimStart();
            if (afterPeriod) {
              structure.sections.dosageLineUserContent = afterPeriod;
            }
          } else {
            // No period found, treat entire line as generated content
            structure.sections.dosageLine = trimmedLine;
          }
          currentSection = 'afterDosage';
          return;
        }

        // Detect time of day line (starts with 🕜)
        if (trimmedLine.startsWith('🕜')) {
          structure.sections.timeOfDay = trimmedLine;
          currentSection = 'afterTimeOfDay';
          return;
        }

        // Detect precautions header (line containing "Precautions" or translated equivalent)
        if (trimmedLine.match(/^(precautions|voorsorgmaatreëls|ukulumkela|ukuqaphela)$/i)) {
          structure.sections.precautionsHeader = trimmedLine;
          precautionsStarted = true;
          currentSection = 'precautions';
          return;
        }

        // Detect precaution items (start with bullet)
        if (precautionsStarted && trimmedLine.startsWith('•')) {
          structure.sections.precautionsList.push(trimmedLine);
          return;
        }
      }

      // Everything else is user content (including empty lines)
      if (currentSection === 'beforeMedication') {
        structure.userContent.beforeMedication += (structure.userContent.beforeMedication ? '\n' : '') + line;
      } else if (currentSection === 'afterMedication') {
        // Content after medication name but before dosage line
        structure.userContent.afterMedication += (structure.userContent.afterMedication ? '\n' : '') + line;
      } else if (currentSection === 'afterDosage') {
        structure.userContent.afterDosage += (structure.userContent.afterDosage ? '\n' : '') + line;
      } else if (currentSection === 'afterTimeOfDay') {
        structure.userContent.afterTimeOfDay += (structure.userContent.afterTimeOfDay ? '\n' : '') + line;
      } else if (precautionsStarted) {
        structure.userContent.afterPrecautions += (structure.userContent.afterPrecautions ? '\n' : '') + line;
      }
    });

    return structure;
  };

  // Utility function to reconstruct instruction content from structure
  const reconstructInstructionContent = (structure: InstructionStructure): string => {
    let content = '';

    // Add user content before medication
    if (structure.userContent.beforeMedication) {
      content += structure.userContent.beforeMedication;
      if (!structure.userContent.beforeMedication.endsWith('\n') && structure.sections.medicationName) {
        content += '\n';
      }
    }

    // Add medication name
    if (structure.sections.medicationName) {
      content += structure.sections.medicationName;
      if (structure.userContent.afterMedication || structure.sections.dosageLine) {
        content += '\n';
      }
    }

    // Add user content after medication name
    if (structure.userContent.afterMedication) {
      content += structure.userContent.afterMedication;
      if (!structure.userContent.afterMedication.endsWith('\n') && structure.sections.dosageLine) {
        content += '\n';
      }
    }

    // Add dosage line
    if (structure.sections.dosageLine) {
      content += structure.sections.dosageLine;
      // Add inline user content on the same line, after the period
      if (structure.sections.dosageLineUserContent) {
        content += ' ' + structure.sections.dosageLineUserContent;
      }
      if (structure.userContent.afterDosage || structure.sections.timeOfDay) {
        content += '\n';
      }
    }

    // Add user content after dosage
    if (structure.userContent.afterDosage) {
      content += structure.userContent.afterDosage;
      if (!structure.userContent.afterDosage.endsWith('\n') && structure.sections.timeOfDay) {
        content += '\n';
      }
    }

    // Add time of day
    if (structure.sections.timeOfDay) {
      content += structure.sections.timeOfDay;
      if (structure.userContent.afterTimeOfDay || structure.sections.precautionsHeader || structure.sections.precautionsList.length > 0) {
        content += '\n';
      }
    }

    // Add user content after time of day
    if (structure.userContent.afterTimeOfDay) {
      content += structure.userContent.afterTimeOfDay;
      if (!structure.userContent.afterTimeOfDay.endsWith('\n') && (structure.sections.precautionsHeader || structure.sections.precautionsList.length > 0)) {
        content += '\n';
      }
    }

    // Add precautions section
    if (structure.sections.precautionsHeader || structure.sections.precautionsList.length > 0) {
      // Add empty line before precautions if there's content before it and user content doesn't already end with blank line
      if (content && !content.endsWith('\n\n')) {
        content += '\n';
      }
      
      if (structure.sections.precautionsHeader) {
        content += structure.sections.precautionsHeader + '\n';
      }
      
      structure.sections.precautionsList.forEach(precaution => {
        content += precaution + '\n';
      });
    }

    // Add user content after precautions
    if (structure.userContent.afterPrecautions) {
      content += structure.userContent.afterPrecautions;
    }

    return content;
  };

  // Update the active tab's data
  const updateActiveTabData = (formData: MedicationForm, instructions: InstructionDisplay) => {
    const updatedTabs = medicationTabs.map(tab => 
      tab.isActive 
        ? { 
            ...tab, 
            formData: { ...formData },
            instructions: { ...instructions },
            name: formData.name || `Medication ${tab.id}` // Use medication name or fallback
          }
        : tab
    );
    
    setMedicationTabs(updatedTabs);
    
    // Save to localStorage for the Check Instructions page
    localStorage.setItem('medicationTabs', JSON.stringify(updatedTabs));
  };

  const handleMedicationChange = async (field: keyof MedicationForm, value: string | string[]) => {
    const newFormData = {
      ...medicationForm,
      [field]: value
    };

    setMedicationForm(newFormData);

    // Handle field clearing - if a field is cleared, we need to handle it specially
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      handleFieldClearing(field, newFormData);
    }

    // Generate instruction when form changes for relevant fields
    if (field === 'name' || field === 'dosage' || field === 'frequency' || field === 'interval' || field === 'timeOfDay') {
      await generateInstruction(newFormData);
    }

    // Update the active tab's data (if generateInstruction didn't handle it already)
    if (!(field === 'name' || field === 'dosage' || field === 'frequency' || field === 'interval' || field === 'timeOfDay')) {
      updateActiveTabData(newFormData, instructionDisplay);
    }
  };

  // Handle clearing of specific fields and their corresponding instruction parts
  const handleFieldClearing = (field: keyof MedicationForm, newFormData: MedicationForm) => {
    const currentStructure = parseInstructionContent(instructionDisplay.english);
    let needsUpdate = false;

    // Clear specific sections based on the field that was cleared
    switch (field) {
      case 'name':
        if (currentStructure.sections.medicationName) {
          currentStructure.sections.medicationName = '';
          needsUpdate = true;
        }
        break;
      case 'dosage':
      case 'frequency':
      case 'interval':
        if (currentStructure.sections.dosageLine) {
          currentStructure.sections.dosageLine = '';
          needsUpdate = true;
        }
        break;
      case 'timeOfDay':
        if (currentStructure.sections.timeOfDay) {
          currentStructure.sections.timeOfDay = '';
          needsUpdate = true;
        }
        break;
      case 'precautions':
        if (currentStructure.sections.precautionsHeader || currentStructure.sections.precautionsList.length > 0) {
          currentStructure.sections.precautionsHeader = '';
          currentStructure.sections.precautionsList = [];
          needsUpdate = true;
        }
        break;
    }

    // If we need to update, reconstruct the instruction content
    if (needsUpdate) {
      const newInstructionContent = reconstructInstructionContent(currentStructure);
      
      setInstructionStructure(currentStructure);
      setInstructionDisplay(prev => ({
        ...prev,
        english: newInstructionContent,
        translated: newInstructionContent ? prev.translated : 'This will have the translated instructions'
      }));
    }
  };

  // Handle key press events for abbreviation expansion and field navigation
  const handleKeyPress = async (field: keyof MedicationForm, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      let abbreviation: string | undefined;
      
      // Check for abbreviations based on field type
      if (field === 'dosage' && typeof medicationForm[field] === 'string') {
        const currentValue = medicationForm[field] as string;
        // Process all abbreviations in the text, not just the first one
        let result = currentValue;
        for (const [abbr, full] of Object.entries(dosageAbbreviations)) {
          if (result.toLowerCase().includes(abbr)) {
            // Replace the abbreviation with the full text, preserving case
            // Escape special regex characters like dots
            const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedAbbr, 'gi');
            result = result.replace(regex, full);
          }
        }
        abbreviation = result;
      } else if (field === 'frequency' && typeof medicationForm[field] === 'string') {
        const currentValue = medicationForm[field] as string;
        abbreviation = frequencyAbbreviations[currentValue.toLowerCase()];
      } else if (field === 'interval' && typeof medicationForm[field] === 'string') {
        const currentValue = medicationForm[field] as string;
        abbreviation = intervalAbbreviations[currentValue.toLowerCase()];
      } else if (field === 'timeOfDay' && typeof medicationForm[field] === 'string') {
        const currentValue = medicationForm[field] as string;
        
        // Process all abbreviations in the text, not just the first one
        let result = currentValue;
        for (const [abbr, full] of Object.entries(timeOfDayAbbreviations)) {
          if (result.toLowerCase().includes(abbr)) {
            // Replace the abbreviation with the full text, preserving case
            // Escape special regex characters like dots
            const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedAbbr, 'gi');
            result = result.replace(regex, full);
          }
        }
        abbreviation = result;
      }
      
      if (abbreviation) {
        // Expand the abbreviation
        const newFormData = {
          ...medicationForm,
          [field]: abbreviation
        };
        
        setMedicationForm(newFormData);
        await generateInstruction(newFormData);
      }
      
      // Navigate to next field
      navigateToNextField(field);
    }
  };

  // Navigate to the next field in sequence
  const navigateToNextField = (currentField: keyof MedicationForm) => {
    const fieldSequence: (keyof MedicationForm)[] = ['name', 'dosage', 'frequency', 'interval', 'timeOfDay'];
    const currentIndex = fieldSequence.indexOf(currentField);
    
    if (currentIndex < fieldSequence.length - 1) {
      const nextField = fieldSequence[currentIndex + 1];
      let nextFieldId: string;
      
      // Map field names to actual DOM IDs
      switch (nextField) {
        case 'name':
          nextFieldId = 'med-name';
          break;
        case 'dosage':
          nextFieldId = 'dosage';
          break;
        case 'frequency':
          nextFieldId = 'frequency';
          break;
        case 'interval':
          nextFieldId = 'interval';
          break;
        case 'timeOfDay':
          nextFieldId = 'timeOfDay';
          break;
        default:
          return;
      }
      
      const nextFieldElement = document.getElementById(nextFieldId);
      
      if (nextFieldElement) {
        nextFieldElement.focus();
        // Select all text in the next field for easy replacement
        if (nextFieldElement instanceof HTMLInputElement) {
          nextFieldElement.select();
        }
      }
    }
  };


  const generateInstruction = async (formData: MedicationForm = medicationForm) => {
    // Check if we need to clear instructions when key fields are empty
    if (!formData.name && !formData.dosage && !formData.frequency) {
      const emptyInstructions = {
        ...instructionDisplay,
        english: '',
        translated: 'This will have the translated instructions'
      };
      setInstructionDisplay(emptyInstructions);
      setInstructionStructure({
        sections: {
          medicationName: '',
          dosageLine: '',
          dosageLineUserContent: '',
          timeOfDay: '',
          precautionsHeader: '',
          precautionsList: []
        },
        userContent: {
          beforeMedication: '',
          afterMedication: '',
          afterDosage: '',
          afterTimeOfDay: '',
          afterPrecautions: ''
        },
        lastGenerated: {
          english: '',
          translated: ''
        }
      });
      updateActiveTabData(formData, emptyInstructions);
      return;
    }

    if (!formData.name || !formData.dosage || !formData.frequency) {
      return;
    }

    // Parse current instruction content to preserve user additions
    const currentStructure = parseInstructionContent(instructionDisplay.english);

    // Generate new content for the specific sections
    const cleanMedicationName = formData.name.split(',')[0];
    
    const intervalText = formData.interval 
      ? ` ${formData.interval.toLowerCase()}`
      : '';
    
    const newDosageLine = `ℹ️ Take ${formData.dosage} ${formData.frequency.toLowerCase()}${intervalText}.`;
    
    const newTimeOfDay = formData.timeOfDay 
      ? `🕜 ${formatTimeOfDay(formData.timeOfDay)}`
      : '';

    const newPrecautionsHeader = formData.precautions.length > 0 ? 'Precautions' : '';
    const newPrecautionsList = formData.precautions.map(precaution => `• ${precaution}`);

    // Create updated structure
    const updatedStructure: InstructionStructure = {
      sections: {
        medicationName: cleanMedicationName,
        dosageLine: newDosageLine,
        dosageLineUserContent: currentStructure.sections.dosageLineUserContent, // Preserve inline user content
        timeOfDay: newTimeOfDay,
        precautionsHeader: newPrecautionsHeader,
        precautionsList: newPrecautionsList
      },
      userContent: {
        // Preserve existing user content
        beforeMedication: currentStructure.userContent.beforeMedication,
        afterMedication: currentStructure.userContent.afterMedication,
        afterDosage: currentStructure.userContent.afterDosage,
        afterTimeOfDay: currentStructure.userContent.afterTimeOfDay,
        afterPrecautions: currentStructure.userContent.afterPrecautions
      },
      lastGenerated: {
        english: '', // Will be set below
        translated: '' // Will be set by translation
      }
    };

    // Reconstruct the full instruction content
    const newInstructionContent = reconstructInstructionContent(updatedStructure);
    
    // Update the structure state
    updatedStructure.lastGenerated.english = newInstructionContent;
    setInstructionStructure(updatedStructure);

    const newInstructions = {
      ...instructionDisplay,
      english: newInstructionContent
    };

    setInstructionDisplay(newInstructions);

    // Automatically generate translation if patient language is available
    if (patientLanguage && formData.dosage) {
      await generateTranslation(newInstructionContent, patientLanguage, formData, newInstructions);
    } else {
      // Update the active tab's data
      updateActiveTabData(formData, newInstructions);
    }
  };

  const formatTimeOfDay = (timeOfDayText: string): string => {
    // Define time periods with their emojis
    const timeEmojis: { [key: string]: string } = {
      'morning': '🌅',
      'afternoon': '☀️', 
      'evening': '🌆',
      'night': '🌃'
    };

    // Extract time periods from the text (case insensitive)
    const foundTimes: string[] = [];
    const lowerText = timeOfDayText.toLowerCase();
    
    Object.keys(timeEmojis).forEach(time => {
      if (lowerText.includes(time)) {
        foundTimes.push(`${time} ${timeEmojis[time]}`);
      }
    });

    // Format without "and" connectors
    if (foundTimes.length === 0) {
      return timeOfDayText.toLowerCase(); // Return original if no matches
    } else {
      // Join all times with commas for clean display
      return foundTimes.join(', ');
    }
  };

  const generateTranslation = async (text: string, language: string, formData: MedicationForm = medicationForm, englishInstructions?: any) => {
    if (!text || !language) {
      // Set translated instructions to placeholder message
      const newInstructions = {
        ...instructionDisplay,
        translated: "This will have the translated instructions"
      };

      setInstructionDisplay(newInstructions);
      updateActiveTabData(formData, newInstructions);
      return;
    }

    if (!translationsLoaded || !medicationsLoaded) {
      // Wait for translations and medications to load
      const newInstructions = {
        ...instructionDisplay,
        translated: "Loading..."
      };
      setInstructionDisplay(newInstructions);
      updateActiveTabData(formData, newInstructions);
      return;
    }

    try {
      let translatedText = text;

      // Translate the word "take" (but preserve the emoji marker)
      const translatedTakeWord = await translateTake(language);
      translatedText = translatedText.replace(/ℹ️ Take\b/g, `ℹ️ ${translatedTakeWord.charAt(0).toUpperCase() + translatedTakeWord.slice(1)}`);
      translatedText = translatedText.replace(/ℹ️ take\b/g, `ℹ️ ${translatedTakeWord}`);

      // Translate the word "Precautions"
      const translatedPrecautionsWord = await translatePrecautionsHeader(language);
      translatedText = translatedText.replace(/\bPrecautions\b/g, translatedPrecautionsWord);

      // Translate dosage
      if (formData.dosage) {
        const translatedDosage = await translateDosage(formData.dosage, language);
        translatedText = translatedText.replace(formData.dosage, translatedDosage);
      }

      // Translate frequency
      if (formData.frequency) {
        const translatedFrequency = await translateFrequency(formData.frequency, language);
        translatedText = translatedText.replace(formData.frequency.toLowerCase(), translatedFrequency.toLowerCase());
      }

      // Translate interval
      if (formData.interval) {
        const translatedInterval = await translateInterval(formData.interval, language);
        translatedText = translatedText.replace(formData.interval.toLowerCase(), translatedInterval.toLowerCase());
      }

      // Translate time of day
      if (formData.timeOfDay) {
        // Handle multiple time periods in the timeOfDay field
        const timeWords = ['morning', 'afternoon', 'evening', 'night', 'noon'];
        for (const timeWord of timeWords) {
          if (formData.timeOfDay.toLowerCase().includes(timeWord)) {
            const translatedTime = await translateTimeOfDay(timeWord.charAt(0).toUpperCase() + timeWord.slice(1), language);
            const regex = new RegExp(timeWord, 'gi');
            translatedText = translatedText.replace(regex, translatedTime.toLowerCase());
          }
        }
      }

      // Translate precautions
      if (formData.precautions && formData.precautions.length > 0) {
        const translatedPrecautions = await translatePrecautions(formData.precautions, language);
        formData.precautions.forEach((precaution, index) => {
          if (translatedPrecautions[index]) {
            translatedText = translatedText.replace(precaution, translatedPrecautions[index]);
          }
        });
      }
      
      const newInstructions = {
        ...(englishInstructions || instructionDisplay),
        translated: translatedText,
        selectedLanguage: language
      };

      setInstructionDisplay(newInstructions);

      // Update the instruction structure with the translated content
      setInstructionStructure(prevStructure => ({
        ...prevStructure,
        lastGenerated: {
          ...prevStructure.lastGenerated,
          translated: translatedText
        }
      }));

      // Update the active tab's data
      updateActiveTabData(formData, newInstructions);
    } catch (error) {
      console.error('Error generating translation:', error);
      const newInstructions = {
        ...(englishInstructions || instructionDisplay),
        translated: "Translation error - showing English version",
        selectedLanguage: language
      };

      setInstructionDisplay(newInstructions);
      updateActiveTabData(formData, newInstructions);
    }
  };


  const handleAddAnotherMedication = () => {
    // Save current tab data before creating new one
    updateActiveTabData(medicationForm, instructionDisplay);

    // Add new tab
    const newTab: MedicationTab = {
      id: nextTabId,
      name: `Medication ${nextTabId}`,
      isActive: false,
      formData: {
        name: '',
        dosage: '',
        frequency: '',
        interval: '',
        timeOfDay: '',
        precautions: []
      },
      instructions: {
        english: '',
        translated: 'This will have the translated instructions',
        selectedLanguage: 'isiZulu'
      }
    };

    // Deactivate current active tab
    setMedicationTabs(prev => prev.map(tab => ({ ...tab, isActive: false })));

    // Add new tab and make it active
    const updatedTabs = [...medicationTabs, newTab];
    setMedicationTabs(updatedTabs);
    setNextTabId(prev => prev + 1);
    
    // Save to localStorage
    localStorage.setItem('medicationTabs', JSON.stringify(updatedTabs));

    // Reset form for another medication
    setMedicationForm({
      name: '',
      dosage: '',
      frequency: '',
      interval: '',
      timeOfDay: '',
      precautions: []
    });
    setInstructionDisplay({
      english: '',
      translated: 'This will have the translated instructions',
      selectedLanguage: 'isiZulu'
    });
  };

  const handleDeleteMedication = (tabId: number) => {
    // Don't delete if it's the only tab
    if (medicationTabs.length <= 1) return;

    // Find the tab to delete
    const tabToDelete = medicationTabs.find(tab => tab.id === tabId);
    if (!tabToDelete) return;

    // If we're deleting the active tab, we need to switch to another tab
    if (tabToDelete.isActive) {
      const remainingTabs = medicationTabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        // Switch to the first remaining tab
        const newActiveTab = remainingTabs[0];
        setMedicationTabs(prev => prev.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTab.id
        })));
        
        // Load the new active tab's data
        setMedicationForm({ ...newActiveTab.formData });
        setInstructionDisplay({ ...newActiveTab.instructions });
      }
    }

    // Remove the tab
    const updatedTabs = medicationTabs.filter(tab => tab.id !== tabId);
    setMedicationTabs(updatedTabs);
    
    // Save to localStorage
    localStorage.setItem('medicationTabs', JSON.stringify(updatedTabs));
  };

  const handleKeyNavigation = (e: KeyboardEvent) => {
    // Prevent arrow keys from ever scrolling the page
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
    }
    
    const activeElement = document.activeElement;
    const isSidebarFocused = activeElement?.closest('.medication-tabs-sidebar');
    const isFormFocused = activeElement?.closest('.left-panel');
    const isInstructionsFocused = activeElement?.closest('.right-panel');
    const isMedicationTab = activeElement?.classList.contains('medication-tab') || activeElement?.classList.contains('add-medication-tab');
    
    // Handle horizontal navigation
    if (e.key === 'ArrowRight' || e.key === 'Tab') {
      if (isSidebarFocused) {
        // Move from sidebar to medication name field
        const medicationNameField = document.querySelector('#med-name') as HTMLElement;
        medicationNameField?.focus();
        return;
      } else if (isFormFocused) {
        // Move from form to generated instructions
        const instructionsField = document.querySelector('.instruction-textarea') as HTMLElement;
        instructionsField?.focus();
        return;
      }
    }
    
    // Handle left arrow navigation
    if (e.key === 'ArrowLeft') {
      if (isFormFocused || isInstructionsFocused) {
        // Move back to the active medication tab in sidebar
        const activeTab = document.querySelector('.medication-tab.active') as HTMLElement;
        activeTab?.focus();
        return;
      }
    }
    
    // Handle vertical navigation in sidebar
    if ((isSidebarFocused || isMedicationTab) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      if (e.key === 'ArrowUp') {
        const currentIndex = medicationTabs.findIndex(tab => tab.isActive);
        
        if (currentIndex === -1) {
          // If we're on the Add button, go to the last medication
          (document.querySelector('.add-medication-tab') as HTMLElement)?.blur();
          handleTabClick(medicationTabs[medicationTabs.length - 1].id);
        } else if (currentIndex > 0) {
          // Go to previous medication
          handleTabClick(medicationTabs[currentIndex - 1].id);
        } else {
          // If we're on the first medication, focus the Add button
          (document.querySelector('.add-medication-tab') as HTMLElement)?.focus();
          // Deactivate all tabs
          setMedicationTabs(prev => prev.map(tab => ({ ...tab, isActive: false })));
          
        }
      } else if (e.key === 'ArrowDown') {
        const currentIndex = medicationTabs.findIndex(tab => tab.isActive);
        
        if (currentIndex === -1) {
          // If we're on the Add button, go to the first medication
          (document.querySelector('.add-medication-tab') as HTMLElement)?.blur();
          handleTabClick(medicationTabs[0].id);
        } else if (currentIndex < medicationTabs.length - 1) {
          // Go to next medication
          handleTabClick(medicationTabs[currentIndex + 1].id);
        } else {
          // If we're on the last medication, focus the Add button
          (document.querySelector('.add-medication-tab') as HTMLElement)?.focus();
          // Deactivate all tabs
          setMedicationTabs(prev => prev.map(tab => ({ ...tab, isActive: false })));
        }
      }
    }
  };

  const handleTabClick = (tabId: number) => {
    // Clear focus from Add button if it was focused
    (document.querySelector('.add-medication-tab') as HTMLElement)?.blur();
    
    // Save current tab data before switching
    updateActiveTabData(medicationForm, instructionDisplay);

    // Find the tab to switch to
    const targetTab = medicationTabs.find(tab => tab.id === tabId);
    if (!targetTab) return;

    // Update active state
    const updatedTabs = medicationTabs.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    }));
    setMedicationTabs(updatedTabs);
    
    // Save to localStorage
    localStorage.setItem('medicationTabs', JSON.stringify(updatedTabs));

    // Load the tab's data into the form
    setMedicationForm({ ...targetTab.formData });
    setInstructionDisplay({ ...targetTab.instructions });
  };

  const handleContinueToReview = () => {
    // Save current tab data before navigating
    updateActiveTabData(medicationForm, instructionDisplay);
    navigate('/check-instructions');
  };

  const handleLogout = () => {
    logout();
  };

  const toggleDropdown = (dropdown: 'medication' | 'dosage' | 'frequency' | 'interval' | 'timeOfDay' | 'precautions') => {
    setShowDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const selectOption = (dropdown: 'medication' | 'dosage' | 'frequency' | 'interval' | 'timeOfDay', value: string) => {
    let finalValue = value;
    
    // Check for abbreviations in frequency field
    if (dropdown === 'frequency' && frequencyAbbreviations[value.toLowerCase()]) {
      finalValue = frequencyAbbreviations[value.toLowerCase()];
    }
    
    const fieldMap = {
      'medication': 'name',
      'dosage': 'dosage',
      'frequency': 'frequency',
      'interval': 'interval',
      'timeOfDay': 'timeOfDay'
    };
    
    handleMedicationChange(fieldMap[dropdown] as keyof MedicationForm, finalValue);
    setShowDropdowns(prev => ({
      ...prev,
      [dropdown]: false
    }));
  };

  const selectPrecaution = async (precaution: string) => {
    const newFormData = {
      ...medicationForm,
      precautions: [...medicationForm.precautions, precaution]
    };
    
    setMedicationForm(newFormData);
    setPrecautionSearch(''); // Clear search input after selecting
    setShowDropdowns(prev => ({
      ...prev,
      precautions: false
    }));
    
    // Generate instruction and update active tab data
    await generateInstruction(newFormData);
  };


  return (
    <div className="add-medication-page">
      {/* Compact Header */}
      <div className="compact-header">
        <div className="header-left">
          <img 
            src="/mzansimed_logo_no_text.png" 
            alt="MzansiMed Logo" 
            className="header-logo"
          />
          <h1 className="brand-name">MzansiMed</h1>
        </div>
        <div className="header-center">
          <p className="user-info">Daniel van Zyl (P-10513)</p>
        </div>
        <div className="header-right">
          <button className="shortcuts-btn">
            <img src="/command-svgrepo-com.svg" alt="Shortcuts" className="shortcuts-icon" />
            Shortcuts
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <img src="/logout-svgrepo-com.svg" alt="Logout" className="logout-icon" />
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="medication-tabs-sidebar">
          <div className="tabs-panel">
            <div className="panel-header">
              <h3 className="panel-title">Medications</h3>
            </div>
            
            <div className="tabs-list">
                            {medicationTabs.map((tab) => (
                              <div
                key={tab.id}
                className={`medication-tab ${tab.isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabClick(tab.id);
                  }
                }}
              >
                <span className="tab-name" title={tab.name}>
                  {tab.name}
                </span>
                {medicationTabs.length > 1 && (
                  <button
                    className="remove-tab-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMedication(tab.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            <div
              className="medication-tab add-medication-tab"
              onClick={handleAddAnotherMedication}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAddAnotherMedication();
                }
              }}
            >
              <span className="tab-name">
                + Add Medication
              </span>
            </div>
            </div>
            
            <div className="back-to-patient-section">
              <button 
                className="back-to-patient-btn"
                onClick={() => navigate('/manage-patient')}
              >
                ← Back to Patient
              </button>
            </div>
          </div>
        </div>
        
        <div className="content-area">
          <div className="left-panel">
            <div className="panel-header">
              <h2 className="panel-title">Medication Details</h2>
            </div>
            
            <form className="medication-form">
              <div className="form-section">
                <h3>Dosage</h3>
                
                <div className="form-group">
                  <label htmlFor="med-name" className="form-label">Medication Name</label>
                  <div className="dropdown-container">
                    <div className="input-with-clear">
                      <input
                        type="text"
                        id="med-name"
                        className="form-input"
                        value={medicationForm.name}
                        onChange={(e) => handleMedicationChange('name', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('name', e)}
                        placeholder="Search medication..."
                        onClick={() => toggleDropdown('medication')}
                      />
                      {medicationForm.name && (
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => handleMedicationChange('name', '')}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {showDropdowns.medication && (
                      <div className="dropdown-list">
                        {!medicationsLoaded ? (
                          <div className="dropdown-item">Loading medications...</div>
                        ) : medicationNames.length === 0 ? (
                          <div className="dropdown-item">No medications available</div>
                        ) : (
                          medicationNames
                            .filter(med => med.toLowerCase().includes(medicationForm.name.toLowerCase()))
                            .map((med, index) => (
                              <div
                                key={index}
                                className="dropdown-item"
                                onClick={() => selectOption('medication', med)}
                              >
                                {med}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="dosage" className="form-label">Dosage</label>
                  <div className="dropdown-container">
                    <div className="input-with-clear">
                      <input
                        type="text"
                        id="dosage"
                        className="form-input"
                        value={medicationForm.dosage}
                        onChange={(e) => handleMedicationChange('dosage', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('dosage', e)}
                        placeholder="Select or type dosage..."
                        onClick={() => toggleDropdown('dosage')}
                        required
                      />
                      {medicationForm.dosage && (
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => handleMedicationChange('dosage', '')}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {showDropdowns.dosage && (
                      <div className="dropdown-list">
                        {translationOptions.englishDosageOptions
                          .filter(dosage => dosage.toLowerCase().includes(medicationForm.dosage.toLowerCase()))
                          .map((dosage, index) => (
                            <div
                              key={index}
                              className="dropdown-item"
                              onClick={() => selectOption('dosage', dosage)}
                            >
                              {dosage}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="frequency" className="form-label">Frequency</label>
                  <div className="dropdown-container">
                    <div className="input-with-clear">
                      <input
                        type="text"
                        id="frequency"
                        className="form-input"
                        value={medicationForm.frequency}
                        onChange={(e) => handleMedicationChange('frequency', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('frequency', e)}
                        placeholder="Select frequency..."
                        onClick={() => toggleDropdown('frequency')}
                      />
                      {medicationForm.frequency && (
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => handleMedicationChange('frequency', '')}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {showDropdowns.frequency && (
                      <div className="dropdown-list">
                        {translationOptions.englishFrequencyOptions
                          .filter(freq => freq.toLowerCase().includes(medicationForm.frequency.toLowerCase()))
                          .map((freq, index) => (
                            <div
                              key={index}
                              className="dropdown-item"
                              onClick={() => selectOption('frequency', freq)}
                            >
                              {freq}
                            </div>
                          ))}
                      </div>
                    )}

                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="interval" className="form-label">Interval</label>
                  <div className="dropdown-container">
                    <div className="input-with-clear">
                        <input
                          type="text"
                          id="interval"
                          className="form-input"
                          value={medicationForm.interval}
                          onChange={(e) => handleMedicationChange('interval', e.target.value)}
                          onKeyPress={(e) => handleKeyPress('interval', e)}
                          placeholder="Select interval..."
                          onClick={() => toggleDropdown('interval')}
                        />
                      {medicationForm.interval && (
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => handleMedicationChange('interval', '')}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {showDropdowns.interval && (
                      <div className="dropdown-list">
                        {translationOptions.englishIntervalOptions
                          .filter(int => int.toLowerCase().includes(medicationForm.interval.toLowerCase()))
                          .map((int, index) => (
                            <div
                              key={index}
                              className="dropdown-item"
                              onClick={() => selectOption('interval', int)}
                            >
                              {int}
                            </div>
                          ))}
                      </div>
                    )}

                  </div>
                </div>
                

                
                <div className="form-group">
                  <label htmlFor="timeOfDay" className="form-label">Time of Day</label>
                  <div className="dropdown-container">
                    <div className="input-with-clear">
                      <input
                        type="text"
                        id="timeOfDay"
                        className="form-input"
                        value={medicationForm.timeOfDay}
                        onChange={(e) => handleMedicationChange('timeOfDay', e.target.value)}
                        onKeyPress={(e) => handleKeyPress('timeOfDay', e)}
                        placeholder="Select or type time of day..."
                        onClick={() => toggleDropdown('timeOfDay')}
                      />
                      {medicationForm.timeOfDay && (
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => handleMedicationChange('timeOfDay', '')}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {showDropdowns.timeOfDay && (
                      <div className="dropdown-list">
                        {translationOptions.englishTimeOfDayOptions
                          .filter(time => time.toLowerCase().includes(medicationForm.timeOfDay.toLowerCase()))
                          .map((time, index) => (
                            <div
                              key={index}
                              className="dropdown-item"
                              onClick={() => selectOption('timeOfDay', time)}
                            >
                              {time}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Precautions</h3>
                
                <div className="form-group">
                  <label className="form-label">Add Precautions</label>
                  <div className="precautions-container">
                    <div className="precautions-search">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search precautions..."
                        value={precautionSearch}
                        onChange={(e) => setPrecautionSearch(e.target.value)}
                        onClick={() => toggleDropdown('precautions')}
                      />
                    </div>
                    
                    {showDropdowns.precautions && (
                      <div className="precautions-dropdown">
                        {translationOptions.englishPrecautionOptions
                          .filter(precaution => 
                            precaution.toLowerCase().includes(precautionSearch.toLowerCase()) &&
                            !medicationForm.precautions.includes(precaution)
                          )
                          .map((precaution) => (
                            <div
                              key={precaution}
                              className="precaution-dropdown-item"
                              onClick={() => selectPrecaution(precaution)}
                            >
                              {precaution}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="precautions-textarea">
                    <textarea
                      className="form-input"
                      value={medicationForm.precautions.join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').filter(line => line.trim());
                        setMedicationForm(prev => ({
                          ...prev,
                          precautions: lines
                        }));
                      }}
                      placeholder="Selected precautions will appear here, or type directly..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div className="right-panel">
            <div className="panel-header">
              <h2 className="panel-title">Generated Instructions</h2>
            </div>
            
            <div className="instructions-container">
              <div className="instruction-section">
                <h3>Generated Instructions</h3>
                <textarea
                  className="instruction-textarea"
                  value={instructionDisplay.english || ''}
                  onChange={(e) => handleInstructionChange('english', e.target.value)}
                  placeholder="Fill in the medication details to generate instructions."
                  rows={6}
                />
              </div>
              
              <div className="instruction-section">
                <h3>Translated Instructions</h3>
                <textarea
                  className="instruction-textarea"
                  value={instructionDisplay.translated || ''}
                  onChange={(e) => handleInstructionChange('translated', e.target.value)}
                  placeholder="Select a language to see translated instructions."
                  rows={6}
                />
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={handleAddAnotherMedication}>
                Add Another Medication
              </button>
            </div>
            
            <div className="continue-button-container">
              <button 
                className="btn btn-primary continue-btn" 
                onClick={handleContinueToReview}
                disabled={!instructionDisplay.english}
              >
                Continue to Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationPage;
