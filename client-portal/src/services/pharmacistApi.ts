// API service for pharmacist management

const API_BASE_URL = 'http://localhost:3001/api';

export interface Pharmacist {
  id: string;
  name: string;
  surname: string;
  pNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacistFormData {
  name: string;
  surname: string;
  pNumber: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  total?: number;
}

class PharmacistApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getPharmacists(): Promise<ApiResponse<Pharmacist[]>> {
    return this.makeRequest<Pharmacist[]>('/pharmacists');
  }

  async getPharmacist(id: string): Promise<ApiResponse<Pharmacist>> {
    return this.makeRequest<Pharmacist>(`/pharmacists/${id}`);
  }

  async createPharmacist(pharmacistData: PharmacistFormData): Promise<ApiResponse<Pharmacist>> {
    const token = localStorage.getItem('token');
    return this.makeRequest<Pharmacist>('/pharmacists', {
      method: 'POST',
      body: JSON.stringify(pharmacistData),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async updatePharmacist(
    id: string,
    pharmacistData: Partial<PharmacistFormData>
  ): Promise<ApiResponse<Pharmacist>> {
    return this.makeRequest<Pharmacist>(`/pharmacists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pharmacistData),
    });
  }

  async deletePharmacist(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/pharmacists/${id}`, {
      method: 'DELETE',
    });
  }

  async authenticatePharmacist(pNumber: string, password: string): Promise<ApiResponse<{
    id: string;
    name: string;
    surname: string;
    pNumber: string;
  }>> {
    return this.makeRequest('/pharmacists/auth', {
      method: 'POST',
      body: JSON.stringify({ pNumber, password }),
    });
  }
}

export const pharmacistApi = new PharmacistApiService();

// Error handling utility
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
