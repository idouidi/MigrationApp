const fs = require('fs');
const path = require('path');

function remplacerSlash(chaine) {
    var dernierIndex = chaine.lastIndexOf("/");
    var nouvelleChaine = chaine.replace(/\//g, ".");
    nouvelleChaine = nouvelleChaine.substring(0, dernierIndex) + ":" + nouvelleChaine.substring(dernierIndex + 1);
    return nouvelleChaine;
}

function parcourirDossiers(dossierIn, cheminActuel, fichierOut, niveauProfondeur = 0) {
    const fichiers = fs.readdirSync(cheminActuel || dossierIn);
    let ecritureDansFichierEffectuee = false;
    let contientDossiers = false;

    fichiers.forEach((fichier) => {
        const chemin = cheminActuel ? path.join(cheminActuel, fichier) : path.join(dossierIn, fichier);
        const stat = fs.statSync(chemin);

        if (stat.isDirectory()) {
            contientDossiers = true;
            const sousDossiers = fs.readdirSync(chemin);
            const premierSousDossierNs = sousDossiers.find(sousDossier => sousDossier === 'ns');
            if (premierSousDossierNs) {
                const cheminNs = path.join(chemin, premierSousDossierNs);
                parcourirDossiers(dossierIn, cheminNs, fichierOut, niveauProfondeur + 1);
            } else {
                parcourirDossiers(dossierIn, chemin, fichierOut, niveauProfondeur + 1);
            }
        }
    });

    if (!contientDossiers && niveauProfondeur > 0) {
        let finalPath = cheminActuel.replace(/^.*?\/.*?\/.*?\//, '');
        finalPath = remplacerSlash(finalPath)
        fs.appendFileSync(fichierOut, finalPath + '\n');
    }
}

module.exports = parcourirDossiers;
