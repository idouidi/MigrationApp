import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { CreateUploadDto } from './dto/create-upload.dto';
import * as xml2js from 'xml2js';
import * as archiver from 'archiver';

interface Service {
  oldName: string;
  newName: string;
}

interface ServicesRefactorDoc {
  targetpkg: string;
  services: Service[];
}

interface JarToCopy {
  oldPkg: string;
  newPkg: string;
  jarName: string;
}

interface Patterns {
  [key: string]: string;
}


@Injectable()
export class UploadService {
  
  private readonly entryDataDir = join(__dirname, '..', '..', 'uploads', 'ParseEntryData');
  private readonly entryFiledPath = join(this.entryDataDir, 'entry.txt');
  private readonly outputFilePath = join(this.entryDataDir, 'output.txt');
  
  private readonly dicoDir = join(__dirname, '..', '..', 'uploads', 'ManageDico');
  private readonly dicoFilePath = join(this.dicoDir, 'Dico.xml');
  private readonly newDicoFilePath = join(this.dicoDir, 'newDico.xml');

  private readonly newPackagesDir = join(__dirname, '..', '..', 'ManagePackages', 'new');
  private readonly refPackagesDir = join(__dirname, '..', '..', 'ManagePackages', 'ref');
  
  private readonly patternsDir = join(__dirname, '..', '..', 'settings');
  private readonly patternsFilePath = join(this.patternsDir, 'packagesPatterns.json');
  private readonly toCleanPatternsFilePath = join(this.patternsDir, 'toCleanPatterns.json');
  
  constructor() {
    this.ensureDirectoriesAndFiles();
  }

  private ensureDirectoriesAndFiles() {
    this.ensureDirectory(this.entryDataDir);
    this.ensureDirectory(this.dicoDir);
    this.ensureDirectory(this.patternsDir);

    this.ensureFile(this.entryFiledPath, '');
    this.ensureFile(this.dicoFilePath, '<root></root>');
    this.ensureFile(this.patternsFilePath, '{}');
  }

