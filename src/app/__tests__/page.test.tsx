// src/app/__tests__/page.test.tsx
import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page'; // Adjust path to your page component
import { supabase } from '@/lib/supabase'; // This will be the mock
import { getMockSummary } from '@/lib/mockAiSummary';

// Explicitly mock Supabase and other modules
jest.mock('@/lib/supabase', () => {
  const originalModule = jest.requireActual('@/lib/supabase'); // Get original for DbNote type if needed
  const {
    mock__from,
    mock__select,
    mock__insert,
    mock__update,
    mock__delete,
    mock__order,
    mock__eq,
    resetSupabaseMocks,
    createClient: mockCreateClient // Import the mock createClient
  } = jest.requireActual('../../../__mocks__/@supabase/supabase-js');

  return {
    ...originalModule,
    supabase: mockCreateClient(), // Ensure 'supabase' is the client instance from the mock
  };
});

jest.mock('@/lib/mockAiSummary', () => ({
  getMockSummary: jest.fn(),
}));

// Helper functions/variables from the mock to set up test conditions
// These are the actual jest.fn() mocks from the __mocks__ file
const { 
  resetSupabaseMocks, 
  mock__select, 
  mock__insert, 
  mock__delete, 
  mock__update, 
  mock__order, 
  mock__single, 
  mock__eq, 
  mock__from 
} = jest.requireActual('../../../__mocks__/@supabase/supabase-js');


