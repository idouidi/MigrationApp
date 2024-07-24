import { Injectable, HttpException, HttpStatus, Res } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { CreateUploadDto } from './dto/create-upload.dto';
import * as xml2js from 'xml2js';
import * as archiver from 'archiver';
import { Response } from 'express';

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

@Injectable()
export class UploadService {
  
  private readonly uploadDir = join(__dirname, '..', '..', 'uploads', 'ParseEntryData');
  private readonly uploadPath = join(this.uploadDir, 'entry.txt');
  
  private readonly xmlDicoDir = join(__dirname, '..', '..', 'uploads', 'ManageDico');
  private readonly xmlDicoFilePath = join(this.xmlDicoDir, 'Dico.xml');

  private readonly newPackagesDir = join(__dirname, '..', '..', 'ManagePackages', 'new');
  private readonly refPackagesDir = join(__dirname, '..', '..', 'ManagePackages', 'ref');

  
  private readonly patternsDir = join(__dirname, '..', '..', 'settings');
  private readonly patternsFilePath = join(this.patternsDir, 'packagesPatterns.json');
  
  constructor() {
    // Créer les répertoires s'ils n'existent pas
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    if (!fs.existsSync(this.xmlDicoDir)) {
      fs.mkdirSync(this.xmlDicoDir, { recursive: true });
    }

    if (!fs.existsSync(this.patternsDir)) {
      fs.mkdirSync(this.patternsDir, { recursive: true });
    }

    // Créer les fichiers s'ils n'existent pas
    if (!fs.existsSync(this.uploadPath)) {
      fs.writeFileSync(this.uploadPath, '');
    }

    if (!fs.existsSync(this.xmlDicoFilePath)) {
      fs.writeFileSync(this.xmlDicoFilePath, '<root></root>');
    }

    if (!fs.existsSync(this.patternsFilePath)) {
      fs.writeFileSync(this.patternsFilePath, '{}');
    }
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

      const jsonResult = await this.convertXmlToJson(this.xmlDicoFilePath);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Pattern JSON uploaded successfully!',
        jsonResult
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
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
      fs.writeFileSync(this.uploadPath, fileContent);

      // Supprimer le fichier temporaire téléchargé par multer
      fs.unlinkSync(file.path);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'File uploaded successfully!',
        description: createUploadDto.description,
      };
    } catch (error) {
      throw new HttpException('File upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
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
