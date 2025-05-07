// Script minimaliste ciblant spécifiquement #prompt-textarea pour la touche Entrée
(function() {
    // Fonction qui attend que l'élément avec ID prompt-textarea apparaisse
    function attachEnterToPromptTextarea() {
        const textarea = document.getElementById('prompt-textarea');
        if (!textarea) {
            // Si l'élément n'existe pas encore, vérifier à nouveau dans 200ms
            setTimeout(attachEnterToPromptTextarea, 200);
            return;
        }
        
        // Si l'élément existe mais a déjà un gestionnaire, ne rien faire
        if (textarea.getAttribute('data-enter-handler') === 'true') {
            return;
        }
        
        console.log('Élément #prompt-textarea trouvé, ajout du gestionnaire Entrée');
        
        // Marquer l'élément comme ayant déjà un gestionnaire
        textarea.setAttribute('data-enter-handler', 'true');
        
        // Ajouter l'écouteur d'événement pour la touche Entrée
        textarea.addEventListener('keydown', function(event) {
            // Si c'est la touche Entrée sans la touche Shift
            if (event.key === 'Enter' && !event.shiftKey) {
                // Chercher le bouton d'envoi le plus proche
                const sendButton = document.querySelector('button[data-testid="send-button"]');
                if (sendButton && !sendButton.disabled) {
                    // Empêcher le comportement par défaut (ajout d'une nouvelle ligne)
                    event.preventDefault();
                    // Cliquer sur le bouton d'envoi
                    sendButton.click();
                    console.log('Message envoyé via la touche Entrée');
                }
            }
        });
    }
    
    // Commencer à vérifier la présence de l'élément
    attachEnterToPromptTextarea();
    
    // Surveiller les changements du DOM pour détecter si l'élément est ajouté plus tard
    const observer = new MutationObserver(function() {
        const textarea = document.getElementById('prompt-textarea');
        if (textarea && textarea.getAttribute('data-enter-handler') !== 'true') {
            attachEnterToPromptTextarea();
        }
    });
    
    // Observer tout le body pour les changements
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('Script d\'écoute de la touche Entrée pour #prompt-textarea activé');
})();