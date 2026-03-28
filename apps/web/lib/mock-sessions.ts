import type { Session } from '@d2d/types';
import { getMockAuth } from './mock-auth';

const SESSIONS_STORAGE_KEY = 'd2d_mock_sessions';

export interface MockSessionsData {
  sessions: Session[];
  userId: string | null;
  initialized: boolean;
}

// Browser/OS combinations for mock data
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Arc'];
const OPERATING_SYSTEMS = ['macOS Sonoma', 'Windows 11', 'Ubuntu 22.04', 'iOS 17', 'Android 14'];
const DEVICES = ['MacBook Pro', 'Windows Desktop', 'iPhone 15', 'iPad Pro', 'Pixel 8', 'ThinkPad X1'];
const LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'London, UK',
  'Tokyo, Japan',
  'Berlin, Germany',
  'Sydney, Australia',
];

function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockSessions(): Session[] {
  const sessions: Session[] = [];

  // Current session (always first)
  sessions.push({
    id: 'session_current',
    deviceName: 'MacBook Pro',
    browser: 'Chrome',
    os: 'macOS Sonoma',
    location: 'San Francisco, CA',
    ipAddress: '192.168.1.1',
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isCurrent: true,
  });

  // Generate 3-5 additional sessions
  const numSessions = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numSessions; i++) {
    const createdAt = new Date(
      Date.now() - (i + 1) * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000
    );
    const lastActiveAt = new Date(
      createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())
    );

    sessions.push({
      id: `session_${Date.now()}_${i}`,
      deviceName: getRandomElement(DEVICES),
      browser: getRandomElement(BROWSERS),
      os: getRandomElement(OPERATING_SYSTEMS),
      location: getRandomElement(LOCATIONS),
      ipAddress: generateRandomIP(),
      lastActiveAt: lastActiveAt.toISOString(),
      createdAt: createdAt.toISOString(),
      isCurrent: false,
    });
  }

  return sessions;
}

export function getMockSessions(): MockSessionsData {
  if (typeof window === 'undefined') {
    return { sessions: [], userId: null, initialized: false };
  }

  const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!data) {
    return { sessions: [], userId: null, initialized: false };
  }

  try {
    return JSON.parse(data);
  } catch {
    return { sessions: [], userId: null, initialized: false };
  }
}

export function setMockSessions(data: Partial<MockSessionsData>): void {
  if (typeof window === 'undefined') return;
  const current = getMockSessions();
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify({ ...current, ...data }));
}

export function initializeMockSessions(): MockSessionsData {
  const existing = getMockSessions();
  const mockAuth = getMockAuth();
  const currentUserId = mockAuth.user?.id || null;

  // Check if sessions were initialized for a different user
  if (existing.initialized && currentUserId && existing.userId !== currentUserId) {
    clearMockSessions();
    const mockData: MockSessionsData = {
      sessions: generateMockSessions(),
      userId: currentUserId,
      initialized: true,
    };
    setMockSessions(mockData);
    return mockData;
  }

  if (existing.initialized) {
    return existing;
  }

  const mockData: MockSessionsData = {
    sessions: generateMockSessions(),
    userId: currentUserId,
    initialized: true,
  };

  setMockSessions(mockData);
  return mockData;
}

export function clearMockSessions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSIONS_STORAGE_KEY);
}

export function revokeSession(sessionId: string): void {
  const data = getMockSessions();
  data.sessions = data.sessions.filter((s) => s.id !== sessionId);
  setMockSessions(data);
}

export function revokeAllOtherSessions(): void {
  const data = getMockSessions();
  data.sessions = data.sessions.filter((s) => s.isCurrent);
  setMockSessions(data);
}
