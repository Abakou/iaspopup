const { app, BrowserWindow, ipcMain, BrowserView, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let currentAI = 'gpt'; // Par défaut, on commence avec ChatGPT
let aiViews = {}; // Stocke les vues pour chaque IA

const aiUrls = {
  'gpt': 'https://chat.openai.com/',
  'claude': 'https://claude.ai/',
  'deepseek': 'https://chat.deepseek.com/',
  'grok': 'https://grok.x.ai/'
};

const aiNames = {
  'gpt': 'ChatGPT',
  'claude': 'Claude',
  'deepseek': 'Deepseek',
  'grok': 'Grok'
};

// Fonction pour créer une vue pour chaque IA
function createAIViews() {
  Object.keys(aiUrls).forEach(aiId => {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        partition: `persist:${aiId}` // Sessions séparées pour chaque IA
      }
    });
    
    // Définir les dimensions initiales
    const bounds = mainWindow.getBounds();
    view.setBounds({ x: 0, y: 30, width: bounds.width, height: bounds.height - 30 });
    view.setAutoResize({ width: true, height: true });
    
    // Charger l'URL de l'IA
    view.webContents.loadURL(aiUrls[aiId]);
    
    // Injecter le script pour gérer la touche Enter après le chargement de la page
    view.webContents.on('did-finish-load', () => {
      const fs = require('fs');
      const enterHandlerScript = fs.readFileSync(
        path.join(__dirname, 'assets/prompt-textarea-enter.js'), 
        'utf8'
      );
      
      // Injecter le script dans la page
      view.webContents.executeJavaScript(enterHandlerScript);
    });
    
    // Stocker la vue
    aiViews[aiId] = view;
  });
}

// Fonction pour basculer entre les IA
function switchToAI(aiId) {
  if (!aiViews[aiId]) return;
  
  // Masquer toutes les vues
  Object.keys(aiViews).forEach(id => {
    mainWindow.removeBrowserView(aiViews[id]);
  });
  
  // Afficher la vue sélectionnée
  mainWindow.setBrowserView(aiViews[aiId]);
  
  // Mettre à jour l'état actuel
  currentAI = aiId;
  
  // Mettre à jour l'interface
  if (mainWindow.webContents) {
    mainWindow.webContents.send('current-ai-changed', aiId, aiNames[aiId]);
  }
  
  // Mettre à jour le menu de la barre des tâches
  updateTrayMenu();
}

// Fonction pour mettre à jour le menu contextuel de la barre des tâches
function updateTrayMenu() {
  if (!tray) return;
  
  const aiMenuItems = Object.keys(aiUrls).map(aiId => ({
    label: aiNames[aiId],
    type: 'radio',
    checked: currentAI === aiId,
    click: () => {
      switchToAI(aiId);
    }
  }));
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Afficher', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      } 
    },
    { type: 'separator' },
    ...aiMenuItems,
    { type: 'separator' },
    { 
      label: 'Toujours au premier plan', 
      type: 'checkbox',
      checked: mainWindow ? mainWindow.isAlwaysOnTop() : true,
      click: (menuItem) => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(menuItem.checked);
          mainWindow.webContents.send('always-on-top-changed', menuItem.checked);
        }
      } 
    },
    { 
      label: 'Démarrer avec Windows', 
      type: 'checkbox',
      checked: getAutoLaunchEnabled(),
      click: (menuItem) => {
        setAutoLaunchEnabled(menuItem.checked);
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quitter', 
      click: () => { 
        app.quit(); 
      } 
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function createWindow() {
  // Créer la fenêtre du navigateur avec une barre de titre personnalisée
  mainWindow = new BrowserWindow({
    width: 420,
    height: 600,
    frame: false,  // Fenêtre sans cadre pour un look minimaliste
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    alwaysOnTop: true, // Force la fenêtre à rester au premier plan
    icon: path.join(__dirname, 'assets/chatgpt-popup-icon.ico'),
    backgroundColor: '#343541',
  });

  // Afficher une barre de titre personnalisée dans la fenêtre principale
  mainWindow.loadFile('titlebar.html');

  // Créer une vue pour chaque IA
  createAIViews();
  
  // Afficher l'IA par défaut
  switchToAI(currentAI);

  // Informer l'interface de l'état initial de "toujours visible"
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('always-on-top-changed', mainWindow.isAlwaysOnTop());
    mainWindow.webContents.send('current-ai-changed', currentAI, aiNames[currentAI]);
  });

  // Gestion des événements de la fenêtre
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('toggle-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
      
      // Ajuster la vue au nouvel espace
      const bounds = mainWindow.getBounds();
      if (aiViews[currentAI]) {
        aiViews[currentAI].setBounds({ x: 0, y: 30, width: bounds.width, height: bounds.height - 30 });
      }
    }
  });

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });
  
  // Gérer le changement d'IA
  ipcMain.on('switch-ai', (event, aiId) => {
    switchToAI(aiId);
  });

  // Gérer le basculement de l'option "toujours visible"
  ipcMain.on('toggle-always-on-top', () => {
    if (mainWindow) {
      const isAlwaysOnTop = !mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(isAlwaysOnTop);
      
      // Notifier la fenêtre de l'état actuel
      mainWindow.webContents.send('always-on-top-changed', isAlwaysOnTop);
      
      // Mettre à jour le menu de la barre des tâches
      updateTrayMenu();
    }
  });
  
  // Redimensionner la vue lors du redimensionnement de la fenêtre
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds();
    if (aiViews[currentAI]) {
      aiViews[currentAI].setBounds({ x: 0, y: 30, width: bounds.width, height: bounds.height - 30 });
    }
  });
  
  // Ajuster l'opacité lorsque la fenêtre gagne/perd le focus
  mainWindow.on('focus', () => {
    mainWindow.setOpacity(1.0); // Opacité maximale lorsque la fenêtre est active
  });
  
  mainWindow.on('blur', () => {
    // Récupérer l'opacité actuelle (si définie par l'utilisateur)
    const currentOpacity = mainWindow.getOpacity();
    if (currentOpacity === 1.0) {
      // Si pas encore ajusté, réduire légèrement l'opacité
      mainWindow.setOpacity(0.85);
    }
  });
}

// Vérifier si l'application est configurée pour démarrer avec Windows
function getAutoLaunchEnabled() {
  return app.getLoginItemSettings().openAtLogin;
}

// Activer/désactiver le démarrage automatique
function setAutoLaunchEnabled(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath
  });
}

function createTray() {
  // Créer une icône dans la barre des tâches
  tray = new Tray(path.join(__dirname, 'assets/chatgpt-popup-icon.ico'));
  
  // Mettre à jour le menu
  updateTrayMenu();
  
  // Définir le titre au survol
  tray.setToolTip('AI Chat Popup');
  
  // Clic gauche sur l'icône
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Enregistrer le raccourci clavier global (Alt+Espace)
  globalShortcut.register('Alt+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});