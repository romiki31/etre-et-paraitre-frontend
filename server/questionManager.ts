import fs from 'fs';
import path from 'path';
import { Question, Round } from '../src/Interfaces';

interface QuestionHistory {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
  question: Question;
  previousVersion?: Question;
}

interface SaveResult {
  success: boolean;
  message: string;
  backupPath?: string;
}

export class QuestionManager {
  private readonly constantsPath: string;
  private readonly backupDir: string;

  constructor() {
    this.constantsPath = path.join(process.cwd(), 'server/constantes.ts');
    this.backupDir = path.join(process.cwd(), 'server/backups');
    
    // Créer le répertoire de backup s'il n'existe pas
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Créer un backup du fichier constantes.ts
   */
  private createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `constantes-${timestamp}.ts`);
    
    if (fs.existsSync(this.constantsPath)) {
      fs.copyFileSync(this.constantsPath, backupPath);
    }
    
    return backupPath;
  }

  /**
   * Valider la structure des questions
   */
  private validateQuestions(questions: Question[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier que c'est un tableau
    if (!Array.isArray(questions)) {
      errors.push('Les questions doivent être un tableau');
      return { isValid: false, errors };
    }

    // Vérifier chaque question
    questions.forEach((question, index) => {
      if (!question.id || typeof question.id !== 'number') {
        errors.push(`Question ${index + 1}: ID manquant ou invalide`);
      }

      if (!question.round_id || ![1, 2, 3, 4].includes(question.round_id)) {
        errors.push(`Question ${index + 1}: round_id invalide (doit être 1, 2, 3 ou 4)`);
      }

      if (!question.name || typeof question.name !== 'string' || question.name.trim().length === 0) {
        errors.push(`Question ${index + 1}: nom manquant ou invalide`);
      }

      // Vérifier qu'il y a au moins 2 réponses
      const answers = [question.answer_1, question.answer_2, question.answer_3, question.answer_4]
        .filter(answer => answer !== null && answer !== undefined && answer.trim().length > 0);
      
      if (answers.length < 2) {
        errors.push(`Question ${index + 1}: au moins 2 réponses sont requises`);
      }
    });

    // Vérifier l'unicité des IDs
    const ids = questions.map(q => q.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      errors.push('Les IDs des questions doivent être uniques');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Générer le contenu du fichier constantes.ts
   */
  private generateConstantsFileContent(questions: Question[]): string {
    const roundsContent = `export const rounds: Round[] = [
  {
    id: 1,
    name: "Personnalité",
  },
  {
    id: 2,
    name: "Situations",
  },
  {
    id: 3,
    name: "Représentations",
  },
  {
    id: 4,
    name: "Relations",
  },
];`;

    const questionsContent = questions.map(question => {
      const answer1 = question.answer_1 ? `"${question.answer_1.replace(/"/g, '\\"')}"` : 'null';
      const answer2 = question.answer_2 ? `"${question.answer_2.replace(/"/g, '\\"')}"` : 'null';
      const answer3 = question.answer_3 ? `"${question.answer_3.replace(/"/g, '\\"')}"` : 'null';
      const answer4 = question.answer_4 ? `"${question.answer_4.replace(/"/g, '\\"')}"` : 'null';

      return `  {
    id: ${question.id},
    round_id: ${question.round_id},
    name: "${question.name.replace(/"/g, '\\"')}",
    answer_1: ${answer1},
    answer_2: ${answer2},
    answer_3: ${answer3},
    answer_4: ${answer4},
  }`;
    }).join(',\n');

    return `import { Question, Round } from "../src/Interfaces";

${roundsContent}
export const questions: Question[] = [
${questionsContent}
];`;
  }

  /**
   * Sauvegarder les questions dans le fichier constantes.ts
   */
  async saveQuestions(questions: Question[], history: QuestionHistory[]): Promise<SaveResult> {
    try {
      console.log(`📝 Début de sauvegarde de ${questions.length} questions...`);

      // Valider les questions
      const validation = this.validateQuestions(questions);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation échouée: ${validation.errors.join(', ')}`
        };
      }

      // Créer un backup avant modification
      const backupPath = this.createBackup();
      console.log(`💾 Backup créé: ${backupPath}`);

      // Générer le nouveau contenu
      const newContent = this.generateConstantsFileContent(questions);

      // Écrire le fichier
      fs.writeFileSync(this.constantsPath, newContent, 'utf8');

      // Sauvegarder l'historique
      await this.saveHistory(history);

      console.log(`✅ Sauvegarde réussie: ${questions.length} questions sauvegardées`);

      return {
        success: true,
        message: `${questions.length} questions sauvegardées avec succès`,
        backupPath
      };

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      return {
        success: false,
        message: `Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Sauvegarder l'historique des modifications
   */
  private async saveHistory(history: QuestionHistory[]): Promise<void> {
    try {
      const historyPath = path.join(this.backupDir, 'history.json');
      
      let existingHistory: QuestionHistory[] = [];
      if (fs.existsSync(historyPath)) {
        const historyContent = fs.readFileSync(historyPath, 'utf8');
        existingHistory = JSON.parse(historyContent);
      }

      // Ajouter les nouvelles entrées au début
      const updatedHistory = [...history, ...existingHistory];
      
      // Garder seulement les 1000 dernières entrées
      const limitedHistory = updatedHistory.slice(0, 1000);

      fs.writeFileSync(historyPath, JSON.stringify(limitedHistory, null, 2), 'utf8');
      console.log(`📋 Historique sauvegardé: ${history.length} nouvelles entrées`);

    } catch (error) {
      console.error('⚠️ Erreur lors de la sauvegarde de l\'historique:', error);
      // Ne pas faire échouer la sauvegarde principale pour un problème d'historique
    }
  }

  /**
   * Récupérer l'historique des modifications
   */
  async getHistory(): Promise<QuestionHistory[]> {
    try {
      const historyPath = path.join(this.backupDir, 'history.json');
      
      if (!fs.existsSync(historyPath)) {
        return [];
      }

      const historyContent = fs.readFileSync(historyPath, 'utf8');
      return JSON.parse(historyContent);

    } catch (error) {
      console.error('⚠️ Erreur lors de la lecture de l\'historique:', error);
      return [];
    }
  }

  /**
   * Lister les backups disponibles
   */
  getBackups(): string[] {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      return fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('constantes-') && file.endsWith('.ts'))
        .sort()
        .reverse(); // Plus récent en premier

    } catch (error) {
      console.error('⚠️ Erreur lors de la lecture des backups:', error);
      return [];
    }
  }

  /**
   * Restaurer depuis un backup
   */
  async restoreFromBackup(backupFileName: string): Promise<SaveResult> {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          message: 'Fichier de backup introuvable'
        };
      }

      // Créer un backup de la version actuelle avant restauration
      const currentBackupPath = this.createBackup();

      // Restaurer le backup
      fs.copyFileSync(backupPath, this.constantsPath);

      return {
        success: true,
        message: `Restauration depuis ${backupFileName} réussie`,
        backupPath: currentBackupPath
      };

    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error);
      return {
        success: false,
        message: `Erreur lors de la restauration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}