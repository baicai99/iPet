import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(95)<200'],
  },
};

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const email = __ENV.PERF_EMAIL || 'perf@example.com';
const password = __ENV.PERF_PASSWORD || 'perf-password';
const petId = __ENV.PERF_PET_ID;

export function setup() {
  const loginRes = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const ok = check(loginRes, {
    'login status is 201/200': (r) => r.status === 201 || r.status === 200,
  });

  if (!ok) {
    throw new Error(`login failed: status=${loginRes.status} body=${loginRes.body}`);
  }

  const token = loginRes.json('accessToken');
  if (!token) {
    throw new Error(`missing accessToken in login response: ${loginRes.body}`);
  }

  return { token };
}

export default function (data) {
  const authHeaders = {
    Authorization: `Bearer ${data.token}`,
  };

  const listRes = http.get(`${baseUrl}/api/articles?category=all&page=1&limit=20`);
  check(listRes, { 'articles list 200': (r) => r.status === 200 });

  const petsRes = http.get(`${baseUrl}/api/pets`, { headers: authHeaders });
  check(petsRes, { 'pets list 200': (r) => r.status === 200 });

  if (petId) {
    const summaryRes = http.get(`${baseUrl}/api/health/summary?petId=${encodeURIComponent(petId)}`, {
      headers: authHeaders,
    });
    check(summaryRes, { 'health summary 200': (r) => r.status === 200 });
  }

  sleep(1);
}

