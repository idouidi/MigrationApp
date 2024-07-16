import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import { CreateUploadDto } from './dto/create-upload.dto';

@Injectable()
export class UploadService {
  private readonly uploadPath = join(__dirname, '..', '..', 'uploads', 'ParseEntryData');
  private readonly patternsFilePath = join(__dirname, '..', '..', 'settings', 'packagesPatterns.json');
  
  constructor() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
    if (!fs.existsSync(this.patternsFilePath)) {
      fs.writeFileSync(this.patternsFilePath, '{}');
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

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Pattern JSON uploaded successfully!',
        pattern: patternData,
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

    const filePath = join(this.uploadPath, 'entry.txt');

    try {
      // Lire le fichier à partir du chemin temporaire
      const fileContent = fs.readFileSync(file.path, 'utf-8');

      // Écrire le contenu dans le fichier de destination
      fs.writeFileSync(filePath, fileContent);

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
}
