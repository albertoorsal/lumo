export interface CompanyRequest {
  code: string;
  name: string;
}

export type CreateCompanyRequest = CompanyRequest;

export interface UpdateCompanyRequest {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface CompanyResponse {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
