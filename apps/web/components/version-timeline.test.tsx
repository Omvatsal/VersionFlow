import { describe, expect, it } from 'vitest';
import { getTimelineStatusLabel } from '../lib/version-timeline';

describe('version timeline labels', () => {
  it('presents published versions as active', () => {
    expect(getTimelineStatusLabel('published')).toBe('Active');
  });

  it('capitalizes lifecycle statuses', () => {
    expect(getTimelineStatusLabel('deprecated')).toBe('Deprecated');
  });
});
