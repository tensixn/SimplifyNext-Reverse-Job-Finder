async function post(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: 'Network error — could not reach the server.' };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { error: `Server returned an unreadable response (status ${res.status}).` };
  }

  if (!res.ok && !data.error) {
    return { error: `Request failed (status ${res.status}).` };
  }

  return data;
}

export const generateProfile = (userId) =>
  post('/api/generate-profile', { user_id: userId });

export const matchCompanies = (userId) =>
  post('/api/match-companies', { user_id: userId });

export const generatePitch = (userId, companyId) =>
  post('/api/generate-pitch', { user_id: userId, company_id: companyId });

export const checkNewMatches = (userId) =>
  post('/api/check-new-matches', { user_id: userId });

export const addProfileInput = (userId, kind, content) =>
  post('/api/add-profile-input', { user_id: userId, kind, content });

export const resetDemo = (userId) =>
  post('/api/reset-demo', { user_id: userId });
