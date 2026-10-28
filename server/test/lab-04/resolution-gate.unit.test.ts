import { describe, it, expect } from 'vitest';
import { validateResolutionGate } from '../../src/utils/statusTransitions';

describe('UNIT-02: Resolution Gate Business Rule Validator (BR-10 / AC-06, AC-07)', () => {
  it('should block resolution when ticket has 0 Actions Taken, even with a valid summary', () => {
    const result = validateResolutionGate(0, 'Hardware component replaced and tested successfully.');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('At least one Action Taken');
  });

  it('should block resolution when resolutionSummary is empty or whitespace only', () => {
    const emptyResult = validateResolutionGate(2, '');
    expect(emptyResult.valid).toBe(false);

    const whitespaceResult = validateResolutionGate(1, '    \n  ');
    expect(whitespaceResult.valid).toBe(false);

    const nullResult = validateResolutionGate(1, null);
    expect(nullResult.valid).toBe(false);
  });

  it('should block resolution when resolutionSummary exceeds 1,000 characters', () => {
    const overlyLongSummary = 'A'.repeat(1001);
    const result = validateResolutionGate(1, overlyLongSummary);
    expect(result.valid).toBe(false);
  });

  it('should pass resolution gate when actions count is >= 1 and resolutionSummary is valid (1-1000 chars)', () => {
    const result = validateResolutionGate(1, 'Verified RAM module replacement solved memory leak issue.');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();

    const multiActionResult = validateResolutionGate(3, 'Diagnosed, replaced faulty network patch cable, verified connectivity.');
    expect(multiActionResult.valid).toBe(true);
  });
});

