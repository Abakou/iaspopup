// Fonction pour envoyer l'opacité au processus principal
function setOpacity(value) {
  if (window.electronAPI && window.electronAPI.setOpacity) {
    window.electronAPI.setOpacity(value);
  }
}

// Créer et ajouter le contrôle d'opacité
document.addEventListener('DOMContentLoaded', () => {
  // Créer le conteneur du curseur
  const opacityContainer = document.createElement('div');
  opacityContainer.className = 'opacity-container';
  opacityContainer.style.cssText = 'display: flex; align-items: center; margin-left: 15px; -webkit-app-region: no-drag;';
  
  // Ajouter une étiquette
  const opacityLabel = document.createElement('div');
  opacityLabel.textContent = 'Opacité:';
  opacityLabel.style.cssText = 'font-size: 11px; color: #aaa; margin-right: 5px;';
  
  // Créer le curseur de contrôle d'opacité
  const opacitySlider = document.createElement('input');
  opacitySlider.type = 'range';
  opacitySlider.min = '30';
  opacitySlider.max = '100';
  opacitySlider.value = '100';
  opacitySlider.style.cssText = 'width: 60px; height: 3px;';
  
  // Ajouter l'événement de changement
  opacitySlider.addEventListener('input', () => {
    const opacity = parseInt(opacitySlider.value) / 100;
    setOpacity(opacity);
  });
  
  // Assembler les éléments
  opacityContainer.appendChild(opacityLabel);
  opacityContainer.appendChild(opacitySlider);
  
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
  
  // Ajouter le bouton toujours visible après le slider d'opacité
  opacityContainer.appendChild(alwaysOnTopBtn);
  
  // Ajouter à la barre de titre
  const titlebar = document.querySelector('.titlebar');
  if (titlebar) {
    titlebar.insertBefore(opacityContainer, titlebar.lastChild);
  }
});