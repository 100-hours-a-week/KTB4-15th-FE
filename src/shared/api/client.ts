import ky from 'ky';

const apiClient = ky.create({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  credentials: 'include',
  timeout: 10000,
  retry: {
    limit: 2,
  }
});