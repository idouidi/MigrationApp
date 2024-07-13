const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const nodePackageMapping = {
    "BlxArianeB2bHub": "AglFmkB2B",
    "BlxB2bHubAs2Canonical": "AglFmkB2B",
    "BlxHttpB2bHubCanonical": "AglFmkB2B",
    "BlxFramework": "AglFmkB2B",
    "BlxB2bHubPollingCanonical": "AglFmkB2B",
    "BlxFrameworkMonitoringEngine": "AglFmkMonitoring",
    "BlxMdmMoiraLocationsConcertoCanonical": "AglMdmMoiraLocation",
    "BlxMdmMoiraLocationsConcerto": "AglMdmMoiraLocation",
    "BlxConcertoFocusCanonical": "AglMdmMoiraLocation",
    "BlxMdmF2Canonical": "AglMdmMoiraLocation",
    "BlxMdmPartyPartnersCanonical": "AglMdmMoiraParty",
    "BlxMdmPartyMoira": "AglMdmMoiraParty",
    "BlxMdmMoiraLocations": "AglMdmMoiraLocation",
    "BlxMdmPartyMoiraCanonical": "AglMdmMoiraParty",
    "BlxMdmAkinaB2bHub": "AglMdmMoiraParty",
    "BlxMdmPartyPartnersB2bHub": "AglMdmMoiraParty",
    "BlxMdmInfoCentreCanonical": "AglMdmMoiraLocation",
    "BlxCpdpTopazeCanonical": "AglMdmMoiraLocation",
    "BlxCanonical": "AglFmkMonitoring",
    "BlxMdmMoiraLocationsCanonical":"AglMdmMoiraLocation",
    "BlxIcmsDouaneKenyaCanonical":"AglMdmMoiraLocation",
    "BlxMonitoringEngine": "AglFmkMonitoringServer"
};

async function parcourirDossier(dossier, regex, regexInvoke, correspondancesXML, replacements) {
    const fichiers = fs.readdirSync(dossier);

    for (const fichier of fichiers) {
        const cheminFichier = path.join(dossier, fichier);
        const stats = fs.statSync(cheminFichier);

        if (stats.isDirectory()) {
            await parcourirDossier(cheminFichier, regex, regexInvoke, correspondancesXML, replacements);
        } else if (stats.isFile()) {
            const extension = path.extname(cheminFichier).toLowerCase();
            if (extension === '.jar') {
                console.log(`Le fichier ${cheminFichier} est ignoré car il s'agit d'un fichier JAR ou d'un fichier Java compilé.`);
                continue;
            }
            let contenuFichier = fs.readFileSync(cheminFichier, 'utf-8');


            for (const oldName in correspondancesXML) {
                const newName = correspondancesXML[oldName];
                const regexOldName = new RegExp(oldName, 'g');
                contenuFichier = contenuFichier.replace(regexOldName, newName);
            }

            contenuFichier = contenuFichier.replace(regexInvoke, (match, service, method) => {
                const key = `${service}:${method}`;
                if (correspondancesXML.hasOwnProperty(key)) {
                    console.log(`doInvoke("${correspondancesXML[key].split(":")[0]}", "${method}",`)
                    return `doInvoke("${correspondancesXML[key]}", "${method}",`;
                } else {
                    return match;
                }
            });

            for (const oldPackage in nodePackageMapping) {
                const newPackage = nodePackageMapping[oldPackage];
                const regexPackage = new RegExp(`<value name="node_pkg">${oldPackage}</value>`, 'g');
                contenuFichier = contenuFichier.replace(regexPackage, `<value name="node_pkg">${newPackage}</value>`);
            }

            replacements.forEach(([from, to]) => {
                contenuFichier = contenuFichier.replace(new RegExp(from, 'g'), to.trim());
            });
            fs.writeFileSync(cheminFichier, contenuFichier, 'utf-8');
        }
    }
}

function replaceElementsInFolderFromDicoService(dictionnary, regexToReplaceInFile, dossier, oldRootName) {

    fs.readFile(dictionnary, 'utf-8', (err, data) => {
        if (err) {
            console.error('Erreur de lecture du fichier XML :', err);
            return;
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error('Erreur de parsing XML :', err);
                return;
            }

            const mapping = result.Values.array[0].record;
            const correspondancesXML = {};

            mapping.forEach(record => {
                const services = record.array[0].record;

                services.forEach(service => {
                    const oldName = service.value.find(item => item.$.name === 'oldName')._;
                    const newName = service.value.find(item => item.$.name === 'newName')._;
                    correspondancesXML[oldName] = newName;
                });
            });

            const regex = new RegExp(oldRootName + ".*?:.*?(<|\"|\/|:|\\?|\\;|\\'|\\ %)", "g");

            const regexInvoke = /doInvoke\("([^"]+)",\s*"([^"]+)",/g

            fs.readFile(regexToReplaceInFile, 'utf-8', async (err, replacementsData) => {
                if (err) {
                    console.error('Erreur de lecture du fichier de remplacements :', err);
                    return;
                }

                const replacements = replacementsData
                    .trim()
                    .split('\n')
                    .map((line) => line.split(','));

                try {
                    await parcourirDossier(dossier, regex, regexInvoke, correspondancesXML, replacements);
                    console.log('Tous les remplacements ont été effectués avec succès.');
                } catch (err) {
                    console.error('Erreur lors de la modification des fichiers :', err);
                }
            });
        });
    });
}

module.exports = replaceElementsInFolderFromDicoService;