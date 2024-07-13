const fs = require('fs');
const xml2js = require('xml2js');

function compareAllWithAllDico(dictionnary, packagesList) {
    fs.readFile(dictionnary, 'utf-8', (err, data) => {
        if (err) {
            console.error('Erreur de lecture du fichier de mapping :', err);
            return;
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error('Erreur de parsing XML :', err);
                return;
            }

            const mapping = result.Values.array[0].record;

            fs.readFile(packagesList, 'utf-8', (err, data) => {
                if (err) {
                    console.error('Erreur de lecture du fichier de packages :', err);
                    return;
                }

                const packages = data.trim().split('\n');

                const notFoundInMapping = [];

                mapping.forEach(record => {
                    const services = record.array[0].record;
                    try {
                        services.forEach(service => {
                            const oldName = service.value.find(item => item.$.name === 'newName')._;
                            if (!packages.includes(oldName)) {
                                notFoundInMapping.push(oldName);
                            }
                        });
                    } catch (err) {
                        console.error('Erreur lors de la recherche de services :', err);
                    }
                });

                // Écriture des éléments non trouvés dans le mapping dans un fichier
                fs.writeFile("./out/notFoundInMapping.txt", notFoundInMapping.join('\n'), (err) => {
                    if (err) {
                        console.error('Erreur lors de l\'écriture du fichier notFoundInMapping.txt :', err);
                        return;
                    }
                    console.log('Fichier notFoundInMapping.txt créé avec succès.');
                });
            });
        });
    });
}

module.exports = compareAllWithAllDico;
