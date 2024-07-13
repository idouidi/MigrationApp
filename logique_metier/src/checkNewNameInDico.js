const fs = require('fs');
const xml2js = require('xml2js');

function checkAndAddInDicoNew(dictionnary, packagesList) {

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

                packages.forEach(package => {
                    let found = false;


                    mapping.forEach(record => {
                        const services = record.array[0].record;
                        try {
                            services.forEach(service => {
                                const oldName = service.value.find(item => item.$.name === 'newName')._;
                                if (package === oldName) {
                                    found = true;
                                    console.log("found : " + oldName)
                                }
                            });
                        }
                        catch (err) {
                        }
                    });

                    if (!found) {
                        fs.appendFileSync("./out/notFound.txt", package + "\n")
                    }
                });
            });
        });
    });
}

module.exports = checkAndAddInDicoNew;