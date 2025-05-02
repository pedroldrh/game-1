// This is a simple note-taking app built with Electron
// File structure:
// - main.js          - Main Electron process file
// - package.json     - Project configuration
// - index.html       - Main application UI
// - renderer.js      - Frontend logic
// - styles.css       - Application styling

// main.js
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let currentFile = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Create menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click() { 
            mainWindow.webContents.send('new-note');
            currentFile = null;
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click() { openFile(); }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click() { 
            if (currentFile) {
              mainWindow.webContents.send('save-note', currentFile);
            } else {
              saveFileAs();
            }
          }
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click() { saveFileAs(); }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click() { app.quit(); }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function openFile() {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          dialog.showErrorBox('Error', `Failed to open file: ${err.message}`);
          return;
        }
        currentFile = filePath;
        mainWindow.webContents.send('file-opened', { content: data, filePath });
      });
    }
  }).catch(err => {
    dialog.showErrorBox('Error', `An error occurred: ${err.message}`);
  });
}

function saveFileAs() {
  dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown', extensions: ['md'] }
    ]
  }).then(result => {
    if (!result.canceled) {
      currentFile = result.filePath;
      mainWindow.webContents.send('save-note', currentFile);
    }
  }).catch(err => {
    dialog.showErrorBox('Error', `An error occurred: ${err.message}`);
  });
}

