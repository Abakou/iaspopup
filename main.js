const { app, BrowserWindow, ipcMain, BrowserView, Tray, Menu, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let tray;

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
    backgroundColor: '#343541'
  });

  // Créer une vue pour le contenu web
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.setBrowserView(view);
  view.setBounds({ x: 0, y: 30, width: 420, height: 570 });
  view.setAutoResize({ width: true, height: true });
  
  // Charger ChatGPT dans la vue
  view.webContents.loadURL('https://chat.openai.com/');

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

  // Afficher une barre de titre personnalisée dans la fenêtre principale
  mainWindow.loadFile('titlebar.html');

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
      view.setBounds({ x: 0, y: 30, width: bounds.width, height: bounds.height - 30 });
    }
  });

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  // Gérer le changement d'opacité
  ipcMain.on('set-opacity', (event, opacity) => {
    if (mainWindow) {
      mainWindow.setOpacity(opacity);
    }
  });
  
  // Gérer le basculement de l'option "toujours visible"
  ipcMain.on('toggle-always-on-top', () => {
    if (mainWindow) {
      const isAlwaysOnTop = !mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(isAlwaysOnTop);
      
      // Notifier la fenêtre de l'état actuel
      mainWindow.webContents.send('always-on-top-changed', isAlwaysOnTop);
      
      // Mettre à jour l'état dans le menu contextuel de la barre des tâches
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
        { 
          label: 'Toujours au premier plan', 
          type: 'checkbox',
          checked: isAlwaysOnTop,
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
      
      // Mettre à jour le menu contextuel de la barre des tâches
      tray.setContextMenu(contextMenu);
    }
  });
  
  // Redimensionner la vue lors du redimensionnement de la fenêtre
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds();
    view.setBounds({ x: 0, y: 30, width: bounds.width, height: bounds.height - 30 });
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
  
  // Définir le menu contextuel (clic droit)
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
    { 
      label: 'Toujours au premier plan', 
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(menuItem.checked);
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
  
  // Définir le titre au survol
  tray.setToolTip('ChatGPT Popup');
  
  // Définir le menu contextuel
  tray.setContextMenu(contextMenu);
  
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