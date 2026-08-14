import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeLeft } from './countdown.js';

const target = new Date('2026-10-03T21:00:00Z');

test('faltan varios días', () => {
  const now = new Date('2026-10-01T18:30:15Z');
  assert.deepEqual(timeLeft(target, now), {
    dias: 2, horas: 2, minutos: 29, segundos: 45, llego: false,
  });
});

test('falta menos de un día', () => {
  const now = new Date('2026-10-03T18:00:00Z');
  assert.deepEqual(timeLeft(target, now), {
    dias: 0, horas: 3, minutos: 0, segundos: 0, llego: false,
  });
});

test('ya pasó', () => {
  const now = new Date('2026-10-04T00:00:00Z');
  assert.deepEqual(timeLeft(target, now), {
    dias: 0, horas: 0, minutos: 0, segundos: 0, llego: true,
  });
});
