import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Save, Trash, Edit } from 'lucide-react';

const VoiceNoteApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [showRNS, setShowRNS] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep recognizing speech continuously
      recognitionRef.current.interimResults = true; // Display results while speaking
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        setErrorMessage(`Error occurred: ${event.error}`);
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        setCurrentNote(transcript);
      };
    } else {
      setErrorMessage('SpeechRecognition API not supported in your browser.');
    }

    // Clean up on component unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
      }
    };
  }, []);

  // Handle title clicks
  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 10) {
      setShowRNS(true);
      setTimeout(() => setShowRNS(false), 3000); // Hide after 3 seconds
      setClickCount(0); // Reset counter
    }
  };

  // Start recording
  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Save current note
  const saveNote = () => {
    if (currentNote.trim() !== '') {
      if (editingIndex !== null) {
        // Update existing note
        const updatedNotes = [...notes];
        updatedNotes[editingIndex] = {
          ...updatedNotes[editingIndex],
          text: currentNote,
          updatedAt: new Date()
        };
        setNotes(updatedNotes);
        setEditingIndex(null);
      } else {
        // Add new note
        setNotes([
          ...notes,
          {
            id: Date.now(),
            text: currentNote,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }
      setCurrentNote('');
    }
  };

  // Delete a note
  const deleteNote = (index) => {
    const updatedNotes = [...notes];
    updatedNotes.splice(index, 1);
    setNotes(updatedNotes);
  };

  // Edit a note
  const startEditing = (index) => {
    setEditingIndex(index);
    setCurrentNote(notes[index].text);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1
            className="text-4xl font-bold text-indigo-600 cursor-pointer relative"
            onClick={handleTitleClick}
          >
            Voice Note Taker
            {showRNS && (
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                RNS
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-2">Capture your thoughts with your voice</p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <button
              className={`p-4 rounded-full mr-4 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-500 text-white'}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">
                {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
              </p>
              <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${isRecording ? 'opacity-100' : 'opacity-50'}`}>
                {isRecording && (
                  <div className="h-full bg-red-500 animate-[recording_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
                )}
              </div>
            </div>
          </div>

          <textarea
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your transcribed note will appear here..."
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
          ></textarea>

          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center"
              onClick={saveNote}
              disabled={currentNote.trim() === ''}
            >
              <Save size={18} className="mr-2" />
              {editingIndex !== null ? 'Update Note' : 'Save Note'}
            </button>
          </div>

          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Notes</h2>

          {notes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <p>No notes yet. Start recording to create your first note!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={note.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500">
                      Created: {formatDate(note.createdAt)}
                      {note.updatedAt > note.createdAt &&
                        ` (Updated: ${formatDate(note.updatedAt)})`}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full"
                        onClick={() => startEditing(index)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => deleteNote(index)}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceNoteApp;
