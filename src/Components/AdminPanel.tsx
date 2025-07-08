import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Question, Round } from "../Interfaces";
import { rounds } from "../../server/constantes";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminQuestions } from "../hooks/useAdminQuestions";
import AnswerEditor from "./AnswerEditor";

const AdminPanel = observer(() => {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [roundSearchTerms, setRoundSearchTerms] = useState<{[key: number]: string}>({});
  const { logout } = useAdminAuth();
  const { 
    questions, 
    getQuestionsByRound, 
    updateQuestion, 
    deleteQuestion, 
    createQuestion,
    duplicateQuestion,
    hasUnsavedChanges,
    saveChanges,
    exportData,
    loading,
    error,
    clearError,
    getStatistics 
  } = useAdminQuestions();

  const toggleRound = (roundId: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundId)) {
      newExpanded.delete(roundId);
    } else {
      newExpanded.add(roundId);
    }
    setExpandedRounds(newExpanded);
  };

  const getFilteredQuestionsByRound = (roundId: number) => {
    let roundQuestions = getQuestionsByRound(roundId);
    
    // Filtrer par recherche globale
    if (globalSearchTerm) {
      roundQuestions = roundQuestions.filter(q => 
        matchesSearchTerm(q, globalSearchTerm)
      );
    }
    
    // Filtrer par recherche spécifique au round
    const roundSearchTerm = roundSearchTerms[roundId];
    if (roundSearchTerm) {
      roundQuestions = roundQuestions.filter(q => 
        matchesSearchTerm(q, roundSearchTerm)
      );
    }
    
    return roundQuestions;
  };

  const matchesSearchTerm = (question: Question, searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return (
      question.name.toLowerCase().includes(term) ||
      question.answer_1?.toLowerCase().includes(term) ||
      question.answer_2?.toLowerCase().includes(term) ||
      question.answer_3?.toLowerCase().includes(term) ||
      question.answer_4?.toLowerCase().includes(term) ||
      question.id.toString().includes(term)
    );
  };

  const handleRoundSearch = (roundId: number, searchTerm: string) => {
    setRoundSearchTerms(prev => ({
      ...prev,
      [roundId]: searchTerm
    }));
  };

  const clearRoundSearch = (roundId: number) => {
    setRoundSearchTerms(prev => {
      const newTerms = { ...prev };
      delete newTerms[roundId];
      return newTerms;
    });
  };

  const getTotalVisibleQuestions = () => {
    return rounds.reduce((total, round) => {
      return total + getFilteredQuestionsByRound(round.id).length;
    }, 0);
  };

  const handleAnswerUpdate = (questionId: number, answerIndex: number, newAnswer: string | null) => {
    const answerKeys = ['answer_1', 'answer_2', 'answer_3', 'answer_4'] as const;
    const answerKey = answerKeys[answerIndex];
    
    updateQuestion(questionId, {
      [answerKey]: newAnswer
    });
  };

  const handleSaveChanges = async () => {
    const success = await saveChanges();
    if (success) {
      // Optionnel : afficher une notification de succès
    }
  };

  const handleAddQuestion = (roundId: 1 | 2 | 3 | 4) => {
    createQuestion(roundId, {
      name: "Nouvelle question",
      answer_1: "Réponse 1",
      answer_2: "Réponse 2",
      answer_3: null,
      answer_4: null
    });
  };

  const getRoundName = (roundId: number) => {
    const round = rounds.find(r => r.id === roundId);
    return round?.name || `Round ${roundId}`;
  };

  const getRoundClass = (roundId: number) => {
    const classes = ['bg-personality', 'bg-situations', 'bg-representations', 'bg-relations'];
    return classes[roundId - 1] || 'bg-personality';
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-actions">
          <div>
            <h1>Administration des Questions</h1>
            <p className="soft-text">
              {getTotalVisibleQuestions()} questions affichées sur {questions.length} au total
            </p>
          </div>
          <button onClick={logout} className="logout-btn">
            🚪 Déconnexion
          </button>
        </div>
        
        <div className="search-container">
          <div className="global-search">
            <input
              type="text"
              placeholder="Recherche globale dans toutes les questions..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              className="search-input global-search-input"
            />
            {globalSearchTerm && (
              <button
                onClick={() => setGlobalSearchTerm("")}
                className="clear-search-btn"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounds-container">
        {rounds.map((round) => {
          const roundQuestions = getFilteredQuestionsByRound(round.id);
          const isExpanded = expandedRounds.has(round.id);

          return (
            <div key={round.id} className="round-section">
              <button
                className={`round-header ${getRoundClass(round.id)}`}
                onClick={() => toggleRound(round.id)}
              >
                <div className="round-title">
                  <h3>{getRoundName(round.id)}</h3>
                  <span className="question-count">{roundQuestions.length} questions</span>
                </div>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>

              {isExpanded && (
                <div className="questions-list">
                  <div className="round-search">
                    <input
                      type="text"
                      placeholder={`Rechercher dans ${getRoundName(round.id)}...`}
                      value={roundSearchTerms[round.id] || ""}
                      onChange={(e) => handleRoundSearch(round.id, e.target.value)}
                      className="search-input round-search-input"
                    />
                    {roundSearchTerms[round.id] && (
                      <button
                        onClick={() => clearRoundSearch(round.id)}
                        className="clear-search-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {roundQuestions.length === 0 ? (
                    <div className="no-results">
                      <p>Aucune question trouvée</p>
                    </div>
                  ) : (
                    roundQuestions.map((question) => (
                    <div key={question.id} className="question-card">
                      <div className="question-header">
                        <span className="question-id">#{question.id}</span>
                        <input
                          type="text"
                          value={question.name}
                          onChange={(e) => updateQuestion(question.id, { name: e.target.value })}
                          className="question-text-input"
                          placeholder="Texte de la question"
                        />
                      </div>
                      
                      <div className="answers-container">
                        {[question.answer_1, question.answer_2, question.answer_3, question.answer_4]
                          .map((answer, index) => (
                            <AnswerEditor
                              key={index}
                              answer={answer}
                              answerIndex={index}
                              onSave={(newAnswer) => handleAnswerUpdate(question.id, index, newAnswer)}
                              onCancel={() => {}}
                              placeholder={`Réponse ${index + 1}...`}
                            />
                          ))}
                      </div>

                      <div className="question-actions">
                        <button 
                          className="action-btn duplicate-btn"
                          onClick={() => duplicateQuestion(question.id)}
                        >
                          📋 Dupliquer
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                    ))
                  )}
                  
                  <button 
                    className="add-question-btn"
                    onClick={() => handleAddQuestion(round.id as 1 | 2 | 3 | 4)}
                  >
                    + Ajouter une question
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="admin-footer">
        <div className="admin-actions">
          <button 
            className="export-btn"
            onClick={exportData}
          >
            💾 Exporter les modifications
          </button>
          <button 
            className={`save-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || loading}
          >
            {loading ? '⏳ Sauvegarde...' : hasUnsavedChanges ? '💾 Sauvegarder' : '✅ Sauvegardé'}
          </button>
        </div>
        
        {error && (
          <div className="admin-error">
            <p>{error}</p>
            <button onClick={clearError} className="clear-error-btn">✕</button>
          </div>
        )}
      </div>
    </div>
  );
});

export default AdminPanel;