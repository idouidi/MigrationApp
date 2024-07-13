const fs = require('fs-extra');
const path = require('path');
const xml2js = require('xml2js');

let OtherDirectoryAlreadyCopied = 0; // Flag pour contrôler la copie des répertoires au même niveau

const errorLogFilePath = '/home/NicKOOU/AGL_NODE/Run/error.log';

// Effacer le contenu du fichier de log au début de l'exécution
fs.writeFileSync(errorLogFilePath, '', { flag: 'w' });

function generatesPackagesFromDico(xmlFilePath, outputDirectory) {
    readXmlFile(xmlFilePath, (err, targetpkgValues, serviceNamePairs) => {
        if (err) {
            console.error(`Erreur: ${err.message}`);
            return;
        }

        const packageServiceMap = mapServicesToPackages(targetpkgValues, serviceNamePairs);

        Object.keys(packageServiceMap).forEach(aglPackageName => {
            const packagePath = path.join(outputDirectory, aglPackageName);
            createDirectoryIfNotExists(packagePath);

            packageServiceMap[aglPackageName].forEach(pair => {
                const { oldName, newName } = pair;
                let sourceFilePath = findSourceFilePath(oldName);
                if (sourceFilePath) {
                    const destinationFilePath = path.join(packagePath, 'ns', newName.replace(/[.:]/g, '/'));
                    copyDirectory(sourceFilePath, destinationFilePath);

                    // Copier le dossier source et ses éléments à la même profondeur que /ns/ si le flag est à 0
                    if (OtherDirectoryAlreadyCopied === 0) {
                        copyDirectoryAtSameLevel(sourceFilePath, destinationFilePath);
                        OtherDirectoryAlreadyCopied = 1; // Mettre à jour le flag après la première copie
                    }
                } else {
                    // console.log(`Fichier correspondant à ${oldName} non trouvé dans le répertoire`);
                    writeErrorLog(oldName);
                }
            });

            // Réinitialiser le flag pour le prochain package
            OtherDirectoryAlreadyCopied = 0;
        });
    });
}

async function copyDirectoryAtSameLevel(sourceDirectory, destinationDirectory) {
    try {
        // Découper sourceDirectory après le répertoire 'ns'
        const trimmedSourcePath = sourceDirectory.replace(/\/ns\/.*/, '');
        // Découper destinationDirectory après le répertoire 'ns'
        const trimmedDestinationPath = destinationDirectory.replace(/\/ns\/.*/, '');

        // Récupérer tous les éléments au même niveau que trimmedSourcePath
        const sourceLevelElements = fs.readdirSync(trimmedSourcePath)
            .filter(item => fs.lstatSync(path.join(trimmedSourcePath, item)).isDirectory() || item !== 'ns');

        // Liste des promesses de copie
        const copyPromises = [];

        // Copier tous les éléments au même niveau que trimmedSourcePath vers trimmedDestinationPath
        for (let element of sourceLevelElements) {
            const sourceElementPath = path.join(trimmedSourcePath, element);
            const destinationElementPath = path.join(trimmedDestinationPath, element);

            // Vérifier si l'élément est le dossier 'ns', dans ce cas on ne copie pas
            if (element === 'ns') {
                continue;
            }

            // Vérifier si l'élément existe déjà à la destination
            if (fs.existsSync(destinationElementPath)) {
                // console.log(`L'élément existe déjà à la destination: ${destinationElementPath}`);
                continue;
            }

            const copyPromise = fs.copy(sourceElementPath, destinationElementPath, { overwrite: false })
                .then(() => {
                    // console.log(`Élément copié de ${sourceElementPath} vers ${destinationElementPath}`);
                })
                .catch(err => {
                    writeErrorLog(`Erreur lors de la copie du répertoire ${sourceElementPath} vers ${destinationElementPath}: ${err.message}`);
                });
            copyPromises.push(copyPromise);
        }

        // Attendre que toutes les copies soient terminées
        await Promise.all(copyPromises);

        console.log(`[valid] Répertoire copié de ${trimmedSourcePath} vers ${trimmedDestinationPath}`);
    } catch (err) {
        writeErrorLog(`Erreur lors de la copie du répertoire ${sourceDirectory} vers ${destinationDirectory}: ${err.message}`);
    }
}

