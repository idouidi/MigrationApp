import { Controller, Post, UploadedFile, UseInterceptors, Body, HttpException, Res} from '@nestjs/common';
import { Response } from 'express'; 
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UploadService } from './upload.service';
import { join } from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';



@Controller('uploads')
export class UploadController {

  constructor(private readonly uploadsService: UploadService) {}

  @Post('entryData')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const uploadPath = join(__dirname, '..', '..', 'uploads', 'ParseEntryData');
        cb(null, uploadPath);
      },
      filename: (_req, _file, cb) => {
        cb(null, 'RequestEntryData.txt');
      }
    }),
  }))
  async uploadEntryData(@Body() createUploadDto: CreateUploadDto, @UploadedFile() file: any) {
    try {
      const result = await this.uploadsService.uploadEntryData(createUploadDto, file);
      return result;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Post('pattern')
  async uploadPattern(@Body() patternData: any) {
    try {
      const result = await this.uploadsService.uploadPattern(patternData);
      return result;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
  
  
  @Post('pattern/validate')
  async validatePattern(@Res() res: Response) {
    try {
      const zipPath = await this.uploadsService.validatePattern();

      // Envoyer le fichier ZIP en réponse
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=newPackages.zip');
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);

      // // Nettoyer le fichier temporaire après l'envoi
      // fileStream.on('end', () => {
      //   fs.unlink(zipPath, (err) => {
      //     if (err) {
      //       console.error('Error removing file:', err.message);
      //     }
      //   });
      // });

    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}