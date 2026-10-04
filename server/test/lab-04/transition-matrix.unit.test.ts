import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  getPermittedNextStatuses,
  PERMITTED_STATUS_TRANSITIONS,
} from '../../src/utils/statusTransitions';

describe('UNIT-01: Status Transition Matrix Validator (BR-09 / AC-09)', () => {
  it('should allow valid transitions from NEW', () => {
    expect(isValidTransition('NEW', 'OPEN')).toBe(true);
    expect(isValidTransition('NEW', 'IN_PROGRESS')).toBe(true);
    expect(isValidTransition('NEW', 'CANCELLED')).toBe(true);
    expect(isValidTransition('New', 'Open')).toBe(true);
    expect(isValidTransition('New', 'In Progress')).toBe(true);
  });

  it('should reject invalid direct transitions from NEW', () => {
    expect(isValidTransition('NEW', 'RESOLVED')).toBe(false);
    expect(isValidTransition('NEW', 'CLOSED')).toBe(false);
    expect(isValidTransition('NEW', 'WAITING_FOR_REQUESTER')).toBe(false);
    expect(isValidTransition('New', 'Resolved')).toBe(false);
  });

  it('should allow valid transitions from OPEN', () => {
    expect(isValidTransition('OPEN', 'IN_PROGRESS')).toBe(true);
    expect(isValidTransition('OPEN', 'WAITING_FOR_REQUESTER')).toBe(true);
    expect(isValidTransition('OPEN', 'RESOLVED')).toBe(true);
    expect(isValidTransition('OPEN', 'CANCELLED')).toBe(true);
  });

  it('should reject invalid transitions from OPEN', () => {
    expect(isValidTransition('OPEN', 'CLOSED')).toBe(false);
    expect(isValidTransition('OPEN', 'NEW')).toBe(false);
  });

  it('should allow valid transitions from IN_PROGRESS', () => {
    expect(isValidTransition('IN_PROGRESS', 'WAITING_FOR_REQUESTER')).toBe(true);
    expect(isValidTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
    expect(isValidTransition('IN_PROGRESS', 'CANCELLED')).toBe(true);
  });

  it('should allow valid transitions from WAITING_FOR_REQUESTER', () => {
    expect(isValidTransition('WAITING_FOR_REQUESTER', 'IN_PROGRESS')).toBe(true);
    expect(isValidTransition('WAITING_FOR_REQUESTER', 'RESOLVED')).toBe(true);
    expect(isValidTransition('WAITING_FOR_REQUESTER', 'CANCELLED')).toBe(true);
  });

  it('should allow valid transitions from RESOLVED', () => {
    expect(isValidTransition('RESOLVED', 'CLOSED')).toBe(true);
    expect(isValidTransition('RESOLVED', 'REOPENED')).toBe(true);
    expect(isValidTransition('Resolved', 'Closed')).toBe(true);
    expect(isValidTransition('Resolved', 'Reopened')).toBe(true);
  });

  it('should reject invalid transitions from RESOLVED', () => {
    expect(isValidTransition('RESOLVED', 'OPEN')).toBe(false);
    expect(isValidTransition('RESOLVED', 'IN_PROGRESS')).toBe(false);
    expect(isValidTransition('RESOLVED', 'NEW')).toBe(false);
  });

  it('should allow valid transitions from CLOSED', () => {
    expect(isValidTransition('CLOSED', 'REOPENED')).toBe(true);
    expect(isValidTransition('Closed', 'Reopened')).toBe(true);
  });

  it('should reject invalid transitions from CLOSED', () => {
    expect(isValidTransition('CLOSED', 'OPEN')).toBe(false);
    expect(isValidTransition('CLOSED', 'RESOLVED')).toBe(false);
  });

  it('should treat CANCELLED as a terminal status with no outbound transitions', () => {
    expect(PERMITTED_STATUS_TRANSITIONS['CANCELLED']).toEqual([]);
    expect(isValidTransition('CANCELLED', 'NEW')).toBe(false);
    expect(isValidTransition('CANCELLED', 'OPEN')).toBe(false);
    expect(isValidTransition('CANCELLED', 'REOPENED')).toBe(false);
  });

  it('should correctly list permitted next statuses via getPermittedNextStatuses', () => {
    expect(getPermittedNextStatuses('New')).toEqual(['OPEN', 'IN_PROGRESS', 'CANCELLED']);
    expect(getPermittedNextStatuses('Resolved')).toEqual(['CLOSED', 'REOPENED']);
    expect(getPermittedNextStatuses('Cancelled')).toEqual([]);
    expect(getPermittedNextStatuses('UNKNOWN_STATUS')).toEqual([]);
  });
});

