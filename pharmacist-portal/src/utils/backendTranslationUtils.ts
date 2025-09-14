// Backend-based translation utilities
import { 
  translationsApi, 
  TranslationOption, 
  AllTranslationOptionsResponse,
  TranslationResult 
} from '../services/api';

interface TranslationCache {
  [key: string]: {
    options: TranslationOption[];
    englishOptions: string[];
    timestamp: number;
  };
}

interface StaticTranslations {
  take: {
    english: string;
    afrikaans: string;
    isiXhosa: string;
    isiZulu: string;
  };
  precautionsHeader: {
    english: string;
    afrikaans: string;
    isiXhosa: string;
    isiZulu: string;
  };
}

// Cache translations for 5 minutes to reduce API calls
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let translationCache: TranslationCache = {};
let staticTranslationsCache: StaticTranslations | null = null;
let cacheTimestamp = 0;

// Helper function to check if cache is still valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Load all translation options from backend
export const loadAllTranslationOptions = async (): Promise<AllTranslationOptionsResponse['data']> => {
  try {
    // Check if we have valid cached data
    if (cacheTimestamp && isCacheValid(cacheTimestamp) && Object.keys(translationCache).length > 0) {
      const cachedData: AllTranslationOptionsResponse['data'] = {
        dosage: translationCache.dosage || { options: [], englishOptions: [] },
        frequency: translationCache.frequency || { options: [], englishOptions: [] },
        intervals: translationCache.intervals || { options: [], englishOptions: [] },
        time_of_day: translationCache.time_of_day || { options: [], englishOptions: [] },
        precautions: translationCache.precautions || { options: [], englishOptions: [] },
        static: staticTranslationsCache || {
          take: { english: 'take', afrikaans: 'vat', isiXhosa: 'thabatha', isiZulu: 'thatha' },
          precautionsHeader: { english: 'Precautions', afrikaans: 'Voorsorgmaatreëls', isiXhosa: 'Ukulumkela', isiZulu: 'Ukuqaphela' }
        }
      };
      return cachedData;
    }

    const response = await translationsApi.getAllOptions();
    
    if (response.success) {
      // Update cache
      translationCache = {
        dosage: { ...response.data.dosage, timestamp: Date.now() },
        frequency: { ...response.data.frequency, timestamp: Date.now() },
        intervals: { ...response.data.intervals, timestamp: Date.now() },
        time_of_day: { ...response.data.time_of_day, timestamp: Date.now() },
        precautions: { ...response.data.precautions, timestamp: Date.now() }
      };
      staticTranslationsCache = response.data.static;
      cacheTimestamp = Date.now();
      
      return response.data;
    } else {
      throw new Error('Failed to load translation options');
    }
  } catch (error) {
    console.error('Error loading translation options:', error);
    
    // Return fallback data if API fails
    return getFallbackTranslationData();
  }
};

// Fallback data in case API is unavailable
const getFallbackTranslationData = (): AllTranslationOptionsResponse['data'] => {
  return {
    dosage: { options: [], englishOptions: [] },
    frequency: { options: [], englishOptions: [] },
    intervals: { options: [], englishOptions: [] },
    time_of_day: { options: [], englishOptions: [] },
    precautions: { options: [], englishOptions: [] },
    static: {
      take: { english: 'take', afrikaans: 'vat', isiXhosa: 'thabatha', isiZulu: 'thatha' },
      precautionsHeader: { english: 'Precautions', afrikaans: 'Voorsorgmaatreëls', isiXhosa: 'Ukulumkela', isiZulu: 'Ukuqaphela' }
    }
  };
};

// Get options for a specific type
export const getTranslationOptions = async (type: 'dosage' | 'frequency' | 'intervals' | 'time_of_day' | 'precautions'): Promise<{
  options: TranslationOption[];
  englishOptions: string[];
}> => {
  try {
    // Check cache first
    if (translationCache[type] && isCacheValid(translationCache[type].timestamp)) {
      return {
        options: translationCache[type].options,
        englishOptions: translationCache[type].englishOptions
      };
    }

    // Load from API
    const allData = await loadAllTranslationOptions();
    return allData[type];
  } catch (error) {
    console.error(`Error getting ${type} options:`, error);
    return { options: [], englishOptions: [] };
  }
};