// IPC handlers
ipcMain.on('save-content', (event, { filePath, content }) => {
  fs.writeFile(filePath, content, err => {
    if (err) {
      dialog.showErrorBox('Error', `Failed to save file: ${err.message}`);
      return;
    }
    mainWindow.setTitle(`SimpleNotes - ${path.basename(filePath)}`);
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// package.json
/*
{
  "name": "simple-notes",
  "version": "1.0.0",
  "description": "A simple note-taking app",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.6.4"
  },
  "build": {
    "appId": "com.simplenotes.app",
    "productName": "SimpleNotes",
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": [
        "deb",
        "AppImage"
      ],
      "category": "Office"
    }
  }
}
*/

// index.html
/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SimpleNotes</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Notes</h2>
        <button id="new-note-btn">+</button>
      </div>
      <div id="notes-list">
        <!-- Notes will be listed here -->
      </div>
    </div>
    <div class="editor-container">
      <div class="editor-header">
        <input type="text" id="note-title" placeholder="Note Title">
        <div class="timestamp" id="last-modified">Last modified: Never</div>
      </div>
      <textarea id="note-content" placeholder="Start typing your note here..."></textarea>
    </div>
  </div>
  <script src="renderer.js"></script>
</body>
</html>
*/

// renderer.js
const { ipcRenderer } = require('electron');

// DOM Elements
const notesList = document.getElementById('notes-list');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const lastModified = document.getElementById('last-modified');
const newNoteBtn = document.getElementById('new-note-btn');

// State
let notes = [];
let activeNoteId = null;

// Initialize with a blank note
function initializeApp() {
  createNewNote();
  
  // Event listeners
  noteTitle.addEventListener('input', updateActiveNote);
  noteContent.addEventListener('input', updateActiveNote);
  newNoteBtn.addEventListener('click', createNewNote);
  
  // IPC listeners
  ipcRenderer.on('new-note', createNewNote);
  
  ipcRenderer.on('file-opened', (event, { content, filePath }) => {
    noteContent.value = content;
    noteTitle.value = filePath.split('/').pop().split('\\').pop();
    updateLastModified();
  });
  
  ipcRenderer.on('save-note', (event, filePath) => {
    ipcRenderer.send('save-content', { 
      filePath, 
      content: noteContent.value 
    });
  });
  
  // Load notes from localStorage
  loadNotes();
}

function createNewNote() {
  const newNote = {
    id: Date.now(),
    title: 'Untitled Note',
    content: '',
    lastModified: new Date()
  };
  
  notes.push(newNote);
  saveNotes();
  renderNotesList();
  
  // Set as active note
  setActiveNote(newNote.id);
}

function updateActiveNote() {
  if (!activeNoteId) return;
  
  const activeNote = notes.find(note => note.id === activeNoteId);
  if (activeNote) {
    activeNote.title = noteTitle.value || 'Untitled Note';
    activeNote.content = noteContent.value;
    activeNote.lastModified = new Date();
    
    updateLastModified();
    saveNotes();
    renderNotesList();
  }
}

function setActiveNote(id) {
  activeNoteId = id;
  const activeNote = notes.find(note => note.id === id);
  
  if (activeNote) {
    noteTitle.value = activeNote.title;
    noteContent.value = activeNote.content;
    updateLastModified(activeNote.lastModified);
    
    // Update UI to show which note is active
    document.querySelectorAll('.note-item').forEach(item => {
      item.classList.remove('active');
    });
    document.getElementById(`note-${id}`).classList.add('active');
  }
}

function deleteNote(id) {
  notes = notes.filter(note => note.id !== id);
  saveNotes();
  renderNotesList();
  
  if (activeNoteId === id) {
    if (notes.length > 0) {
      setActiveNote(notes[0].id);
    } else {
      createNewNote();
    }
  }
}

function updateLastModified(date = new Date()) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  lastModified.textContent = `Last modified: ${date.toLocaleString(undefined, options)}`;
}

function renderNotesList() {
  notesList.innerHTML = '';
  
  notes.sort((a, b) => b.lastModified - a.lastModified);
  
  notes.forEach(note => {
    const noteItem = document.createElement('div');
    noteItem.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
    noteItem.id = `note-${note.id}`;
    
    const noteInfo = document.createElement('div');
    noteInfo.className = 'note-info';
    noteInfo.addEventListener('click', () => setActiveNote(note.id));
    
    const title = document.createElement('div');
    title.className = 'note-title';
    title.textContent = note.title || 'Untitled Note';
    
    const preview = document.createElement('div');
    preview.className = 'note-preview';
    preview.textContent = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-note';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(note.id);
    });
    
    noteInfo.appendChild(title);
    noteInfo.appendChild(preview);
    noteItem.appendChild(noteInfo);
    noteItem.appendChild(deleteBtn);
    notesList.appendChild(noteItem);
  });
}

function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function loadNotes() {
  const savedNotes = localStorage.getItem('notes');
  if (savedNotes) {
    notes = JSON.parse(savedNotes);
    notes.forEach(note => {
      note.lastModified = new Date(note.lastModified);
    });
    renderNotesList();
    
    if (notes.length > 0) {
      setActiveNote(notes[0].id);
    }
  } else {
    createNewNote();
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);

// styles.css
/*
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body, html {
  height: 100%;
  overflow: hidden;
}

.container {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

/* Sidebar Styles */
.sidebar {
  width: 250px;
  background-color: #f0f0f0;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

#new-note-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

#new-note-btn:hover {
  background-color: #45a049;
}

#notes-list {
  flex: 1;
  overflow-y: auto;
}

.note-item {
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-item:hover {
  background-color: #e8e8e8;
}

.note-item.active {
  background-color: #e3f2fd;
  border-left: 4px solid #2196F3;
}

.note-info {
  flex: 1;
  overflow: hidden;
}

.note-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-preview {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-note {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ff5252;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.note-item:hover .delete-note {
  opacity: 1;
}

/* Editor Styles */
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  padding: 15px;
  border-bottom: 1px solid #ddd;
}

#note-title {
  width: 100%;
  padding: 8px;
  font-size: 18px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.timestamp {
  font-size: 12px;
  color: #666;
}

#note-content {
  flex: 1;
  width: 100%;
  padding: 15px;
  font-size: 16px;
  line-height: 1.6;
  border: none;
  resize: none;
  outline: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
}
*/
