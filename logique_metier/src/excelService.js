const fs = require('fs');
const parser = require('xml2js').parseString;
const xlsx = require('xlsx');


function extractFromExcelToXml(filePath, outPath, oldRowName, newRowName) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const excelData = xlsx.utils.sheet_to_json(worksheet);

    let xmlString = `<?xml version="1.0" encoding="UTF-8"?>
        <Values version="2.0">
        <array name="servicesRefactorDocs" type="record" depth="1">
        `;

    const packages = {};
    const adapterServices = [];
    const adapterConnections = {};

    excelData.forEach((row) => {
        const packageName = row['Package Name'];
        const packageRegex = /([^\/]+)\//;
        console.log(row)
        const oldName = row[oldRowName].replace(packageRegex, '');
        const newName = row[newRowName].replace(packageRegex, '');

        if (!packages[packageName]) {
            packages[packageName] = [];
        }

        if (row[oldRowName].includes('.adapters')) {
            console.log(oldName.trim())
            adapterServices.push({
                oldName: oldName.trim(),
                newName: newName.trim(),
            });
        }
        if (row[oldRowName].includes('.connections')) {
            adapterConnections[oldName.trim()] = newName.trim();
        }
        packages[packageName].push({
            oldName: oldName.trim(),
            newName: newName.trim(),
        });
    });

    for (const packageName in packages) {
        xmlString += `   
  <record javaclass="com.wm.util.Values">
      <value name="targetpkg">${packageName}</value>
      <array name="services" type="record" depth="1">
`;

        packages[packageName].forEach((service) => {
            xmlString += `
        <record javaclass="com.wm.util.Values">
          <value name="oldName">${service.oldName}</value>
          <value name="newName">${service.newName}</value> 
        </record>`;
        });

        xmlString += `
        </array>
    </record>`;
    }

    xmlString += `
  <array name="adapterServices" type="record" depth="1">
`;

    for (const connectionAlias in adapterConnections) {
        xmlString += `
    <record javaclass="com.wm.util.Values">
      <value name="connectionAlias">${adapterConnections[connectionAlias]}</value>
      <array name="services" type="record" depth="1">
  `;

        let copy = connectionAlias;
        console.log(copy.replace(/\.connections.*/, ''));

        adapterServices.forEach((service) => {
            if (service.oldName.includes(copy.replace(/\.connections.*/, ''))) {
                xmlString += `
        <record javaclass="com.wm.util.Values">
          <value>${service.newName}</value> 
        </record>`;
            }
        });

        xmlString += `
      </array>
    </record>`;
    }

    xmlString += `
  <array name="adapterConnections" type="record" depth="1">
`;

    for (const oldConnectionAlias in adapterConnections) {
        xmlString += `
    <record javaclass="com.wm.data.ISMemDataImpl">
      <value name="oldConnectionAlias">${oldConnectionAlias}</value>
      <value name="newConnectionAlias">${adapterConnections[oldConnectionAlias]}</value>
    </record>`;
    }

    xmlString += `
  </array>`;

    xmlString += `
</array>
</array>
</Values>`;

    fs.writeFile(outPath, xmlString, (err) => {
        if (err) {
            console.error("Erreur lors de l'écriture du fichier XML : ", err);
        } else {
            console.log('Le fichier XML a été créé avec succès.');
        }
    });
}


function generateExcelFromXml(xmlFilePath, outExcelPath) {
    fs.readFile(xmlFilePath, 'utf8', (err, xmlData) => {
        if (err) {
            console.error('Error reading XML file:', err);
            return;
        }

        parser(xmlData, (err, parsedXml) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return;
            }

            const servicesRefactorDocs = parsedXml['Values']['array'][0];
            const packages = {};

            // Extract data from XML structure
            servicesRefactorDocs['record'].forEach((record) => {
                const packageName = record['value'].find(value => value['$']['name'] === 'targetpkg')['_'];
                const services = record['array'].find(array => array['$']['name'] === 'services').record;
                services.forEach((service) => {
                    const oldName = service['value'].find(value => value['$']['name'] === 'oldName')['_'];
                    const newName = service['value'].find(value => value['$']['name'] === 'newName')['_'];

                    if (!packages[packageName]) {
                        packages[packageName] = [];
                    }
                    packages[packageName].push({ oldName, newName });
                });
            });

            // Create Excel workbook and worksheet
            const workbook = xlsx.utils.book_new();
            const worksheet = xlsx.utils.aoa_to_sheet([
                ['Package Name', 'Actif BTL', 'Actif AGL'], // Headers
                ...Object.entries(packages).flatMap(([packageName, services]) =>
                    services.map(service => [packageName, service.oldName, service.newName])
                )
            ]);

            // Add worksheet to workbook
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Refactor Documentation');

            // Save workbook to file
            try {
                xlsx.writeFile(workbook, outExcelPath);
                console.log('Excel file generated successfully.');
            } catch (err) {
                console.error('Error saving Excel file:', err);
            }

        });
    });
}



module.exports = {
    extractFromExcelToXml,
    generateExcelFromXml
};