// Generic translation function that works with backend
export const translateOption = async (
  englishText: string, 
  targetLanguage: string, 
  type: 'dosage' | 'frequency' | 'intervals' | 'time_of_day' | 'precautions'
): Promise<string> => {
  try {
    const response = await translationsApi.translate({
      text: englishText,
      type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
      targetLanguage
    });

    if (response.success) {
      return response.data.translatedText;
    } else {
      console.error('Translation failed:', response);
      return englishText;
    }
  } catch (error) {
    console.error('Error translating text:', error);
    return englishText;
  }
};

// Batch translation function for better performance
export const translateMultiple = async (
  translations: Array<{ text: string; type: string }>,
  targetLanguage: string
): Promise<TranslationResult[]> => {
  try {
    const response = await translationsApi.translateBatch({
      translations,
      targetLanguage
    });

    if (response.success) {
      return response.data;
    } else {
      console.error('Batch translation failed:', response);
      return translations.map(t => ({
        originalText: t.text,
        translatedText: t.text,
        targetLanguage
      }));
    }
  } catch (error) {
    console.error('Error in batch translation:', error);
    return translations.map(t => ({
      originalText: t.text,
      translatedText: t.text,
      targetLanguage
    }));
  }
};

// Specific translation functions for backward compatibility
export const translateDosage = async (englishDosage: string, targetLanguage: string): Promise<string> => 
  translateOption(englishDosage, targetLanguage, 'dosage');

export const translateFrequency = async (englishFrequency: string, targetLanguage: string): Promise<string> => 
  translateOption(englishFrequency, targetLanguage, 'frequency');

export const translateInterval = async (englishInterval: string, targetLanguage: string): Promise<string> => 
  translateOption(englishInterval, targetLanguage, 'intervals');

export const translateTimeOfDay = async (englishTimeOfDay: string, targetLanguage: string): Promise<string> => 
  translateOption(englishTimeOfDay, targetLanguage, 'time_of_day');

export const translatePrecaution = async (englishPrecaution: string, targetLanguage: string): Promise<string> => 
  translateOption(englishPrecaution, targetLanguage, 'precautions');

// Function to translate multiple precautions
export const translatePrecautions = async (englishPrecautions: string[], targetLanguage: string): Promise<string[]> => {
  const translations = englishPrecautions.map(precaution => ({
    text: precaution,
    type: 'Precautions'
  }));

  const results = await translateMultiple(translations, targetLanguage);
  return results.map(result => result.translatedText);
};

// Function to translate static words using backend
export const translateStatic = async (word: 'take' | 'precautionsHeader', targetLanguage: string): Promise<string> => {
  try {
    const response = await translationsApi.translate({
      text: word,
      type: 'static',
      targetLanguage
    });

    if (response.success) {
      return response.data.translatedText;
    } else {
      console.error('Static translation failed:', response);
      return word;
    }
  } catch (error) {
    console.error('Error translating static word:', error);
    return word;
  }
};

// Function to translate the word "take"
export const translateTake = async (targetLanguage: string): Promise<string> => 
  translateStatic('take', targetLanguage);

// Function to translate the word "Precautions"
export const translatePrecautionsHeader = async (targetLanguage: string): Promise<string> => 
  translateStatic('precautionsHeader', targetLanguage);

// Clear cache function (useful for development)
export const clearTranslationCache = (): void => {
  translationCache = {};
  staticTranslationsCache = null;
  cacheTimestamp = 0;
};

// Preload translations for better UX
export const preloadTranslations = async (): Promise<void> => {
  try {
    await loadAllTranslationOptions();
    console.log('Translations preloaded successfully');
  } catch (error) {
    console.error('Failed to preload translations:', error);
  }
};
