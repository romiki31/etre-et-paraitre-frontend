import { useState, useEffect, useCallback } from 'react';
import { Question, Round } from '../Interfaces';
import { questions as initialQuestions, rounds } from '../../server/constantes';

interface QuestionHistory {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
  question: Question;
  previousVersion?: Question;
}

interface AdminQuestionsState {
  questions: Question[];
  history: QuestionHistory[];
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

const API_BASE = 'http://localhost:5001';

export const useAdminQuestions = () => {
  const [state, setState] = useState<AdminQuestionsState>({
    questions: initialQuestions,
    history: [],
    loading: false,
    error: null,
    hasUnsavedChanges: false
  });

  // Générer un nouvel ID unique pour une question
  const generateNewId = useCallback(() => {
    const maxId = Math.max(...state.questions.map(q => q.id), 0);
    return maxId + 1;
  }, [state.questions]);

  // Ajouter une entrée à l'historique
  const addToHistory = useCallback((action: 'created' | 'updated' | 'deleted', question: Question, previousVersion?: Question) => {
    const historyEntry: QuestionHistory = {
      id: `${action}-${question.id}-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      question: { ...question },
      previousVersion: previousVersion ? { ...previousVersion } : undefined
    };

    setState(prev => ({
      ...prev,
      history: [historyEntry, ...prev.history].slice(0, 100), // Garder les 100 dernières entrées
      hasUnsavedChanges: true
    }));
  }, []);

  // Créer une nouvelle question
  const createQuestion = useCallback((roundId: 1 | 2 | 3 | 4, questionData: Omit<Question, 'id' | 'round_id'>) => {
    const newQuestion: Question = {
      id: generateNewId(),
      round_id: roundId,
      ...questionData
    };

    setState(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      hasUnsavedChanges: true
    }));

    addToHistory('created', newQuestion);
    return newQuestion;
  }, [generateNewId, addToHistory]);

  // Mettre à jour une question existante
  const updateQuestion = useCallback((questionId: number, updates: Partial<Omit<Question, 'id'>>) => {
    setState(prev => {
      const questionIndex = prev.questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {
        return { ...prev, error: 'Question non trouvée' };
      }

      const previousVersion = prev.questions[questionIndex];
      const updatedQuestion = { ...previousVersion, ...updates };
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex] = updatedQuestion;

      // Ajouter à l'historique après mise à jour de l'état
      setTimeout(() => addToHistory('updated', updatedQuestion, previousVersion), 0);

      return {
        ...prev,
        questions: newQuestions,
        error: null,
        hasUnsavedChanges: true
      };
    });
  }, [addToHistory]);

  // Supprimer une question
  const deleteQuestion = useCallback((questionId: number) => {
    setState(prev => {
      const questionIndex = prev.questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {
        return { ...prev, error: 'Question non trouvée' };
      }

      const questionToDelete = prev.questions[questionIndex];
      const newQuestions = prev.questions.filter(q => q.id !== questionId);

      // Ajouter à l'historique après mise à jour de l'état
      setTimeout(() => addToHistory('deleted', questionToDelete), 0);

      return {
        ...prev,
        questions: newQuestions,
        error: null,
        hasUnsavedChanges: true
      };
    });
  }, [addToHistory]);

  // Dupliquer une question
  const duplicateQuestion = useCallback((questionId: number) => {
    const questionToDuplicate = state.questions.find(q => q.id === questionId);
    if (!questionToDuplicate) {
      setState(prev => ({ ...prev, error: 'Question non trouvée' }));
      return;
    }

    const duplicatedQuestion = createQuestion(questionToDuplicate.round_id, {
      name: `${questionToDuplicate.name} (copie)`,
      answer_1: questionToDuplicate.answer_1,
      answer_2: questionToDuplicate.answer_2,
      answer_3: questionToDuplicate.answer_3,
      answer_4: questionToDuplicate.answer_4
    });

    return duplicatedQuestion;
  }, [state.questions, createQuestion]);

  // Obtenir les questions par round
  const getQuestionsByRound = useCallback((roundId: number) => {
    return state.questions.filter(q => q.round_id === roundId);
  }, [state.questions]);

  // Obtenir les statistiques
  const getStatistics = useCallback(() => {
    const stats = {
      totalQuestions: state.questions.length,
      questionsByRound: {} as Record<number, number>,
      questionsWithMultipleAnswers: 0,
      questionsWithTwoAnswers: 0,
      recentChanges: state.history.slice(0, 10)
    };

    rounds.forEach(round => {
      stats.questionsByRound[round.id] = getQuestionsByRound(round.id).length;
    });

    state.questions.forEach(question => {
      const answerCount = [question.answer_1, question.answer_2, question.answer_3, question.answer_4]
        .filter(answer => answer !== null).length;
      
      if (answerCount > 2) {
        stats.questionsWithMultipleAnswers++;
      } else if (answerCount === 2) {
        stats.questionsWithTwoAnswers++;
      }
    });

    return stats;
  }, [state.questions, state.history, getQuestionsByRound]);

  // Sauvegarder les modifications
  const saveChanges = useCallback(async () => {
    if (!state.hasUnsavedChanges) return { success: false, message: 'Aucune modification à sauvegarder' };

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${API_BASE}/api/admin/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questions: state.questions,
          history: state.history.slice(0, 50) // Envoyer les 50 dernières modifications
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la sauvegarde');
      }

      setState(prev => ({
        ...prev,
        loading: false,
        hasUnsavedChanges: false,
        error: null
      }));

      return { 
        success: true, 
        message: result.message,
        backupPath: result.backupPath 
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, message: errorMessage };
    }
  }, [state.questions, state.history, state.hasUnsavedChanges]);

  // Exporter les données
  const exportData = useCallback(() => {
    const exportData = {
      questions: state.questions,
      history: state.history,
      exportDate: new Date().toISOString(),
      statistics: getStatistics()
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.questions, state.history, getStatistics]);

  // Réinitialiser l'erreur
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Restaurer une question supprimée
  const restoreQuestion = useCallback((historyId: string) => {
    const historyEntry = state.history.find(h => h.id === historyId);
    if (!historyEntry || historyEntry.action !== 'deleted') {
      setState(prev => ({ ...prev, error: 'Entrée d\'historique non trouvée' }));
      return;
    }

    const restoredQuestion = {
      ...historyEntry.question,
      id: generateNewId() // Nouveau ID pour éviter les conflits
    };

    setState(prev => ({
      ...prev,
      questions: [...prev.questions, restoredQuestion]
    }));

    addToHistory('created', restoredQuestion);
  }, [state.history, generateNewId, addToHistory]);

  // Valider une question
  const validateQuestion = useCallback((question: Partial<Question>) => {
    const errors: string[] = [];

    if (!question.name || question.name.trim().length === 0) {
      errors.push('Le texte de la question est obligatoire');
    }

    if (question.name && question.name.length > 200) {
      errors.push('Le texte de la question ne peut pas dépasser 200 caractères');
    }

    const answers = [question.answer_1, question.answer_2, question.answer_3, question.answer_4]
      .filter(answer => answer !== null && answer !== undefined && answer.trim().length > 0);

    if (answers.length < 2) {
      errors.push('Au moins deux réponses sont requises');
    }

    answers.forEach((answer, index) => {
      if (answer && answer.length > 100) {
        errors.push(`La réponse ${index + 1} ne peut pas dépasser 100 caractères`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    // État
    questions: state.questions,
    history: state.history,
    loading: state.loading,
    error: state.error,
    hasUnsavedChanges: state.hasUnsavedChanges,

    // Actions CRUD
    createQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,

    // Utilitaires
    getQuestionsByRound,
    getStatistics,
    validateQuestion,
    restoreQuestion,

    // Persistance
    saveChanges,
    exportData,

    // Gestion d'état
    clearError
  };
};