import { useState, useEffect } from "react";
import { PlusCircle, Trash2, Save } from "lucide-react";

export default function NoteApp() {
  // State for notes and current note
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem("notes");
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Create a new note
  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: "Untitled Note",
      content: "",
      lastModified: Date.now()
    };
    setNotes([newNote, ...notes]);
    setCurrentNoteId(newNote.id);
    setTitle(newNote.title);
    setContent(newNote.content);
  };

  // Update the current note
  const updateNote = () => {
    const updatedNotes = notes.map(note => {
      if (note.id === currentNoteId) {
        return {
          ...note,
          title,
          content,
          lastModified: Date.now()
        };
      }
      return note;
    });
    setNotes(updatedNotes);
  };

  // Delete a note
  const deleteNote = (noteId) => {
    const filteredNotes = notes.filter(note => note.id !== noteId);
    setNotes(filteredNotes);
    
    if (currentNoteId === noteId) {
      setCurrentNoteId(null);
      setTitle("");
      setContent("");
    }
  };

  // Select a note to edit
  const selectNote = (note) => {
    setCurrentNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-gray-200 p-4 overflow-auto border-r border-gray-300">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Notes</h1>
          <button 
            onClick={createNewNote}
            className="p-1 rounded-full hover:bg-gray-300"
          >
            <PlusCircle size={24} />
          </button>
        </div>
        
        <div>
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">No notes yet. Create one!</p>
          ) : (
            notes.map(note => (
              <div 
                key={note.id} 
                className={`p-3 mb-2 rounded cursor-pointer ${
                  currentNoteId === note.id ? "bg-blue-100" : "bg-white"
                } hover:bg-blue-50`}
                onClick={() => selectNote(note)}
              >
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold truncate">{note.title}</h2>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-500 truncate">{note.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(note.lastModified)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="w-2/3 p-4 overflow-auto">
        {currentNoteId ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={updateNote}
                className="text-2xl font-bold bg-transparent border-b border-gray-300 pb-2 w-full focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={updateNote}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded flex items-center"
              >
                <Save size={16} className="mr-1" />
                Save
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={updateNote}
              className="flex-1 p-2 w-full resize-none bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Start typing your note..."
            ></textarea>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <p className="mb-4">Select a note or create a new one</p>
            <button 
              onClick={createNewNote}
              className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
            >
              <PlusCircle size={16} className="mr-1" />
              New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}