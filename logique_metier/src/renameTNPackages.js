const fs = require('fs');
const path = require('path');

const inputFilePath = './settings/patternToReplaceTN.txt';

function readReplacements(inputFilePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(inputFilePath, 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const replacements = data
          .trim()
          .split('\n')
          .map((line) => line.split(','));
        resolve(replacements);
      }
    });
  });
}

function copyAndReplaceOccurrencesInXMLFiles(folderPath, replacements) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Erreur de lecture du dossier', err);
      return;
    }

    const renamedFolderPath = path.join('./', 'TNRenamed');
    if (!fs.existsSync(renamedFolderPath)) {
      fs.mkdirSync(renamedFolderPath);
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (path.extname(filePath).toLowerCase() === '.xml') {
        fs.readFile(filePath, 'utf-8', (err, data) => {
          if (err) {
            console.error('Erreur de lecture du fichier', err);
            return;
          }

          let newData = data;
          replacements.forEach(([from, to]) => {
            newData = newData.replace(new RegExp(from, 'g'), to.trim());
          });

          const newFilePath = path.join(renamedFolderPath, `TNRenamed_${file}`);
          fs.writeFile(newFilePath, newData, 'utf-8', (err) => {
            if (err) {
              console.error("Erreur lors de l'écriture du fichier", err);
              return;
            }
            console.log(`Le fichier ${newFilePath} a été modifié avec succès.`);
          });
        });
      }
    });
  });
}

async function main() {
  try {
    const replacements = await readReplacements(inputFilePath);
    replacements.forEach((replacement) => {
      replacement[0] = replacement[0].replace(/([()])/g, '\\$1');
    });
    console.log(replacements);
    copyAndReplaceOccurrencesInXMLFiles('./TNPackages', replacements);
  } catch (error) {
    console.error('Une erreur est survenue :', error);
  }
}

main();