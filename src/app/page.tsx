"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase, type DbNote } from "@/lib/supabase";
import { getMockSummary } from "@/lib/mockAiSummary";

interface Note {
  id: string;
  content: string;
  timestamp: string;
  isEditing?: boolean;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [currentSummary, setCurrentSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Function to fetch notes from Supabase
  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setNotes(data.map(note => ({
        ...note,
        isEditing: false
      })));
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new note
  const addNote = async () => {
    if (currentNote.trim() === "") return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          { content: currentNote }
        ])
        .select()
        .single();

      if (error) throw error;

      setNotes(prevNotes => [{
        ...data,
        isEditing: false
      }, ...prevNotes]);
      
      setCurrentNote(""); // Clear the textarea
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Function to delete a note
  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Function to start editing a note
  const startEditing = (id: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isEditing: true } : note
    ));
  };

  // Function to save edited note
  const saveEdit = async (id: string, newContent: string) => {
    if (newContent.trim() === "") return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          content: newContent,
          timestamp: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNotes(notes.map(note => 
        note.id === id 
          ? { ...data, isEditing: false }
          : note
      ));
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Function to cancel editing
  const cancelEdit = (id: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isEditing: false } : note
    ));
  };

  const handleGetSummary = async (content: string) => {
    setIsLoadingSummary(true);
    setSummaryDialogOpen(true);
    try {
      const summary = await getMockSummary(content);
      setCurrentSummary(summary);
    } catch (error) {
      setCurrentSummary("Failed to generate summary. Please try again.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Note Input Section */}
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl font-bold mb-4">Simple Notes</h1>
        <div className="space-y-4">
          <Textarea
            placeholder="Write your note here..."
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={addNote} className="w-full">
            Add Note
          </Button>
        </div>
      </div>

      {/* Notes Display Section */}
      <div className="max-w-4xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-center col-span-full">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-center col-span-full text-muted-foreground">
            No notes yet. Create your first note above!
          </p>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <CardTitle className="text-sm text-gray-500">
                  {note.timestamp}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {note.isEditing ? (
                  <Textarea
                    defaultValue={note.content}
                    className="min-h-[100px] mb-2"
                    id={`edit-${note.id}`}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{note.content}</p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                {note.isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => cancelEdit(note.id)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        const textarea = document.getElementById(`edit-${note.id}`) as HTMLTextAreaElement;
                        saveEdit(note.id, textarea.value);
                      }}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGetSummary(note.content)}
                    >
                      AI Summary
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEditing(note.id)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Summary</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isLoadingSummary ? (
              <p className="text-center text-muted-foreground">
                Generating summary...
              </p>
            ) : (
              <p className="text-sm">{currentSummary}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
