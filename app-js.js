import React, { useState, useEffect } from 'react';
import './index.css';

// Access electron from window
const { ipcRenderer } = window.require('electron');

// Spanish theme elements
const SpanishFlag = () => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: -1, opacity: 0.15 }}>
    <div style={{ background: '#AA151B', height: '33%' }}></div>
    <div style={{ background: '#F1BF00', height: '34%' }}></div>
    <div style={{ background: '#AA151B', height: '33%' }}></div>
  </div>
);

const SoccerBall = () => (
  <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', opacity: 0.7, pointerEvents: 'none' }}>
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
      <path d="M50,2 A48,48 0 1,1 49,2 z" fill="none" stroke="#000000" strokeWidth="4" strokeDasharray="15,10" />
      <circle cx="50" cy="50" r="10" fill="#000000" />
      <path d="M50,10 L50,40 M10,50 L40,50 M50,60 L50,90 M60,50 L90,50 M25,25 L40,40 M75,25 L60,40 M25,75 L40,60 M75,75 L60,60" stroke="#000000" strokeWidth="2" />
    </svg>
  </div>
);

const BlackBull = () => (
  <div style={{ position: 'fixed', top: '20px', right: '20px', width: '100px', height: '80px', opacity: 0.6, pointerEvents: 'none' }}>
    <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M80,30 C90,20 95,30 90,40 C95,45 100,50 95,60 C90,70 80,75 70,70 C65,75 55,80 45,80 C35,80 25,75 20,70 C10,75 5,70 0,60 C-5,50 0,45 5,40 C0,30 5,20 15,30 C20,15 35,10 50,10 C65,10 75,15 80,30 Z" fill="#000000" />
      <circle cx="30" cy="35" r="3" fill="#FFFFFF" />
      <circle cx="70" cy="35" r="3" fill="#FFFFFF" />
      <path d="M20,15 C10,5 20,0 25,5 L35,20 M80,15 C90,5 80,0 75,5 L65,20" fill="none" stroke="#000000" strokeWidth="3" />
    </svg>
  </div>
);

function App() {
  const [notes, setNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load notes from electron-store on component mount
  useEffect(() => {
    const loadNotes = async () => {
      const storedNotes = await ipcRenderer.invoke('get-notes');
      setNotes(storedNotes || []);
    };
    loadNotes();

    // Listen for menu events
    ipcRenderer.on('menu-new-note', createNewNote);

    return () => {
      ipcRenderer.removeAllListeners('menu-new-note');
    };
  }, []);

  // Save notes to electron-store whenever notes change
  useEffect(() => {
    const saveNotes = async () => {
      if (notes.length > 0) {
        setIsSaving(true);
        await ipcRenderer.invoke('save-notes', notes);
        setIsSaving(false);
      }
    };
    saveNotes();
  }, [notes]);

  // Create a new note
  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Untitled Note',
      content: '',
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
      setTitle('');
      setContent('');
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

  // Random disappointing feature that sometimes makes the save button not work
  const [saveButtonWorks, setSaveButtonWorks] = useState(true);
  
  useEffect(() => {
    // 30% chance the save button won't work for 10 seconds
    const interval = setInterval(() => {
      const shouldDisable = Math.random() < 0.3;
      if (shouldDisable) {
        setSaveButtonWorks(false);
        setTimeout(() => setSaveButtonWorks(true), 10000);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Spanish theme elements */}
      <SpanishFlag />
      <SoccerBall />
      <BlackBull />
      
      {/* Sidebar */}
      <h1 className="app-title">¡Olé! Spanish Notes</h1>
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">¡Notas!</h1>
          <button 
            className="btn-icon" 
            onClick={createNewNote}
            title="Create new note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
        </div>
        
        <div className="note-list">
          {notes.length === 0 ? (
            <div className="empty-state">
              <p>No notes yet.</p>
              <button className="btn-primary" onClick={createNewNote}>Create a note</button>
            </div>
          ) : (
            notes.map(note => (
              <div 
                key={note.id} 
                className={`note-item ${currentNoteId === note.id ? 'active' : ''}`}
                onClick={() => selectNote(note)}
              >
                <div className="note-item-header">
                  <h3 className="note-item-title">{note.title}</h3>
                  <button 
                    className="btn-icon btn-delete" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    title="Delete note"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
                <p className="note-item-snippet">{note.content}</p>
                <p className="note-item-date">{formatDate(note.lastModified)}</p>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Editor */}
      <div className="editor">
        {currentNoteId ? (
          <>
            <div className="editor-header">
              <input
                type="text"
                className="editor-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={updateNote}
                placeholder="Note title"
              />
              <div>
                {isSaving ? (
                  <span style={{ color: '#999', fontSize: '14px' }}>Saving...</span>
                ) : (
                  <button 
                    className={`btn-primary ${!saveButtonWorks ? 'btn-disabled' : ''}`}
                    onClick={() => {
                      if (saveButtonWorks) {
                        updateNote();
                      } else {
                        alert("¡Olé! The save button is taking a siesta! Try again in 10 seconds.");
                      }
                    }}
                    title={saveButtonWorks ? "Save note" : "Button temporarily disabled"}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      {!saveButtonWorks ? "¡Olé!" : "Save"}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="editor-content">
              <textarea
                className="editor-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={updateNote}
                placeholder="Start typing your note..."
              ></textarea>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a note or create a new one</p>
            <button className="btn-primary" onClick={createNewNote}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                New Note
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;