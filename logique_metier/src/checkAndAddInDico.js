const fs = require('fs');
const xml2js = require('xml2js');
const patterns = require('./settings/packagesPatterns');
const toClean = require('./settings/toCleanPatterns');

function checkAndAddInDico(dictionnary, packagesList, newRootName, newDictionnary = dictionnary) {

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
                                const oldName = service.value.find(item => item.$.name === 'oldName')._;
                                if (package === oldName) {
                                    found = true;
                                    console.log("found : " + oldName)
                                }
                            });
                        } catch (err) {
                        }
                    });

                    if (!found) {
                        console.log("added : " + package)
                        let targetPkgExists = false;
                        package = package.replace(/[.:]/g, "/");
                        for (const record of mapping) {
                            const { packageName, newServiceName } = generateNewNames(package, patterns);
                            const value = record.value[0]._;
                            if (value === packageName) {
                                const newService = {
                                    '$': { javaclass: 'com.wm.util.Values' },
                                    value: [
                                        { _: package, '$': { name: 'oldName' } },
                                        { _: newServiceName, '$': { name: 'newName' } }
                                    ]
                                };
                                if (!record.array) {
                                    record.array = [{ '$': { name: 'services', type: 'record', depth: '1' }, record: [] }];
                                }
                                record.array[0].record.push(newService);
                                targetPkgExists = true;
                                found = true;
                                break;
                            }
                        }


                        if (!targetPkgExists) {
                            const { packageName, newServiceName } = generateNewNames(package, patterns)
                            const newRecord = {
                                '$': { javaclass: 'com.wm.util.Values' },
                                value: [
                                    { _: packageName, '$': { name: 'targetpkg' } }
                                ],
                                array: [
                                    {
                                        '$': { name: 'services', type: 'record', depth: '1' },
                                        record: [
                                            {
                                                '$': { javaclass: 'com.wm.util.Values' },
                                                value: [
                                                    { _: package, '$': { name: 'oldName' } },
                                                    { _: newServiceName, '$': { name: 'newName' } }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            };

                            mapping.push(newRecord);
                        }
                    }
                });

                function clean(cleanPatterns, toclean) {
                    for (const cleanPattern of Object.keys(cleanPatterns)) {
                        toclean = toclean.replace(cleanPattern, cleanPatterns[cleanPattern]);
                    }
                    return toclean;
                }

                function generateNewNames(oldServicePath, patterns) {
                    let newServiceName = '';
                    let found = [];
                    let pkgfound = [];

                    function findPattern(path, patterns) {
                        for (const pattern of Object.keys(patterns)) {

                            if (path.includes(pattern)) {
                                if (typeof patterns[pattern] === 'object') {
                                    if (path == "blx.colgate.speed.out._inbound.services.pub:processSpeedEdi")
                                    {
                                        console.log(pattern);
                                    }
                                    pkgfound.push(patterns[pattern]['default'] || '');
                                    findPattern(path, patterns[pattern]);
                                } else {
                                    pkgfound.push(patterns[pattern])
                                    if (path == "blx.colgate.speed.out._inbound.services.pub:processSpeedEdi")
                                    {
                                        console.log(patterns[pattern]);
                                    }
                                }
                                const patternIndex = path.indexOf(pattern);
                                const serviceNameSuffix = path.substring(patternIndex + pattern.length);
                                newServiceName = `${serviceNameSuffix}`;
                                found.push(newServiceName);
                                return { newRootName, newServiceName };
                            }
                        }
                    }

                    findPattern(oldServicePath, patterns);

                    let shortestPath = found.reduce((shortest, current) => {
                        return current.length < shortest.length ? current : shortest;
                    }, found[0] || '');

                    let longestPath = pkgfound.reduce((longest, current) => {
                        return current.length > longest.length ? current : longest;
                    }, pkgfound[0] || '');

                    if (shortestPath === '') {
                        longestPath = newRootName + "New";
                        shortestPath = `${longestPath}.${oldServicePath.replace(':', '.')}`;
                    }
                    shortestPath = clean(toClean, shortestPath)
                    longestPath = clean(toClean, longestPath)
                    let pkgrootname = longestPath.replace(/\.(.*)/, "")
                    shortestPath = shortestPath.replace(/[.:]/g, "/");

                    return { packageName: newRootName + pkgrootname, newServiceName: newRootName + longestPath + "/" + newRootName + longestPath + shortestPath };
                }

                const builder = new xml2js.Builder();
                const xml = builder.buildObject(result);

                fs.writeFile(newDictionnary, xml, (err) => {
                    if (err) {
                        console.error('Erreur d\'écriture du fichier de mapping mis à jour :', err);
                        return;
                    }
                    console.log('Fichier de mapping mis à jour avec succès.');
                });
            });
        });
    });
}

module.exports = checkAndAddInDico;