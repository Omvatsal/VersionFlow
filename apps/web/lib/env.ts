export type WebEnv = { NEXT_PUBLIC_API_URL: string };

export function getWebEnv(): WebEnv {
  return { NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api/v1' };
}

