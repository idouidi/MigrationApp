const fs = require('fs');

fs.readFile('entry.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier :', err);
    return;
  }

  function replaceTabsWithNewline(inputString) {
    return inputString.replace(/\t/g, '\n');
  }

  const newString = replaceTabsWithNewline(data);

  const lines = newString.split('\n');

  const uniqueLinesSet = new Set(lines);

  const uniqueLinesArray = Array.from(uniqueLinesSet);

  const uniqueString = uniqueLinesArray.join('\n');

  const regex = /'([^']*)'\s+is using \d+ element(?:s)?/g;
  //const regex2= /^(?!Wm|Agl).*\//gm;
  const regex3= /^Agl.*\n?/gm;
  const regex4= /^Wm.*\n?/gm;


  let cleanedData = uniqueString.replace(regex, '$1');
  //cleanedData = cleanedData.replace(regex2, '');
  cleanedData = cleanedData.replace(regex3, '');
  cleanedData = cleanedData.replace(regex4, '');
  cleanedData = cleanedData.split('\n')
  .filter(line => line.trim() !== '')  
  .join('\n');

  console.log(
    'Contenu du fichier avec tabulations remplacées par des retours à la ligne et sans doublons :'
  );

  fs.writeFile('output.txt', cleanedData, (err) => {
    if (err) {
      console.error(
        "Erreur lors de l'écriture dans le fichier output.txt :",
        err
      );
      return;
    }
    console.log('Le résultat a été enregistré dans output.txt avec succès !');
  });
});