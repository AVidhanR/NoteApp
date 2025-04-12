'use client';

import {Calendar} from '@/components/ui/calendar';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {useEffect, useState} from 'react';
import {cn} from '@/lib/utils';
import {format} from 'date-fns';
import {Icons} from '@/components/icons';
import {useToast} from '@/hooks/use-toast';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {summarizeDailyNotes} from '@/ai/flows/daily-summary';

type Note = {
  id: string;
  date: string;
  text: string;
};

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

const AllNotesThread: React.FC<{notes: Note[]}> = ({notes}) => {
  const [summaries, setSummaries] = useState<{[date: string]: string}>({});

  useEffect(() => {
    const getSummaries = async () => {
      const groupedNotes = notes.reduce((acc: {[key: string]: string[]}, note) => {
        if (!acc[note.date]) {
          acc[note.date] = [];
        }
        acc[note.date].push(note.text);
        return acc;
      }, {});

      const summaryPromises = Object.entries(groupedNotes).map(async ([date, notesForDate]) => {
        try {
          const result = await summarizeDailyNotes({date: date, notes: notesForDate});
          return [date, result.summary];
        } catch (error) {
          console.error(`Failed to summarize notes for ${date}:`, error);
          return [date, 'Failed to generate summary.'];
        }
      });

      const settledSummaries = await Promise.all(summaryPromises);
      const newSummaries: {[date: string]: string} = Object.fromEntries(settledSummaries);
      setSummaries(newSummaries);
    };

    getSummaries();
  }, [notes]);

  const groupedNotes = notes.reduce((acc: {[key: string]: Note[]}, note) => {
    if (!acc[note.date]) {
      acc[note.date] = [];
    }
    acc[note.date].push(note);
    return acc;
  }, {});

  return (
    <Accordion type="single" collapsible>
      {Object.entries(groupedNotes)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, notesForDate]) => (
          <AccordionItem key={date} value={date}>
            <AccordionTrigger>{format(new Date(date), 'PPP')}</AccordionTrigger>
            <AccordionContent>
              <div className="mb-4 p-3 rounded-md shadow-sm bg-secondary">
                <p className="text-sm">{summaries[date] || 'Generating summary...'}</p>
              </div>
              {notesForDate.map(note => (
                <div key={note.id} className="mb-2 p-3 rounded-md shadow-sm bg-secondary">
                  <p className="text-sm">{note.text}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
    </Accordion>
  );
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const {toast} = useToast();
  const [showAllNotes, setShowAllNotes] = useState(false);

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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setShowAllNotes(false); // Reset to calendar view when a date is selected
  };

  const addNote = () => {
    if (!selectedDate) {
      toast({
        title: 'Please select a date first.',
        variant: 'destructive',
      });
      return;
    }
    if (newNoteText.trim() === '') {
      toast({
        title: 'Note cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const newNote: Note = {
      id: generateId(),
      date: formattedDate,
      text: newNoteText,
    };
    setNotes([...notes, newNote]);
    setNewNoteText('');
    toast({
      title: 'Note added successfully!',
    });
  };

  const editNote = (id: string, newText: string) => {
    const updatedNotes = notes.map(note => (note.id === id ? {...note, text: newText} : note));
    setNotes(updatedNotes);
    toast({
      title: 'Note edited successfully!',
    });
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    toast({
      title: 'Note deleted successfully!',
    });
  };

  const getNotesForDate = (date: Date | undefined) => {
    if (!date) return [];
    const formattedDate = format(date, 'yyyy-MM-dd');
    return notes.filter(note => note.date === formattedDate);
  };

  return (
    <div className="flex flex-col md:flex-row p-4 gap-4">
      {/* Calendar Section */}
      <Card className="w-full md:w-1/3">
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} className="rounded-md border" />
          <Button className="mt-4 w-full" onClick={() => setShowAllNotes(true)}>View All Notes</Button>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card className="w-full md:w-2/3">
        <CardHeader>
          <CardTitle>
            {showAllNotes
              ? 'All Notes'
              : `Notes for ${selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {showAllNotes ? (
            <AllNotesThread notes={notes} />
          ) : (
            <>
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
                {getNotesForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground">No notes for this date.</p>
                ) : (
                  getNotesForDate(selectedDate).map(note => (
                    <NoteItem key={note.id} note={note} onEdit={editNote} onDelete={deleteNote} />
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
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

