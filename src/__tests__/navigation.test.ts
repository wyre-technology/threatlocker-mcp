import { describe, it, expect } from 'vitest';
import { getState, getNavigationTools, getBackTool, DOMAINS } from '../domains/navigation.js';

describe('Navigation', () => {
  it('should return null domain initially', () => {
    const state = getState('test-1');
    expect(state.currentDomain).toBeNull();
  });

  it('should track domain state', () => {
    const state = getState('test-2');
    state.currentDomain = 'approval_requests';
    expect(getState('test-2').currentDomain).toBe('approval_requests');
  });

  it('should isolate sessions', () => {
    const s1 = getState('test-3');
    const s2 = getState('test-4');
    s1.currentDomain = 'computers';
    expect(s2.currentDomain).toBeNull();
  });

  it('should have all v0.1.0 domains', () => {
    expect(DOMAINS).toContain('computers');
    expect(DOMAINS).toContain('computer_groups');
    expect(DOMAINS).toContain('approval_requests');
    expect(DOMAINS).toContain('audit_log');
    expect(DOMAINS).toContain('organizations');
  });

  it('should return navigation tools', () => {
    const tools = getNavigationTools();
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('threatlocker_navigate');
    expect(tools[1].name).toBe('threatlocker_status');
  });

  it('should return back tool', () => {
    const tool = getBackTool();
    expect(tool.name).toBe('threatlocker_back');
  });
});
