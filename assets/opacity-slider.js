// Fonction pour envoyer l'opacité au processus principal
function setOpacity(value) {
  if (window.electronAPI && window.electronAPI.setOpacity) {
    window.electronAPI.setOpacity(value);
  }
}

// Créer et ajouter le sélecteur d'IA et le bouton toujours visible
document.addEventListener('DOMContentLoaded', () => {
  // Créer le conteneur principal
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'controls-container';
  controlsContainer.style.cssText = 'display: flex; align-items: center; margin-left: 15px; -webkit-app-region: no-drag;';
  
  // Créer le sélecteur d'IA
  const aiSelectorContainer = document.createElement('div');
  aiSelectorContainer.className = 'ai-selector-container';
  aiSelectorContainer.style.cssText = 'display: flex; align-items: center;';
  
  // Créer le sélecteur déroulant
  const aiSelector = document.createElement('select');
  aiSelector.className = 'ai-selector';
  aiSelector.style.cssText = 'background-color: rgba(255, 255, 255, 0.1); color: #fff; border: none; border-radius: 4px; padding: 2px 6px; font-size: 12px; cursor: pointer; outline: none;';
  
  // Définir les options du sélecteur
  const aiOptions = [
    { id: 'gpt', name: 'ChatGPT' },
    { id: 'claude', name: 'Claude' },
    { id: 'deepseek', name: 'Deepseek' },
    { id: 'grok', name: 'Grok' }
  ];
  
  // Ajouter les options au sélecteur
  aiOptions.forEach(ai => {
    const option = document.createElement('option');
    option.style.cssText="color:black; line-height: 2rem;";
    option.value = ai.id;
    option.textContent = ai.name;
    aiSelector.appendChild(option);
  });
  
  // Ajouter l'événement de changement
  aiSelector.addEventListener('change', () => {
    if (window.electronAPI && window.electronAPI.switchAI) {
      window.electronAPI.switchAI(aiSelector.value);
    }
  });
  
  // Mettre à jour le sélecteur lorsque l'IA change
  if (window.electronAPI && window.electronAPI.onCurrentAIChanged) {
    window.electronAPI.onCurrentAIChanged((aiId) => {
      aiSelector.value = aiId;
    });
  }
  
  // Assembler les éléments du sélecteur d'IA
  aiSelectorContainer.appendChild(aiSelector);
  
  // Créer le bouton toujours visible 
  const alwaysOnTopBtn = document.createElement('div');
  alwaysOnTopBtn.id = 'alwaysOnTopBtn';
  alwaysOnTopBtn.className = 'toggle-button';
  alwaysOnTopBtn.title = 'Toujours visible';
  alwaysOnTopBtn.style.cssText = 'margin-left: 10px; display: flex; align-items: center; background-color: rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 2px 6px; cursor: pointer;';
  
  const pinIcon = document.createElement('span');
  pinIcon.className = 'pin-icon';
  pinIcon.textContent = '📌'; // 📌 = 📌 (emoji épingle)
  pinIcon.style.cssText = 'font-size: 12px; margin-right: 4px;';
  
  const statusIndicator = document.createElement('span');
  statusIndicator.className = 'status-indicator active';
  statusIndicator.style.cssText = 'width: 6px; height: 6px; border-radius: 50%; margin-left: 2px; background-color: #27c93f;';
  
  alwaysOnTopBtn.appendChild(pinIcon);
  alwaysOnTopBtn.appendChild(statusIndicator);
  
  // Ajouter l'écouteur d'événement au bouton
  alwaysOnTopBtn.addEventListener('click', () => {
    if (window.electronAPI && window.electronAPI.toggleAlwaysOnTop) {
      window.electronAPI.toggleAlwaysOnTop();
    }
  });
  
  // Ajouter le gestionnaire pour mettre à jour l'indicateur d'état
  if (window.electronAPI && window.electronAPI.onAlwaysOnTopChanged) {
    window.electronAPI.onAlwaysOnTopChanged((isAlwaysOnTop) => {
      if (isAlwaysOnTop) {
        statusIndicator.className = 'status-indicator active';
        statusIndicator.style.backgroundColor = '#27c93f';
      } else {
        statusIndicator.className = 'status-indicator inactive';
        statusIndicator.style.backgroundColor = '#aaa';
      }
    });
  }
  
  // Ajouter les composants dans le bon ordre: sélecteur d'IA puis bouton toujours visible
  controlsContainer.appendChild(aiSelectorContainer);
  controlsContainer.appendChild(alwaysOnTopBtn);
  
  // Note: Le contrôle d'opacité est masqué selon la demande
  
  // Ajouter à la barre de titre
  const titlebar = document.querySelector('.titlebar');
  if (titlebar) {
    titlebar.insertBefore(controlsContainer, titlebar.lastChild);
  }
});