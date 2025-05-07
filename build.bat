@echo off
echo ===== Installation des dépendances =====
call npm install

echo ===== Compilation de l'application =====
call npm run dist

echo ===== Compilation terminée =====
echo L'installateur se trouve dans le dossier "dist"
pause