// Mock data service
export const getProfile = () => Promise.resolve({ 
  data: { name: "Test User", email: "test@example.com" } 
});

export const getAssets = () => Promise.resolve({ 
  data: [
    { id: 1, type: 'Property', name: 'Family Home', value: '450000', description: 'Residential property', created_at: '2023-10-15' },
    { id: 2, type: 'Investment', name: 'Stock Portfolio', value: '125000', description: 'Diversified stocks', created_at: '2023-09-20' }
  ] 
});

export const getInsurancePolicies = () => Promise.resolve({ 
  data: [{ id: 1, provider: 'ABC Insurance', policy_number: 'POL123456', coverage_amount: '500000', expiry_date: '2025-12-31', created_at: '2023-11-01' }] 
});

export const getLegalDocuments = () => Promise.resolve({ 
  data: [{ id: 1, document_type: 'Will', title: 'Last Will', file_url: '#', created_at: '2023-10-20' }] 
});

export const getNominees = () => Promise.resolve({ 
  data: [{ id: 1, name: 'John Doe', relationship: 'Spouse', contact: '+91 9876543210', share_percentage: '50', created_at: '2023-10-15' }] 
});