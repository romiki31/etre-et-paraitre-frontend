#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('Entrez le mot de passe admin : ', (password) => {
      if (password.length < 8) {
        console.log('❌ Le mot de passe doit contenir au moins 8 caractères');
        askPassword().then(resolve);
      } else {
        rl.question('Confirmez le mot de passe : ', (confirmPassword) => {
          if (password === confirmPassword) {
            resolve(password);
          } else {
            console.log('❌ Les mots de passe ne correspondent pas');
            askPassword().then(resolve);
          }
        });
      }
    });
  });
}

async function setupAdmin() {
  console.log('🔐 Configuration du compte administrateur\n');
  
  const configPath = path.join(__dirname, '../server/admin-config.json');
  
  // Vérifier si le fichier existe déjà
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.passwordHash) {
      console.log('⚠️  Un compte admin existe déjà !');
      const overwrite = await new Promise((resolve) => {
        rl.question('Voulez-vous le remplacer ? (y/N) : ', (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });
      
      if (!overwrite) {
        console.log('❌ Opération annulée');
        rl.close();
        return;
      }
    }
  }
  
  const password = await askPassword();
  console.log('\n🔄 Génération du hash...');
  
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  const adminConfig = {
    passwordHash,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  // Créer le répertoire server s'il n'existe pas
  const serverDir = path.join(__dirname, '../server');
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(adminConfig, null, 2));
  
  console.log('✅ Compte administrateur configuré avec succès !');
  console.log(`📁 Configuration sauvegardée dans : ${configPath}`);
  console.log('\n⚠️  IMPORTANT : Ajoutez admin-config.json à votre .gitignore !');
  
  rl.close();
}

setupAdmin().catch(console.error);