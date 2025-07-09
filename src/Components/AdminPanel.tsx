import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Question, Round } from "../Interfaces";
import { rounds } from "../../server/constantes";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminQuestions } from "../hooks/useAdminQuestions";
import AnswerEditor from "./AnswerEditor";

const AdminPanel = observer(() => {
  const [activeRound, setActiveRound] = useState<number | null>(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [roundSearchTerm, setRoundSearchTerm] = useState("");
  const [newlyCreatedQuestions, setNewlyCreatedQuestions] = useState<Set<number>>(new Set());
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

  const handleRoundClick = (roundId: number) => {
    if (activeRound === roundId) {
      setActiveRound(null);
      setRoundSearchTerm("");
    } else {
      setActiveRound(roundId);
      setRoundSearchTerm("");
    }
    // Nettoyer la liste des questions nouvellement créées quand on change de round
    setNewlyCreatedQuestions(new Set());
  };

  const getFilteredQuestionsByRound = (roundId: number) => {
    let roundQuestions = getQuestionsByRound(roundId);
    
    // Filtrer par recherche globale
    if (globalSearchTerm) {
      roundQuestions = roundQuestions.filter(q => 
        matchesSearchTerm(q, globalSearchTerm)
      );
    }
    
    // Filtrer par recherche spécifique au round actif
    if (activeRound === roundId && roundSearchTerm) {
      roundQuestions = roundQuestions.filter(q => 
        matchesSearchTerm(q, roundSearchTerm)
      );
    }
    
    // Ajouter les questions nouvellement créées même sans recherche
    if (activeRound === roundId && !roundSearchTerm && !globalSearchTerm) {
      roundQuestions = roundQuestions.filter(q => 
        newlyCreatedQuestions.has(q.id)
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

  const handleRoundSearch = (searchTerm: string) => {
    setRoundSearchTerm(searchTerm);
    // Quand on commence une recherche, nettoyer la liste des questions nouvellement créées
    if (searchTerm && newlyCreatedQuestions.size > 0) {
      setNewlyCreatedQuestions(new Set());
    }
  };

  const clearRoundSearch = () => {
    setRoundSearchTerm("");
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

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSaveChanges = async () => {
    const result = await saveChanges();
    setSaveMessage(result.message);
    setSaveSuccess(result.success);
    
    // Effacer le message après 5 secondes
    setTimeout(() => {
      setSaveMessage(null);
    }, 5000);
  };

  const handleAddQuestion = (roundId: 1 | 2 | 3 | 4) => {
    const questionName = roundSearchTerm 
      ? `${roundSearchTerm}` 
      : "Nouvelle question";
    
    const newQuestion = createQuestion(roundId, {
      name: questionName,
      answer_1: "Réponse 1",
      answer_2: "Réponse 2",
      answer_3: null,
      answer_4: null
    });
    
    // Ajouter la nouvelle question à la liste des questions nouvellement créées
    setNewlyCreatedQuestions(prev => new Set([...prev, newQuestion.id]));
  };

  const getRoundName = (roundId: number) => {
    const round = rounds.find(r => r.id === roundId);
    return round?.name || `Round ${roundId}`;
  };

  const getRoundClass = (roundId: number) => {
    const classes = ['bg-personality', 'bg-situations', 'bg-representations', 'bg-relations'];
    return classes[roundId - 1] || 'bg-personality';
  };

  const handleImportQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Vérifier que c'est un export valide
        if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
          throw new Error('Format de fichier invalide : propriété "questions" manquante');
        }

        // Valider chaque question
        jsonData.questions.forEach((q: any, index: number) => {
          if (!q.id || !q.round_id || !q.name) {
            throw new Error(`Question ${index + 1} : propriétés manquantes (id, round_id, name)`);
          }
          if (![1, 2, 3, 4].includes(q.round_id)) {
            throw new Error(`Question ${index + 1} : round_id invalide (doit être 1, 2, 3 ou 4)`);
          }
        });

        // Remplacer toutes les questions
        // Note: Ceci va écraser toutes les questions existantes
        const confirmation = window.confirm(
          `Êtes-vous sûr de vouloir importer ${jsonData.questions.length} questions ?\n\n` +
          `⚠️ ATTENTION : Ceci va remplacer TOUTES les questions existantes !\n\n` +
          `Voulez-vous continuer ?`
        );

        if (confirmation) {
          // Ici on devrait idéalement avoir une fonction pour remplacer toutes les questions
          // Pour l'instant, on va afficher un message d'info
          setImportError(null);
          setSaveMessage(`Import prêt : ${jsonData.questions.length} questions. Fonctionnalité en cours de développement.`);
          setSaveSuccess(false);
          
          // Effacer le message après 10 secondes
          setTimeout(() => setSaveMessage(null), 10000);
        }
        
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Erreur lors de l\'import');
        setTimeout(() => setImportError(null), 8000);
      }
    };
    
    reader.readAsText(file);
    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    event.target.value = '';
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-actions">
          <div className="admin-header-info">
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
          const totalRoundQuestions = getQuestionsByRound(round.id).length;
          const isActive = activeRound === round.id;

          return (
            <div key={round.id} className={`round-section ${isActive ? 'active' : ''}`}>
              <button
                className={`round-header ${getRoundClass(round.id)}`}
                onClick={() => handleRoundClick(round.id)}
              >
                <div className="round-title">
                  <h3>{getRoundName(round.id)}</h3>
                  <span className="question-count">{totalRoundQuestions} questions</span>
                </div>
                <span className={`expand-icon ${isActive ? 'active' : ''}`}>
                  {isActive ? '×' : '🔍'}
                </span>
              </button>

              {isActive && (
                <div className="round-workspace">
                  <div className="workspace-header">
                    <div className="round-search">
                      <input
                        type="text"
                        placeholder={`Rechercher dans ${getRoundName(round.id)}...`}
                        value={roundSearchTerm}
                        onChange={(e) => handleRoundSearch(e.target.value)}
                        className="search-input round-search-input"
                        autoFocus
                      />
                      {roundSearchTerm && (
                        <button
                          onClick={clearRoundSearch}
                          className="clear-search-btn"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    <button 
                      className="add-question-btn"
                      onClick={() => handleAddQuestion(round.id as 1 | 2 | 3 | 4)}
                      title="Ajouter une question"
                    >
                      ➕ Nouvelle question
                    </button>
                  </div>
                  
                  <div className="questions-grid">
                    {!roundSearchTerm && !globalSearchTerm && roundQuestions.length === 0 ? (
                      <div className="search-prompt">
                        <div className="search-icon">🔍</div>
                        <p>Commencez à taper pour rechercher des questions dans <strong>{getRoundName(round.id)}</strong></p>
                        <p className="search-stats">{totalRoundQuestions} questions disponibles dans ce round</p>
                        <p className="search-hint">Ou utilisez la recherche globale ci-dessus pour chercher dans tous les rounds</p>
                      </div>
                    ) : roundQuestions.length === 0 ? (
                      <div className="no-results">
                        <p>Aucune question trouvée pour "{roundSearchTerm}"</p>
                        <button 
                          className="add-first-question-btn"
                          onClick={() => handleAddQuestion(round.id as 1 | 2 | 3 | 4)}
                        >
                          ➕ Créer une question avec ce terme
                        </button>
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
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="admin-footer">
        <div className="admin-actions">
          <div className="import-export-actions">
            <input
              type="file"
              accept=".json"
              onChange={handleImportQuestions}
              style={{ display: 'none' }}
              id="import-questions-input"
            />
            <label 
              htmlFor="import-questions-input"
              className="import-btn"
              title="Importer des questions depuis un fichier JSON"
            >
              📤 Importer questions
            </label>
            <button 
              className="export-btn"
              onClick={exportData}
              title="Télécharger un fichier JSON avec toutes les questions"
            >
              📥 Télécharger backup
            </button>
          </div>
          <button 
            className={`save-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges || loading}
            title="Sauvegarder définitivement les modifications"
          >
            {loading ? '⏳ Sauvegarde...' : hasUnsavedChanges ? '💾 Sauvegarder définitivement' : '✅ Sauvegardé'}
          </button>
        </div>
        
        {saveMessage && (
          <div className={`admin-message ${saveSuccess ? 'success' : 'error'}`}>
            <p>{saveMessage}</p>
            <button onClick={() => setSaveMessage(null)} className="clear-message-btn">✕</button>
          </div>
        )}
        
        {importError && (
          <div className="admin-message error">
            <p>❌ Import échoué : {importError}</p>
            <button onClick={() => setImportError(null)} className="clear-message-btn">✕</button>
          </div>
        )}
        
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