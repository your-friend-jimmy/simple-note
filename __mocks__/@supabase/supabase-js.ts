// __mocks__/@supabase/supabase-js.ts

// Mock the overall client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  // Add any other Supabase functions that your application uses
  // For example, for auth:
  // auth: {
  //   signUp: jest.fn(),
  //   signIn: jest.fn(),
  //   signOut: jest.fn(),
  //   user: jest.fn(),
  //   onAuthStateChange: jest.fn().mockReturnValue({
  //     data: { subscription: { unsubscribe: jest.fn() } },
  //   }),
  // },
  // storage: {
  //   from: jest.fn().mockReturnThis(),
  //   upload: jest.fn(),
  //   download: jest.fn(),
  //   remove: jest.fn(),
  //   // ... other storage methods
  // },
};

// Mock the createClient function
export const createClient = jest.fn(() => mockSupabaseClient);

// You can also export functions to easily access or reset parts of the mock
export const mock__from = mockSupabaseClient.from;
export const mock__select = mockSupabaseClient.select;
export const mock__insert = mockSupabaseClient.insert;
export const mock__update = mockSupabaseClient.update;
export const mock__delete = mockSupabaseClient.delete;
export const mock__eq = mockSupabaseClient.eq;
export const mock__order = mockSupabaseClient.order;
export const mock__single = mockSupabaseClient.single;

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  mockSupabaseClient.from.mockReturnThis(); // Ensure chaining is restored
  mockSupabaseClient.select.mockReturnThis();
  mockSupabaseClient.insert.mockReturnThis();
  mockSupabaseClient.update.mockReturnThis();
  mockSupabaseClient.delete.mockReturnThis();
  mockSupabaseClient.eq.mockReturnThis();
  mockSupabaseClient.order.mockReturnThis();
  mockSupabaseClient.single.mockReturnThis();

  mock__from.mockClear();
  mock__select.mockClear();
  mock__insert.mockClear();
  mock__update.mockClear();
  mock__delete.mockClear();
  mock__eq.mockClear();
  mock__order.mockClear();
  mock__single.mockClear();

  // Reset specific resolutions if needed, e.g.:
  // mock__select.mockResolvedValue({ data: [], error: null });
};

// Optionally, automatically reset mocks before each test if you prefer
// beforeEach(() => {
//   resetSupabaseMocks();
// });

// Log that the mock is being used (optional, for debugging)
// console.log('Using mocked Supabase client: __mocks__/@supabase/supabase-js.ts');
