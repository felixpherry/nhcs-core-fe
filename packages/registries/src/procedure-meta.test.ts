import { describe, it, expect } from 'vitest';
import { registerProcedure, getProcedureMeta, getPolicy } from './procedure-meta';

describe('procedure-meta', () => {
  it('registers and retrieves a procedure', () => {
    const meta = registerProcedure('test.list', {
      mode: 'proxy',
      type: 'list',
      criticality: 'critical',
    });

    expect(meta.requestClass).toBe('proxy:list:critical');
    expect(getProcedureMeta('test.list')).toEqual(meta);
  });

  it('derives correct policy from requestClass', () => {
    const policy = getPolicy('proxy:list:critical');

    expect(policy.timeout).toBe(15_000);
    expect(policy.maxRetries).toBe(2);
    expect(policy.driftBehavior).toBe('dead-state');
  });

  it('throws on unknown procedure', () => {
    expect(() => getProcedureMeta('nonexistent')).toThrow('Procedure "nonexistent" not registered');
  });

  it('throws on unknown requestClass', () => {
    expect(() => getPolicy('banana:fish:yellow')).toThrow(
      'No policy for requestClass: banana:fish:yellow',
    );
  });
});
