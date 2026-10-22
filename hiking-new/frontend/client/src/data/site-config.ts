export const SITE_CONTACT = {
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || 'contact@hikingchina.com',
  phone: (import.meta.env.VITE_CONTACT_PHONE as string | undefined) || '400-123-4567',
  address: (import.meta.env.VITE_CONTACT_ADDRESS as string | undefined) || '北京市朝阳区',
  icp: (import.meta.env.VITE_ICP_NUMBER as string | undefined) || '',
};
