import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  registerDependency,
  resolveDependency,
  hasDependency,
  clearDependencies,
  clearDependency,
  DI_TOKENS,
  initializeDefaultDependencies,
} from '@/lib/dependency-injection';

describe('Dependency Injection Integration Tests', () => {
  beforeEach(() => {
    clearDependencies();
  });

  afterEach(() => {
    clearDependencies();
  });

  it('should register and resolve a singleton dependency', () => {
    const factory = () => ({ value: 'test' });
    registerDependency('TEST_TOKEN', factory, true);

    const instance1 = resolveDependency<{ value: string }>('TEST_TOKEN');
    const instance2 = resolveDependency<{ value: string }>('TEST_TOKEN');

    expect(instance1).toEqual({ value: 'test' });
    expect(instance1).toBe(instance2); // Same instance (singleton)
  });

  it('should register and resolve a transient dependency', () => {
    let counter = 0;
    const factory = () => ({ value: counter++ });
    registerDependency('TEST_TOKEN', factory, false);

    const instance1 = resolveDependency<{ value: number }>('TEST_TOKEN');
    const instance2 = resolveDependency<{ value: number }>('TEST_TOKEN');

    expect(instance1.value).toBe(0);
    expect(instance2.value).toBe(1);
    expect(instance1).not.toBe(instance2); // Different instances (transient)
  });

  it('should check if dependency exists', () => {
    expect(hasDependency('NON_EXISTENT_TOKEN')).toBe(false);

    registerDependency('TEST_TOKEN', () => ({ value: 'test' }), true);
    expect(hasDependency('TEST_TOKEN')).toBe(true);
  });

  it('should throw error when resolving non-existent dependency', () => {
    expect(() => resolveDependency('NON_EXISTENT_TOKEN')).toThrow('Dependency not registered');
  });

  it('should clear all dependencies', () => {
    registerDependency('TEST_TOKEN1', () => ({ value: 'test1' }), true);
    registerDependency('TEST_TOKEN2', () => ({ value: 'test2' }), true);

    expect(hasDependency('TEST_TOKEN1')).toBe(true);
    expect(hasDependency('TEST_TOKEN2')).toBe(true);

    clearDependencies();

    expect(hasDependency('TEST_TOKEN1')).toBe(false);
    expect(hasDependency('TEST_TOKEN2')).toBe(false);
  });

  it('should clear specific dependency', () => {
    registerDependency('TEST_TOKEN1', () => ({ value: 'test1' }), true);
    registerDependency('TEST_TOKEN2', () => ({ value: 'test2' }), true);

    clearDependency('TEST_TOKEN1');

    expect(hasDependency('TEST_TOKEN1')).toBe(false);
    expect(hasDependency('TEST_TOKEN2')).toBe(true);
  });

  it('should initialize default dependencies', () => {
    initializeDefaultDependencies();

    expect(hasDependency(DI_TOKENS.LOGGER)).toBe(true);
    expect(hasDependency(DI_TOKENS.FEATURE_FLAGS)).toBe(true);
    expect(hasDependency(DI_TOKENS.CONFIG)).toBe(true);

    const logger = resolveDependency<{ error: Function }>(DI_TOKENS.LOGGER);
    expect(logger).toBeDefined();
    expect(typeof logger.error).toBe('function');
  });

  it('should resolve feature flags', () => {
    initializeDefaultDependencies();
    const featureFlags = resolveDependency(DI_TOKENS.FEATURE_FLAGS);

    expect(featureFlags).toBeDefined();
    expect(typeof featureFlags).toBe('object');
  });

  it('should resolve config', () => {
    initializeDefaultDependencies();
    const config = resolveDependency(DI_TOKENS.CONFIG);

    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });
});