function mapServicesToPackages(targetpkgValues, serviceNamePairs) {
    const packageServiceMap = {};

    targetpkgValues.forEach(aglPackageName => {
        packageServiceMap[aglPackageName] = [];
    });

    serviceNamePairs.forEach(pairs => {
        pairs.forEach(pair => {
            const newName = pair.newName;
            if (newName) {
                const targetPackage = newName.split('.')[0];
                if (packageServiceMap[targetPackage]) {
                    packageServiceMap[targetPackage].push(pair);
                } else {
                    console.error(`Package cible non trouvé pour le service: ${pair.newName}`);
                }
            } else {
                console.error(`newName n'est pas défini pour la paire: ${JSON.stringify(pair)}`);
            }
        });
    });

    return packageServiceMap;
}

function readXmlFile(xmlFilePath, callback) {
    fs.readFile(xmlFilePath, (err, data) => {
        if (err) {
            return callback(new Error(`Erreur lors de la lecture du fichier XML: ${err.message}`));
        }

        // Parser le fichier XML
        xml2js.parseString(data, (err, result) => {
            if (err) {
                return callback(new Error(`Erreur lors du parsing du fichier XML: ${err.message}`));
            }

            try {
                // Vérifier la présence de result.Values.array.record
                if (!result || !result.Values || !result.Values.array || !result.Values.array[0].record) {
                    throw new Error('Structure XML invalide ou absence des éléments nécessaires.');
                }

                const records = result.Values.array[0].record;
                const targetpkgValues = [];
                const serviceNamePairs = [];

                // Itérer à travers chaque enregistrement
                records.forEach(record => {
                    // Vérifier la présence de la balise 'value' avec name="targetpkg"
                    const targetpkgValue = record.value.find(item => item.$.name === 'targetpkg');
                    if (targetpkgValue && targetpkgValue._) {
                        targetpkgValues.push(targetpkgValue._);
                    }

                    // Vérifier la présence de la balise 'array' avec name="services"
                    const servicesArray = record.array.find(item => item.$.name === 'services');
                    if (servicesArray && servicesArray.record) {
                        // Itérer à travers chaque enregistrement 'record' dans 'services'
                        const pairs = [];
                        servicesArray.record.forEach(serviceRecord => {
                            // Vérifier la présence de 'value' avec name="oldName"
                            const oldNameValue = serviceRecord.value.find(item => item.$.name === 'oldName');
                            // Vérifier la présence de 'value' avec name="newName"
                            const newNameValue = serviceRecord.value.find(item => item.$.name === 'newName');
                            if (oldNameValue && oldNameValue._ && newNameValue && newNameValue._) {
                                pairs.push({
                                    oldName: oldNameValue._,
                                    newName: newNameValue._
                                });
                            }
                        });
                        serviceNamePairs.push(pairs);
                    }
                });

                callback(null, targetpkgValues, serviceNamePairs);
            } catch (error) {
                console.error('Erreur lors de l\'extraction des valeurs "targetpkg" et "serviceNamePairs":', error);
                callback(new Error('Erreur lors de l\'extraction des valeurs "targetpkg" et "serviceNamePairs" du fichier XML.'));
            }
        });
    });
}

async function copyDirectory(source, destination) {
    return fs.copy(source, destination, { overwrite: false });
}

function createDirectoryIfNotExists(directoryPath) {
    if (!fs.existsSync(directoryPath))
        fs.mkdirSync(directoryPath, { recursive: true });
}

function findSourceFilePath(oldName) {
    const packagesRefDirectory = '/home/NicKOOU/AGL_NODE/Run/ManagePackages/PackagesRef/';
    const oldNamePath = oldName.replace(/[.:]/g, '/');

    // Recherche dans les sous-dossiers de packagesRefDirectory
    const directoriesToCheck = fs.readdirSync(packagesRefDirectory);
    for (let directory of directoriesToCheck) {
        const packageFolderPath = path.join(packagesRefDirectory, directory, 'ns', oldNamePath);
        if (fs.existsSync(packageFolderPath)) {
            // console.log(`Dossier trouvé: ${packageFolderPath}`);
            return packageFolderPath; // Retourne dès qu'une occurrence est trouvée
        }
    }

    return null; // Retourne null si aucune occurrence trouvée
}

function writeErrorLog(errorMessage) {
    const errorLogFilePath = '/home/NicKOOU/AGL_NODE/Run/error.log';
    fs.appendFileSync(errorLogFilePath, `${errorMessage}\n`);
    // console.log(`Erreur enregistrée dans ${errorLogFilePath}: ${errorMessage}`);
}

module.exports = generatesPackagesFromDico;