describe('Home Page Integration Tests', () => {
  beforeEach(async () => {
    // First, fully reset mocks that use 'Once' behavior to clear their queues.
    mock__order.mockReset();
    mock__single.mockReset();
    mock__insert.mockReset(); 

    // Now, run the standard reset from the mock file.
    // This re-establishes .mockReturnThis() for chainable methods and clears call history.
    resetSupabaseMocks(); 

    // Then, establish default resolved values for the current test.
    mock__order.mockResolvedValue({ data: [], error: null }); 
    mock__single.mockResolvedValue({ data: null, error: { message: 'Default mock: No data for .single()', code: 'PGRST116'} });
    // mock__insert is now chainable again due to resetSupabaseMocks().
    // Its default behavior upon execution (if it were to resolve a value, which it doesn't directly in a chain) isn't set here,
    // as it's usually followed by .select().single() which *does* resolve.

    // Reset other non-Supabase mocks
    (getMockSummary as jest.Mock).mockClear();
  });

  test('renders loading state initially, then displays "No notes" message if DB is empty', async () => {
    render(<Home />);
    
    expect(screen.getByText(/loading notes.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/no notes yet. create your first note above!/i)).toBeInTheDocument();
    });

    // Verify Supabase calls for initial fetch
    expect(mock__from).toHaveBeenCalledWith('notes'); // supabase.from('notes')
    expect(mock__select).toHaveBeenCalledWith('*'); // .select('*')
    expect(mock__order).toHaveBeenCalledWith('timestamp', { ascending: false }); // .order(...)
  });

  test('displays existing notes if DB is not empty', async () => {
    const mockNotesData = [
      { id: '1', content: 'First test note', timestamp: new Date().toISOString(), user_id: 'test-user' },
      { id: '2', content: 'Second test note', timestamp: new Date().toISOString(), user_id: 'test-user' },
    ];
    // Ensure the mock for the final chained call resolves with the data
    mock__order.mockResolvedValue({ data: mockNotesData, error: null });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('First test note')).toBeInTheDocument();
      expect(screen.getByText('Second test note')).toBeInTheDocument();
    });

    // Verify Supabase calls
    expect(mock__from).toHaveBeenCalledWith('notes');
    expect(mock__select).toHaveBeenCalledWith('*');
    expect(mock__order).toHaveBeenCalledWith('timestamp', { ascending: false });
  });

  // --- Tests for adding notes ---

  test('allows user to add a new note', async () => {
    const user = userEvent.setup();
    const newNoteContent = 'This is a brand new note!';
    // The component expects the full note object back from the insert (due to .select().single())
    const mockNewNote = { id: '3', content: newNoteContent, timestamp: new Date().toISOString(), user_id: 'test-user' }; // Added user_id for consistency

    // Initial fetch is empty
    mock__order.mockResolvedValueOnce({ data: [], error: null }); 
    // Mock for insert
    // supabase.from('notes').insert([{ content: newNoteContent }]).select().single();
    mock__single.mockResolvedValueOnce({ data: mockNewNote, error: null });
    // Mock for the fetchNotes call that happens *after* adding a note.
    mock__order.mockResolvedValueOnce({ data: [mockNewNote], error: null });


    render(<Home />);

    // Wait for initial loading to complete
    await waitFor(() => expect(screen.getByText(/no notes yet/i)).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText(/write your note here.../i);
    const addButton = screen.getByRole('button', { name: /add note/i });

    await user.type(textarea, newNoteContent);
    expect(textarea).toHaveValue(newNoteContent);

    await act(async () => {
      await user.click(addButton);
    });

    // Verify the new note is displayed
    await waitFor(() => {
      expect(screen.getByText(newNoteContent)).toBeInTheDocument();
    });

    // Verify Supabase insert call
    // The component calls: supabase.from('notes').insert([{ content: currentNote }]).select().single();
    // Using mock__from for consistency with other direct mock checks
    expect(mock__from).toHaveBeenCalledWith('notes'); 
    expect(mock__insert).toHaveBeenCalledWith([{ content: newNoteContent }]);
    // Ensure that *a* call to mock__select was made with no arguments (for the insert chain)
    expect(mock__select.mock.calls.some(call => call.length === 0 || call[0] === undefined)).toBe(true);
    expect(mock__single).toHaveBeenCalledWith(); 

    // Verify textarea is cleared
    expect(textarea).toHaveValue("");
  });

  test('does not add a note if textarea is empty or whitespace', async () => {
    const user = userEvent.setup();
    // Initial fetch is empty
    mock__order.mockResolvedValueOnce({ data: [], error: null });

    render(<Home />);
    await waitFor(() => expect(screen.getByText(/no notes yet/i)).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText(/write your note here.../i);
    const addButton = screen.getByRole('button', { name: /add note/i });

    // Test with empty input
    await act(async () => {
      await user.click(addButton);
    });
    // insert should not have been called if input is empty
    expect(mock__insert).not.toHaveBeenCalled();
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument(); // Still no notes

    // Test with whitespace input
    await user.type(textarea, '   ');
    await act(async () => {
      await user.click(addButton);
    });
    // insert should not have been called if input is only whitespace
    expect(mock__insert).not.toHaveBeenCalled();
    // Textarea should retain whitespace for user to correct, as per typical UX,
    // though the prompt's page.tsx might clear it. Assuming it retains based on test.
    // If page.tsx clears it even for invalid input, this assertion would change.
    // The provided page.tsx clears it only on successful add.
    expect(textarea).toHaveValue('   '); 
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument(); 
  });

  // --- Tests for deleting notes ---

  test('allows user to delete a note', async () => {
    const user = userEvent.setup();
    const initialNotes = [
      { id: 'note-to-delete', content: 'This note will be deleted', timestamp: new Date().toISOString(), user_id: null },
      { id: 'note-to-keep', content: 'This note will remain', timestamp: new Date().toISOString(), user_id: null },
    ];

    // Mock for initial fetch
    // supabase.from('notes').select('*').order('timestamp', { ascending: false });
    mock__order.mockResolvedValueOnce({ data: initialNotes, error: null });
    
    // Mock for delete
    // supabase.from('notes').delete().eq('id', 'note-to-delete');
    // The .eq() is part of the chain, so the final call in this chain is .delete() or .eq() depending on how you view it.
    // Let's assume .eq is the final call that returns the promise in this mock setup.
    mock__eq.mockResolvedValueOnce({ error: null }); // Successful delete returns no specific data, just no error.

    // Mock for the fetchNotes call that happens *after* deleting a note.
    // It will be called again to refresh the list. Let's say it returns only the remaining note.
    const remainingNotes = initialNotes.filter(note => note.id === 'note-to-keep');
    mock__order.mockResolvedValueOnce({ data: remainingNotes, error: null });


    render(<Home />);

    // Wait for notes to be displayed
    await waitFor(() => {
      expect(screen.getByText('This note will be deleted')).toBeInTheDocument();
      expect(screen.getByText('This note will remain')).toBeInTheDocument();
    });

    // Find the delete button for the specific note.
    // We need a way to associate the delete button with the note.
    // Assuming the note content is within a Card, and the button is in its CardFooter.
    // The card structure based on previous DOM snapshots is a div with data-slot="card"
    const noteToDeleteElement = screen.getByText('This note will be deleted');
    // Find the parent card element. The text is inside a <p> inside a div with data-slot="card-content", which is inside the main card div.
    const cardElement = noteToDeleteElement.closest('div[data-slot="card"]'); 
    if (!cardElement) throw new Error('Could not find card element for the note: "This note will be deleted"');
    
    const deleteButton = within(cardElement).getByRole('button', { name: /delete/i });

    await act(async () => {
      await user.click(deleteButton);
    });

    // Verify the note is removed from the UI
    await waitFor(() => {
      expect(screen.queryByText('This note will be deleted')).not.toBeInTheDocument();
    });
    expect(screen.getByText('This note will remain')).toBeInTheDocument(); // Ensure other note is still there

    // Verify Supabase delete call
    // supabase.from('notes').delete().eq('id', 'note-to-delete')
    expect(mock__from).toHaveBeenCalledWith('notes'); // Called for initial fetch, delete, and subsequent fetch
    expect(mock__delete).toHaveBeenCalled(); // Called as part of the chain
    expect(mock__eq).toHaveBeenCalledWith('id', 'note-to-delete'); // Final part of the chain with the ID
  });

  // --- Tests for editing notes ---

  test('allows user to edit a note', async () => {
    const user = userEvent.setup();
    const originalContent = 'Original note content';
    const updatedContent = 'Updated note content!';
    const noteIdToEdit = 'note-to-edit';

    const initialNotes = [
      { id: noteIdToEdit, content: originalContent, timestamp: new Date().toISOString(), user_id: null },
      { id: 'another-note', content: 'Another note here', timestamp: new Date().toISOString(), user_id: null },
    ];
    // The component receives the updated note object from the .single() call.
    const mockUpdatedNoteFull = { id: noteIdToEdit, content: updatedContent, timestamp: new Date().toISOString(), user_id: null };

    // Mock for initial fetch
    mock__order.mockResolvedValueOnce({ data: initialNotes, error: null });
    
    // Mock for update chain: supabase.from('notes').update(...).eq(...).select().single();
    mock__single.mockResolvedValueOnce({ data: mockUpdatedNoteFull, error: null });

    // Mock for the fetchNotes call that happens *after* updating a note.
    const notesAfterUpdate = initialNotes.map(n => n.id === noteIdToEdit ? mockUpdatedNoteFull : n);
    mock__order.mockResolvedValueOnce({ data: notesAfterUpdate, error: null });


    render(<Home />);
    await waitFor(() => expect(screen.getByText(originalContent)).toBeInTheDocument());

    // Find the edit button for the specific note
    const noteElement = screen.getByText(originalContent);
    const cardElement = noteElement.closest('div[data-slot="card"]'); // Use established selector
    if (!cardElement) throw new Error('Could not find card element for the note to edit');
    const editButton = within(cardElement).getByRole('button', { name: /edit/i });

    // Start editing
    await act(async () => {
      await user.click(editButton);
    });
    
    const editTextarea = within(cardElement).getByDisplayValue(originalContent);
    expect(editTextarea).toBeInTheDocument();

    // Change content and save
    await user.clear(editTextarea);
    await user.type(editTextarea, updatedContent);
    
    const saveButton = within(cardElement).getByRole('button', { name: /save/i });
    await act(async () => {
      await user.click(saveButton);
    });

    // Verify updated content is displayed
    await waitFor(() => {
      expect(within(cardElement).getByText(updatedContent)).toBeInTheDocument();
    });
    expect(within(cardElement).queryByText(originalContent)).not.toBeInTheDocument();

    // Verify Supabase update call
    // supabase.from('notes').update({ content: newContent, timestamp: new Date().toISOString() }).eq('id', id).select().single();
    expect(mock__from).toHaveBeenCalledWith('notes');
    expect(mock__update).toHaveBeenCalledWith(expect.objectContaining({ content: updatedContent })); // timestamp will vary
    expect(mock__eq).toHaveBeenCalledWith('id', noteIdToEdit);
    expect(mock__select).toHaveBeenCalledWith(); // From .select() after update
    expect(mock__single).toHaveBeenCalledWith(); // From .single() after select
  });

  test('allows user to cancel editing a note', async () => {
    const user = userEvent.setup();
    const originalContent = 'Content to be cancelled';
    const noteIdToCancel = 'note-to-cancel';
    const initialNotes = [{ id: noteIdToCancel, content: originalContent, timestamp: new Date().toISOString(), user_id: null }];

    mock__order.mockResolvedValueOnce({ data: initialNotes, error: null });

    render(<Home />);
    await waitFor(() => expect(screen.getByText(originalContent)).toBeInTheDocument());

    const noteElement = screen.getByText(originalContent);
    const cardElement = noteElement.closest('div[data-slot="card"]'); // Use established selector
    if (!cardElement) throw new Error('Could not find card element');
    const editButton = within(cardElement).getByRole('button', { name: /edit/i });

    // Start editing
    await act(async () => {
      await user.click(editButton);
    });
    
    const editTextarea = within(cardElement).getByDisplayValue(originalContent);
    await user.type(editTextarea, ' - trying to change this');

    // Click Cancel
    const cancelButton = within(cardElement).getByRole('button', { name: /cancel/i });
    await act(async () => {
      await user.click(cancelButton);
    });

    // Verify original content is still displayed and textarea is gone
    expect(within(cardElement).getByText(originalContent)).toBeInTheDocument();
    expect(within(cardElement).queryByDisplayValue(originalContent + ' - trying to change this')).not.toBeInTheDocument();
    expect(mock__update).not.toHaveBeenCalled(); // Ensure no update call was made
  });

  test('does not save edit if content is empty/whitespace', async () => {
    const user = userEvent.setup();
    const originalContent = 'Non-empty content';
    const noteId = 'note-edit-empty';
    const initialNotes = [{ id: noteId, content: originalContent, timestamp: new Date().toISOString(), user_id: null }];

    mock__order.mockResolvedValueOnce({ data: initialNotes, error: null });

    render(<Home />);
    await waitFor(() => expect(screen.getByText(originalContent)).toBeInTheDocument());

    const noteElement = screen.getByText(originalContent);
    const cardElement = noteElement.closest('div[data-slot="card"]'); // Use established selector
    if (!cardElement) throw new Error('Could not find card element');
    const editButton = within(cardElement).getByRole('button', { name: /edit/i });
    
    await act(async () => {
      await user.click(editButton);
    });

    const editTextarea = within(cardElement).getByDisplayValue(originalContent);
    const saveButton = within(cardElement).getByRole('button', { name: /save/i });

    // Try saving with empty content
    await user.clear(editTextarea);
    await act(async () => {
      await user.click(saveButton);
    });
    
    expect(mock__update).not.toHaveBeenCalled();
    expect(within(cardElement).getByDisplayValue('')).toBeInTheDocument(); // Textarea still there and empty

    // Try saving with whitespace content
    await user.type(editTextarea, '   ');
    expect(editTextarea).toHaveValue('   '); // DEBUG: Check textarea value immediately after type

    await act(async () => {
      await user.click(saveButton);
    });
    expect(mock__update).not.toHaveBeenCalled(); // Should still be not called from the previous check
    // The textarea should retain the whitespace value as per the saveEdit logic for invalid content
    expect(editTextarea).toHaveValue('   '); 
  });

  // --- Tests for AI Summary ---

  test('allows user to get an AI summary for a note', async () => {
    const user = userEvent.setup();
    const noteContent = 'This is a note for AI summary.';
    const mockSummaryText = 'This is the mock AI summary of the note.';
    const noteId = 'note-for-summary';

    const initialNotes = [{ id: noteId, content: noteContent, timestamp: new Date().toISOString(), user_id: null }];

    // Mock for initial fetch
    mock__order.mockResolvedValueOnce({ data: initialNotes, error: null });
    // Mock for getMockSummary to be async
    (getMockSummary as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockSummaryText), 50))
    );

    render(<Home />);
    await waitFor(() => expect(screen.getByText(noteContent)).toBeInTheDocument());

    // Find the AI Summary button for the specific note
    const noteElement = screen.getByText(noteContent);
    const cardElement = noteElement.closest('div[data-slot="card"]'); // Use the corrected selector
    if (!cardElement) throw new Error('Could not find card element for the note');
    const summaryButton = within(cardElement).getByRole('button', { name: /ai summary/i });

    // Click AI Summary button
    await act(async () => {
      await user.click(summaryButton);
    });

    // Verify dialog opens and shows loading state
    const dialog = await screen.findByRole('dialog', { name: /ai summary/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/generating summary.../i)).toBeInTheDocument();

    // Verify getMockSummary was called
    expect(getMockSummary).toHaveBeenCalledWith(noteContent);

    // Verify summary is displayed
    await waitFor(() => {
      expect(within(dialog).getByText(mockSummaryText)).toBeInTheDocument();
    });
    expect(within(dialog).queryByText(/generating summary.../i)).not.toBeInTheDocument();

    // Close the dialog (assuming a close button or clicking outside - testing via onOpenChange by unmounting/re-rendering with open=false is tricky here)
    // For ShadCN/Radix dialog, often pressing Escape closes it.
    // Or if there's a visible close button, target that.
    // Let's assume Escape key for now, as it's a common Radix pattern.
    await act(async () => {
      await user.keyboard('{escape}');
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /ai summary/i })).not.toBeInTheDocument();
    });
  });

  test('displays error in AI summary dialog if getMockSummary fails', async () => {
    const user = userEvent.setup();
    const noteContent = 'Note that will cause summary error.';
    const noteId = 'note-for-summary-error';
    const errorMessage = 'Failed to generate summary. Please try again.';

    const initialNotes = [{ id: noteId, content: noteContent, timestamp: new Date().toISOString(), user_id: null }];
    mock__order.mockResolvedValueOnce({ data: initialNotes, error: null });
    (getMockSummary as jest.Mock).mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error("Simulated API error")), 50))
    );

    render(<Home />);
    await waitFor(() => expect(screen.getByText(noteContent)).toBeInTheDocument());

    const noteElement = screen.getByText(noteContent);
    const cardElement = noteElement.closest('div[data-slot="card"]');
    if (!cardElement) throw new Error('Could not find card element');
    const summaryButton = within(cardElement).getByRole('button', { name: /ai summary/i });

    await act(async () => {
      await user.click(summaryButton);
    });

    const dialog = await screen.findByRole('dialog', { name: /ai summary/i });
    expect(dialog).toBeInTheDocument();
    
    // Check for loading, then error
    expect(within(dialog).getByText(/generating summary.../i)).toBeInTheDocument();
    await waitFor(() => {
      expect(within(dialog).getByText(errorMessage)).toBeInTheDocument();
    });
    expect(getMockSummary).toHaveBeenCalledWith(noteContent);
  });
});