  private ensureDirectory(path: string) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  private ensureFile(path: string, defaultContent: string) {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, defaultContent);
    }
  }
  
  private cleanEntryData(filePath: string, outputFilePath: string): void {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Remplacer les tabulations par des retours à la ligne
    const newString = fileContent.replace(/\t/g, '\n');

    // Séparer les lignes
    const lines = newString.split('\n');

    // Enlever les doublons
    const uniqueLinesSet = new Set(lines);
    const uniqueLinesArray = Array.from(uniqueLinesSet);
    const uniqueString = uniqueLinesArray.join('\n');

    // Nettoyer les données
    const regex = /'([^']*)'\s+is using \d+ element(?:s)?/g;
    const regex3 = /^Agl.*\n?/gm;
    const regex4 = /^Wm.*\n?/gm;

    let cleanedData = uniqueString.replace(regex, '$1');
    cleanedData = cleanedData.replace(regex3, '');
    cleanedData = cleanedData.replace(regex4, '');
    cleanedData = cleanedData.split('\n').filter(line => line.trim() !== '').join('\n');

    // Écrire les données nettoyées dans le fichier de sortie
    fs.writeFileSync(outputFilePath, cleanedData);
  }

  private async  convertXmlToJson(filePath: string): Promise<any> {
    try {
      // Lire le fichier XML
      const xmlData = fs.readFileSync(filePath, 'utf-8');
  
      // Parser le XML en JSON
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
  
      // Vérifier la structure attendue dans le résultat JSON
      if (!result.Values || !result.Values.array) {
        throw new Error('Structure XML invalide : éléments manquants');
      }
  
      // Trouver la section servicesRefactorDocs
      const servicesRefactorArray = result.Values.array.find((item: any) => item.$.name === 'servicesRefactorDocs');
      if (!servicesRefactorArray || !servicesRefactorArray.record) {
        throw new Error('Structure XML invalide : servicesRefactorDocs manquant');
      }
  
      // Assurer que servicesRefactorDocs.records est un tableau
      const records = Array.isArray(servicesRefactorArray.record)
        ? servicesRefactorArray.record
        : [servicesRefactorArray.record];
  
      // Mapper chaque enregistrement du tableau vers le format JSON souhaité
      const servicesRefactorDocs: ServicesRefactorDoc[] = records.map((record: any) => ({
        targetpkg: record.value._, // Accès direct à la valeur du 'targetpkg'
        services: Array.isArray(record.array.record)
          ? record.array.record.map((service: any) => ({
              oldName: service.value.find((v: any) => v.$.name === 'oldName')._,
              newName: service.value.find((v: any) => v.$.name === 'newName')._
            }))
          : [] // Si pas de services, retourner un tableau vide
      }));
  
      // Trouver la section jarsToCopy
      const jarsToCopyArray = result.Values.array.find((item: any) => item.$.name === 'jarsToCopy');
      const jarsToCopy: JarToCopy[] = jarsToCopyArray
        ? (Array.isArray(jarsToCopyArray.record)
            ? jarsToCopyArray.record
            : [jarsToCopyArray.record]
          ).map((record: any) => ({
            oldPkg: record.value.find((v: any) => v.$.name === 'oldPkg')._,
            newPkg: record.value.find((v: any) => v.$.name === 'newPkg')._,
            jarName: record.value.find((v: any) => v.$.name === 'jarName')._
          }))
        : [];
  
      // Retourner le résultat final
      return { servicesRefactorDocs, jarsToCopy };
    } catch (error) {
      console.error('Erreur lors de la conversion XML vers JSON :', error.message);
  
      // Lever une exception HTTP avec message d'erreur personnalisé
      throw new HttpException('Échec de la conversion XML vers JSON : ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }














  private async loadPatterns(): Promise<any> {
    try {
      const patternsData = fs.readFileSync(this.patternsFilePath, 'utf-8');
      return JSON.parse(patternsData);
    } catch (error) {
      console.error('Erreur lors du chargement des motifs de packages :', error.message);
      throw new HttpException('Erreur lors du chargement des motifs de packages', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async loadToCleanPatterns(): Promise<any> {
    try {
      const toCleanPatternsData = fs.readFileSync(this.toCleanPatternsFilePath, 'utf-8');
      return JSON.parse(toCleanPatternsData);
    } catch (error) {
      console.error('Erreur lors du chargement des motifs de nettoyage :', error.message);
      throw new HttpException('Erreur lors du chargement des motifs de nettoyage', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private clean(toClean: string, patterns: Patterns): string {
    try {
      for (const [pattern, replacement] of Object.entries(patterns)) {
        const regex = new RegExp(pattern, 'g');
        toClean = toClean.replace(regex, replacement);
      }
      return toClean;
    } catch (error) {
      console.error('Erreur lors du nettoyage de la chaîne :', error.message);
      throw new HttpException('Erreur lors du nettoyage de la chaîne', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async generateNewNames(oldServicePath: string, patterns: any, newRootName: string) {
    let newServiceName = '';
    let found: string[] = [];
    let pkgfound: string[] = [];

    function findPattern(path: string, patterns: any) {
      for (const pattern of Object.keys(patterns)) {
        if (path.includes(pattern)) {
          if (typeof patterns[pattern] === 'object') {
            pkgfound.push(patterns[pattern]['default'] || '');
            findPattern(path, patterns[pattern]);
          } else {
            pkgfound.push(patterns[pattern]);
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

    let shortestPath = found.reduce((shortest, current) => current.length < shortest.length ? current : shortest, found[0] || '');
    let longestPath = pkgfound.reduce((longest, current) => current.length > longest.length ? current : longest, pkgfound[0] || '');

    if (!shortestPath) {
      longestPath = newRootName + "New";
      shortestPath = `${longestPath}.${oldServicePath.replace(':', '.')}`;
    }
    shortestPath = this.clean(shortestPath, await this.loadToCleanPatterns());
    longestPath = this.clean(longestPath, await this.loadToCleanPatterns());
    let pkgrootname = longestPath.replace(/\.(.*)/, "");
    shortestPath = shortestPath.replace(/[.:]/g, "/");

    return { packageName: newRootName + pkgrootname, newServiceName: newRootName + longestPath + "/" + newRootName + longestPath + shortestPath };
  }

  private async checkAndAddInDico(dictionnary: string, packagesList: string, newRootName: string, newDictionnary: string = dictionnary) {
    try {
      const data = await fs.promises.readFile(dictionnary, 'utf-8');
      const result = await xml2js.parseStringPromise(data);
      const mapping = result.Values?.array?.[0]?.record || [];

      const packagesData = await fs.promises.readFile(packagesList, 'utf-8');
      const packages = packagesData.trim().split('\n');

      const patterns = await this.loadPatterns();

      for (const pkg of packages) {
        let found = false;
        for (const record of mapping) {
          const services = record.array?.[0]?.record || [];
          for (const service of services) {
            const oldName = service.value.find(item => item.$.name === 'oldName')?._;
            if (pkg === oldName) {
              found = true;
              console.log("found : " + oldName);
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          console.log("added : " + pkg);
          let targetPkgExists = false;
          const modifiedPackage = pkg.replace(/[.:]/g, "/");
          for (const record of mapping) {
            const { packageName, newServiceName } = await this.generateNewNames(modifiedPackage, patterns, newRootName);
            const value = record.value?.[0]?._;
            if (value === packageName) {
              const newService = {
                '$': { javaclass: 'com.wm.util.Values' },
                value: [
                  { _: pkg, '$': { name: 'oldName' } },
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
            const { packageName, newServiceName } = await this.generateNewNames(modifiedPackage, patterns, newRootName);
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
                        { _: pkg, '$': { name: 'oldName' } },
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
      }

      const builder = new xml2js.Builder();
      const xml = builder.buildObject(result);
      await fs.promises.writeFile(newDictionnary, xml);
      console.log('Fichier de mapping mis à jour avec succès.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dictionnaire :', error.message);
      throw new HttpException('Failed to update dictionary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
















  
  































  async uploadEntryData(createUploadDto: CreateUploadDto, file: Express.Multer.File) { 
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    if (file.mimetype !== 'text/plain') {
      throw new HttpException('Only .txt files are allowed!', HttpStatus.BAD_REQUEST);
    }

    try {
      // Lire le fichier à partir du chemin temporaire
      const fileContent = fs.readFileSync(file.path, 'utf-8');

      // Écrire le contenu dans le fichier de destination
      fs.writeFileSync(this.entryFiledPath, fileContent);

      // Supprimer le fichier temporaire téléchargé par multer
      fs.unlinkSync(file.path);
      
      // Écrire les données nettoyées dans le fichier de sortie
      this.cleanEntryData(this.entryFiledPath, this.outputFilePath);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'File uploaded successfully!',
        description: createUploadDto.description,
      };
    } catch (error) {
      throw new HttpException('File upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async uploadPattern(patternData: any) {
    try {
      if (!patternData) {
        throw new HttpException('No JSON data provided', HttpStatus.BAD_REQUEST);
      }

      // Vérifiez si patternData est un objet JSON valide
      if (typeof patternData !== 'object' || Array.isArray(patternData)) {
        throw new HttpException('Invalid JSON data format', HttpStatus.BAD_REQUEST);
      }

      // Écrire le fichier pattern en remplaçant complètement son contenu
      fs.writeFileSync(this.patternsFilePath, JSON.stringify(patternData, null, 2));

      await this.checkAndAddInDico(this.dicoFilePath, this.outputFilePath, 'Agl', this.newDicoFilePath);
      const jsonResult = await this.convertXmlToJson(this.dicoFilePath);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Pattern JSON uploaded successfully!',
        jsonResult
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async validatePattern(): Promise<string> {
    try {
      // Créer un fichier ZIP contenant tous les répertoires de this.refPackagesDir
      const outputZipPath = join(__dirname, 'newPackages.zip');
      const output = fs.createWriteStream(outputZipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Niveau de compression maximum
      });

      // Gérer les événements de flux
      output.on('close', () => {
        console.log(`${archive.pointer()} total bytes`);
        console.log('archiver has been finalized and the output file descriptor has closed.');
      });

      archive.on('warning', (err) => {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      });

      archive.on('error', (err) => {
        throw err;
      });

      // Lancer l'archivage
      archive.pipe(output);

      // Ajouter les répertoires et fichiers de this.refPackagesDir
      archive.directory(this.refPackagesDir, false);

      await archive.finalize();

      // Retourner le chemin du fichier ZIP
      return outputZipPath;

    } catch (error) {
      console.error('Error during pattern validation:', error.message);
      throw new HttpException('Error during pattern validation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}