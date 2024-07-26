// const { extractFromExcelToXml,
//     generateExcelFromXml } = require('./excelService');
// const checkAndAddInDico = require('./checkAndAddInDico');
// const replaceElementsInFolderFromDicoService = require('./replaceElementsInFolderFromDicoService');
const generatesPackagesFromDico = require('./generatePackagesFromDico');


generatesPackagesFromDico('../Run/ManageDico/OutboundDico.xml', '/home/NicKOOU/AGL_NODE/Run/ManagePackages/PackagesOutput/');

//extractFromExcelToXml("./in/AGL_WM-Inventaire migration BTL vers AGL-v1.xlsx", "./out/old.xml", "Actif BTL", "Actif AGL");

//generateExcelFromXml("./in/dico_simon.xml", "./out/dico_simon.xlsx");

checkAndAddInDico("../Run/ManageDico/InboundDico.xml", "../Run/ParseInput/output.txt", "Agl", "../Run/ManageDico/OutboundDico.xml");


//replaceElementsInFolderFromDicoService("./out/Resultdico.xml", './settings/regexToReplaceInFile.txt', "./toReplace", "blx")