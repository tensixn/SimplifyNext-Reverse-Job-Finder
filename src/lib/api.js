async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const generateProfile = (userId) =>
  post('/api/generate-profile', { user_id: userId });

export const matchCompanies = (userId) =>
  post('/api/match-companies', { user_id: userId });

export const generatePitch = (userId, companyId) =>
  post('/api/generate-pitch', { user_id: userId, company_id: companyId });
