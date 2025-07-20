// Mock authentication service for development
// This allows the app to work without a valid Supabase connection

export interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

const MOCK_USERS_KEY = 'holodraft_mock_users';
const CURRENT_USER_KEY = 'holodraft_current_user';

// Get stored mock users
function getMockUsers(): { email: string; password: string; user: MockUser }[] {
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Store mock users
function storeMockUsers(users: { email: string; password: string; user: MockUser }[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

// Mock sign up
export async function mockSignUp(email: string, password: string) {
  console.log('🧪 Mock sign up for:', email);
  
  const users = getMockUsers();
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    return {
      data: null,
      error: { message: 'User already exists' }
    };
  }
  
  const newUser: MockUser = {
    id: `mock_user_${Date.now()}`,
    email,
    created_at: new Date().toISOString()
  };
  
  users.push({ email, password, user: newUser });
  storeMockUsers(users);
  
  // Set as current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  
  return {
    data: { user: newUser },
    error: null
  };
}

// Mock sign in
export async function mockSignIn(email: string, password: string) {
  console.log('🧪 Mock sign in for:', email);
  
  const users = getMockUsers();
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return {
      data: null,
      error: { message: 'Invalid credentials' }
    };
  }
  
  // Set as current user
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user.user));
  
  return {
    data: { user: user.user },
    error: null
  };
}

// Mock sign out
export async function mockSignOut() {
  console.log('🧪 Mock sign out');
  localStorage.removeItem(CURRENT_USER_KEY);
  return { error: null };
}

// Get current mock user
export function getCurrentMockUser(): MockUser | null {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Test mock connection (always succeeds)
export async function testMockConnection() {
  console.log('🧪 Testing mock connection...');
  return { success: true, error: null };
}
