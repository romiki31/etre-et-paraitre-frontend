import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'epercept-admin-secret-key-change-in-production';
const JWT_EXPIRES_IN = '2h';

interface AdminConfig {
  passwordHash: string;
  createdAt: string;
  lastUpdated: string;
}

interface JwtPayload {
  admin: boolean;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    admin: boolean;
  };
}

const getAdminConfig = (): AdminConfig | null => {
  try {
    // Essayer plusieurs chemins possibles
    const possiblePaths = [
      path.join(__dirname, 'admin-config.json'),
      path.join(__dirname, '../server/admin-config.json'),
      path.join(process.cwd(), 'server/admin-config.json'),
    ];
    
    let configPath = '';
    for (const tryPath of possiblePaths) {
      if (fs.existsSync(tryPath)) {
        configPath = tryPath;
        break;
      }
    }
    
    if (!configPath) {
      console.log('Fichier admin-config.json non trouvé dans les chemins:', possiblePaths);
      return null;
    }
    
    console.log('Fichier admin-config.json trouvé à:', configPath);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config;
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier admin-config.json:', error);
    return null;
  }
};

const updateAdminConfig = (config: AdminConfig): boolean => {
  try {
    // Utiliser le même chemin que pour la lecture
    const configPath = path.join(process.cwd(), 'server/admin-config.json');
    config.lastUpdated = new Date().toISOString();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fichier admin-config.json:', error);
    return false;
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Mot de passe requis' });
    }

    const adminConfig = getAdminConfig();
    if (!adminConfig) {
      return res.status(500).json({ message: 'Configuration admin non trouvée. Exécutez npm run admin:setup' });
    }

    const isValidPassword = await bcrypt.compare(password, adminConfig.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      { admin: true },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Authentification réussie',
      token,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const changeAdminPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mots de passe requis' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    const adminConfig = getAdminConfig();
    if (!adminConfig) {
      return res.status(500).json({ message: 'Configuration admin non trouvée' });
    }

    const isValidCurrentPassword = await bcrypt.compare(currentPassword, adminConfig.passwordHash);
    if (!isValidCurrentPassword) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    const updatedConfig = {
      ...adminConfig,
      passwordHash: newPasswordHash
    };

    const success = updateAdminConfig(updatedConfig);
    if (!success) {
      return res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
    }

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const authenticateAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token d\'authentification requis' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.admin) {
      return res.status(403).json({ message: 'Accès administrateur requis' });
    }

    req.user = { admin: true };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expiré' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token invalide' });
    }
    console.error('Erreur lors de l\'authentification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const verifyAdminSetup = (req: Request, res: Response) => {
  const adminConfig = getAdminConfig();
  res.json({ 
    isSetup: adminConfig !== null,
    message: adminConfig ? 'Configuration admin trouvée' : 'Configuration admin non trouvée'
  });
};