import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // ramp-up para 10 VUs
    { duration: '30s', target: 10 },  // sustenta 10 VUs
    { duration: '10s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],       // menos de 1% de erros
    http_req_duration: ['p(95)<200'],       // 95% das requisições abaixo de 200ms
  },
};

const BASE_URL = 'http://host.docker.internal:8080';

export default function () {
  group('ping', () => {
    const res = http.get(`${BASE_URL}/ping`);
    check(res, {
      'status 200':            (r) => r.status === 200,
      'body contém pong':      (r) => r.json('message') === 'pong',
    });
  });

  group('listar items', () => {
    const res = http.get(`${BASE_URL}/items`);
    check(res, {
      'status 200':         (r) => r.status === 200,
      'retorna array':      (r) => Array.isArray(r.json()),
      'pelo menos 1 item':  (r) => r.json().length > 0,
    });
  });

  group('buscar item por id', () => {
    const res = http.get(`${BASE_URL}/items/1`);
    check(res, {
      'status 200':     (r) => r.status === 200,
      'id correto':     (r) => r.json('id') === 1,
    });

    const notFound = http.get(`${BASE_URL}/items/999`, {
      responseCallback: http.expectedStatuses(404),
    });
    check(notFound, {
      'status 404 para id inexistente': (r) => r.status === 404,
    });
  });

  group('criar item', () => {
    const payload = JSON.stringify({ name: 'Mango', price: 2.50 });
    const params  = { headers: { 'Content-Type': 'application/json' } };
    const res     = http.post(`${BASE_URL}/items`, payload, params);
    check(res, {
      'status 201':       (r) => r.status === 201,
      'name correto':     (r) => r.json('name') === 'Mango',
      'id foi gerado':    (r) => r.json('id') > 0,
    });
  });

  sleep(1);
}
