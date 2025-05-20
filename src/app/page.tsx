"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Note {
  id: number;
  content: string;
  timestamp: string;
  isEditing?: boolean;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");

  // Function to add a new note
  const addNote = () => {
    if (currentNote.trim() === "") return;

    const newNote: Note = {
      id: Date.now(),
      content: currentNote,
      timestamp: new Date().toLocaleString(),
      isEditing: false,
    };

    setNotes([...notes, newNote]);
    setCurrentNote(""); // Clear the textarea
  };

  // Function to delete a note
  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  // Function to start editing a note
  const startEditing = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isEditing: true } : note
    ));
  };

  // Function to save edited note
  const saveEdit = (id: number, newContent: string) => {
    if (newContent.trim() === "") return;
    
    setNotes(notes.map(note => 
      note.id === id 
        ? { 
            ...note, 
            content: newContent, 
            isEditing: false,
            timestamp: new Date().toLocaleString() + ' (edited)'
          } 
        : note
    ));
  };

  // Function to cancel editing
  const cancelEdit = (id: number) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isEditing: false } : note
    ));
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
        {notes.map((note) => (
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
        )).reverse()}
      </div>
    </div>
  );
}
