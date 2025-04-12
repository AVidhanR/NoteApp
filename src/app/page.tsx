'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {useEffect, useState} from 'react';
import {cn} from '@/lib/utils';
import {format} from 'date-fns';
import {Icons} from '@/components/icons';
import {useToast} from '@/hooks/use-toast';
import {Switch} from '@/components/ui/switch';

type Note = {
  id: string;
  date: string;
  text: string;
};

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

const AllNotesThread: React.FC<{notes: Note[]}> = ({notes}) => {
  const groupedNotes = notes.reduce((acc: {[key: string]: Note[]}, note) => {
    if (!acc[note.date]) {
      acc[note.date] = [];
    }
    acc[note.date].push(note);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedNotes)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, notesForDate]) => (
          <div key={date} className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{format(new Date(date), 'PPP')}</h3>
            {notesForDate.map((note, index) => (
              <div
                key={note.id}
                className="flex items-start py-2 border-b border-border last:border-none"
              >
                {/* Thread line indicator */}
                <div className="w-4 flex-shrink-0">
                  {index !== notesForDate.length - 1 && (
                    <div className="border-l border-border h-full ml-2"></div>
                  )}
                </div>
                <div className="flex-grow">
                  <p className="text-sm">{note.text}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const {toast} = useToast();
  const [viewAllNotes, setViewAllNotes] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  useEffect(() => {
    // Load notes from local storage on component mount
    const storedNotes = localStorage.getItem('chronicle-notes');
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  }, []);

  useEffect(() => {
    // Save notes to local storage whenever notes change
    localStorage.setItem('chronicle-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (newNoteText.trim() === '') {
      toast({
        title: 'Note cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    const currentDate = new Date();
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    // Check if a note already exists for the selected date
    const existingNoteIndex = notes.findIndex(note => note.date === formattedDate);

    if (existingNoteIndex !== -1) {
      // If a note exists, append the new text to the existing note
      const updatedNotes = [...notes];
      updatedNotes[existingNoteIndex] = {
        ...updatedNotes[existingNoteIndex],
        text: updatedNotes[existingNoteIndex].text + '\n' + newNoteText, // Append with a newline for separation
      };
      setNotes(updatedNotes);
    } else {
      // If no note exists, create a new note
      const newNote: Note = {
        id: generateId(),
        date: formattedDate,
        text: newNoteText,
      };
      setNotes([...notes, newNote]);
    }

    setNewNoteText('');
    toast({
      title: 'Note added successfully!',
    });
  };

  const currentDate = new Date();
  const formattedCurrentDate = format(currentDate, 'yyyy-MM-dd');
  const notesForToday = notes.filter(note => note.date === formattedCurrentDate);

  const deleteAllNotesForToday = () => {
    const updatedNotes = notes.filter(note => note.date !== formattedCurrentDate);
    setNotes(updatedNotes);
    toast({
      title: 'Notes for today deleted successfully!',
    });
  };

  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => setViewAllNotes(!viewAllNotes)}>
          {viewAllNotes ? 'Hide all notes' : 'View all notes'}
        </Button>
        <div className="flex items-center space-x-2">
          <Icons.sun className="h-4 w-4 text-yellow-500" />
          <Switch
            id="dark-mode"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
          <Icons.moon className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      {/* Notes Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            Notes for Today ({format(currentDate, 'PPP')})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Note Creation */}
          <div className="mb-4">
            <Textarea
              value={newNoteText}
              onChange={e => setNewNoteText(e.target.value)}
              placeholder="Enter your note here"
              className="rounded-md border"
            />
            <Button onClick={addNote} className="mt-2">
              Add Note
            </Button>
          </div>

          {/* Note Display */}
          <div>
            {notesForToday.length === 0 ? (
              <p className="text-muted-foreground">No notes for today.</p>
            ) : (
              <div>
                {notesForToday.map((note, index) => (
                  <div
                    key={note.id}
                    className="flex items-start py-2 border-b border-border last:border-none"
                  >
                    {/* Thread line indicator */}
                    <div className="w-4 flex-shrink-0">
                      {index !== notesForToday.length - 1 && (
                        <div className="border-l border-border h-full ml-2"></div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm">{note.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notesForToday.length > 0 && (
            <Button variant="destructive" onClick={deleteAllNotesForToday} className="mt-4">
              Delete All Notes for Today
            </Button>
          )}
        </CardContent>
      </Card>

      {viewAllNotes && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>All Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {notes.length === 0 ? (
              <p className="text-muted-foreground">No notes available.</p>
            ) : (
              <AllNotesThread notes={notes} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type NoteItemProps = {
  note: Note;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
};

const NoteItem: React.FC<NoteItemProps> = ({note, onEdit, onDelete}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const handleEdit = () => {
    onEdit(note.id, editText);
    setIsEditing(false);
  };

  return (
    <div key={note.id} className="mb-4 p-4 rounded-md shadow-sm bg-card">
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="rounded-md border"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEdit}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <p>{note.text}</p>
          <div>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
              <Icons.edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(note.id)}>
              <Icons.trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
