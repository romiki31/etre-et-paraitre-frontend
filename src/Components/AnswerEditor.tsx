import { observer } from "mobx-react-lite";
import { useState, useEffect, useRef } from "react";

interface AnswerEditorProps {
  answer: string | null;
  answerIndex: number;
  onSave: (newAnswer: string | null) => void;
  onCancel: () => void;
  placeholder?: string;
  maxLength?: number;
}

const AnswerEditor = observer(({ 
  answer, 
  answerIndex, 
  onSave, 
  onCancel, 
  placeholder = "Entrez une réponse...",
  maxLength = 100
}: AnswerEditorProps) => {
  const [editValue, setEditValue] = useState(answer || "");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(answer || "");
    setError(null);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    
    // Validation
    if (trimmedValue.length === 0) {
      setError("La réponse ne peut pas être vide");
      return;
    }

    if (trimmedValue.length > maxLength) {
      setError(`La réponse ne peut pas dépasser ${maxLength} caractères`);
      return;
    }

    onSave(trimmedValue);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(answer || "");
    setError(null);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleRemove = () => {
    onSave(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="answer-editor editing">
        <div className="answer-editor-input-container">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`answer-editor-input ${error ? 'error' : ''}`}
            maxLength={maxLength}
          />
          <div className="answer-editor-actions">
            <button
              onClick={handleSave}
              className="answer-editor-btn save-btn"
              disabled={editValue.trim().length === 0}
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="answer-editor-btn cancel-btn"
            >
              ✕
            </button>
          </div>
        </div>
        
        {error && (
          <div className="answer-editor-error">
            {error}
          </div>
        )}
        
        <div className="answer-editor-help">
          <span className="char-count">
            {editValue.length}/{maxLength}
          </span>
          <span className="help-text">
            Entrée pour sauvegarder, Échap pour annuler
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-editor">
      <div className="answer-display">
        <span className="answer-label">{answerIndex + 1}.</span>
        <div className="answer-content">
          {answer ? (
            <span className="answer-text" onClick={handleStartEdit}>
              {answer}
            </span>
          ) : (
            <span className="answer-placeholder" onClick={handleStartEdit}>
              {placeholder}
            </span>
          )}
        </div>
        <div className="answer-actions">
          <button
            onClick={handleStartEdit}
            className="answer-action-btn edit-btn"
            title="Modifier la réponse"
          >
            ✏️
          </button>
          {answer && (
            <button
              onClick={handleRemove}
              className="answer-action-btn remove-btn"
              title="Supprimer la réponse"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default AnswerEditor;