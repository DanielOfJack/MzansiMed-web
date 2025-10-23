const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface Patient {
  id: string;
  initials: string;
  surname: string;
  address: string;
  cellNumber: string;
  homeLanguage: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientFormData {
  initials: string;
  surname: string;
  address: string;
  cellNumber: string;
  homeLanguage: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  interval?: string;
  timeOfDay?: string;
  precautions: string[];
  englishInstructions?: string;
  translatedInstructions?: string;
  targetLanguage?: string;
  prescribedDate: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    initials: string;
    surname: string;
    homeLanguage: string;
  };
}

export interface MedicationFormData {
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  interval?: string;
  timeOfDay?: string;
  precautions: string[];
  englishInstructions?: string;
  translatedInstructions?: string;
  targetLanguage?: string;
}

export interface MedicationsResponse {
  success: boolean;
  data: Medication[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface MedicationResponse {
  success: boolean;
  data: Medication;
  message?: string;
}

export interface PatientsResponse {
  success: boolean;
  data: Patient[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface PatientResponse {
  success: boolean;
  data: Patient;
  message?: string;
}

export interface TranslationOption {
  english: string;
  afrikaans: string;
  isiXhosa: string;
  isiZulu: string;
}

export interface TranslationOptionsResponse {
  success: boolean;
  data: {
    type?: string;
    options: TranslationOption[];
    englishOptions: string[];
  };
}

export interface AllTranslationOptionsResponse {
  success: boolean;
  data: {
    dosage: {
      options: TranslationOption[];
      englishOptions: string[];
    };
    frequency: {
      options: TranslationOption[];
      englishOptions: string[];
    };
    intervals: {
      options: TranslationOption[];
      englishOptions: string[];
    };
    time_of_day: {
      options: TranslationOption[];
      englishOptions: string[];
    };
    precautions: {
      options: TranslationOption[];
      englishOptions: string[];
    };
    static: {
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
    };
  };
}

export interface TranslateRequest {
  text: string;
  type: string;
  targetLanguage: string;
}

export interface BatchTranslateRequest {
  translations: Array<{
    text: string;
    type: string;
  }>;
  targetLanguage: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  error?: string;
}

export interface TranslationResponse {
  success: boolean;
  data: TranslationResult;
}

export interface BatchTranslationResponse {
  success: boolean;
  data: TranslationResult[];
}

export interface MedicationOption {
  id: string;
  name: string;
  searchTerms: string;
}

export interface MedicationOptionsResponse {
  success: boolean;
  data: MedicationOption[];
  total: number;
  limit?: number;
  query?: string;
}

export interface MedicationSuggestionsResponse {
  success: boolean;
  data: Array<{
    id: string;
    name: string;
  }>;
  query: string;
}

export interface MedicationOptionResponse {
  success: boolean;
  data: MedicationOption;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

class ApiError extends Error {
  public status: number;
  public response: ApiErrorResponse;

  constructor(status: number, response: ApiErrorResponse) {
    super(response.message);
    this.status = status;
    this.response = response;
  }
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(500, {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred'
    });
  }
};

export const patientsApi = {
  // Get all patients with optional filters
  getPatients: async (filters?: {
    search?: string;
    initials?: string;
    surname?: string;
    address?: string;
    cellNumber?: string;
    homeLanguage?: string;
    limit?: number;
    offset?: number;
  }): Promise<PatientsResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/patients${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PatientsResponse>(endpoint);
  },

  // Get a specific patient by ID
  getPatient: async (id: string): Promise<PatientResponse> => {
    return apiRequest<PatientResponse>(`/patients/${id}`);
  },

  // Create a new patient
  createPatient: async (patientData: PatientFormData): Promise<PatientResponse> => {
    return apiRequest<PatientResponse>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  // Update an existing patient
  updatePatient: async (id: string, patientData: PatientFormData): Promise<PatientResponse> => {
    return apiRequest<PatientResponse>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  },

  // Delete a patient
  deletePatient: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/patients/${id}`, {
      method: 'DELETE',
    });
  },

  // Health check
  healthCheck: async (): Promise<{ success: boolean; message: string; timestamp: string; version: string }> => {
    return apiRequest<{ success: boolean; message: string; timestamp: string; version: string }>('/health');
  }
};

export const medicationsApi = {
  // Get all medications with optional patient filter
  getMedications: async (filters?: {
    patientId?: string;
    limit?: number;
    offset?: number;
  }): Promise<MedicationsResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/medications${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<MedicationsResponse>(endpoint);
  },

  // Get a specific medication by ID
  getMedication: async (id: string): Promise<MedicationResponse> => {
    return apiRequest<MedicationResponse>(`/medications/${id}`);
  },

  // Create a new medication
  createMedication: async (medicationData: MedicationFormData): Promise<MedicationResponse> => {
    return apiRequest<MedicationResponse>('/medications', {
      method: 'POST',
      body: JSON.stringify(medicationData),
    });
  },

  // Update an existing medication
  updateMedication: async (id: string, medicationData: MedicationFormData): Promise<MedicationResponse> => {
    return apiRequest<MedicationResponse>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medicationData),
    });
  },

  // Delete a medication
  deleteMedication: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>(`/medications/${id}`, {
      method: 'DELETE',
    });
  }
};

export const translationsApi = {
  // Get all translation options for all types
  getAllOptions: async (): Promise<AllTranslationOptionsResponse> => {
    return apiRequest<AllTranslationOptionsResponse>('/translations/options');
  },

  // Get translation options for a specific type
  getOptions: async (type: string): Promise<TranslationOptionsResponse> => {
    return apiRequest<TranslationOptionsResponse>(`/translations/${type}/options`);
  },

  // Translate a single text
  translate: async (request: TranslateRequest): Promise<TranslationResponse> => {
    return apiRequest<TranslationResponse>('/translations/translate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Translate multiple texts in a batch
  translateBatch: async (request: BatchTranslateRequest): Promise<BatchTranslationResponse> => {
    return apiRequest<BatchTranslationResponse>('/translations/translate/batch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Clear translation cache (development only)
  clearCache: async (): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>('/translations/cache/clear', {
      method: 'POST',
    });
  }
};

export const medicationOptionsApi = {
  // Get all medication options
  getAll: async (): Promise<MedicationOptionsResponse> => {
    return apiRequest<MedicationOptionsResponse>('/medication-options');
  },

  // Search medications
  search: async (query: string, limit?: number): Promise<MedicationOptionsResponse> => {
    const params = new URLSearchParams({
      q: query,
      ...(limit && { limit: limit.toString() })
    });
    
    return apiRequest<MedicationOptionsResponse>(`/medication-options/search?${params}`);
  },

  // Get medication suggestions for autocomplete
  getSuggestions: async (query: string, limit?: number): Promise<MedicationSuggestionsResponse> => {
    const params = new URLSearchParams({
      q: query,
      ...(limit && { limit: limit.toString() })
    });
    
    return apiRequest<MedicationSuggestionsResponse>(`/medication-options/suggestions?${params}`);
  },

  // Get a specific medication by ID
  getById: async (id: string): Promise<MedicationOptionResponse> => {
    return apiRequest<MedicationOptionResponse>(`/medication-options/${id}`);
  },

  // Clear medication cache (development only)
  clearCache: async (): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>('/medication-options/cache/clear', {
      method: 'POST',
    });
  }
};

export const whatsappApi = {
  sendMessage: async (patientId: string, templateName: string, languageCode: string) => {
    return apiRequest<{ success: boolean; message: string }>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ patientId, templateName, languageCode }),
    });
  }
};

export { ApiError };
