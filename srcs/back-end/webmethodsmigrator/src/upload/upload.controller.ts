import { Controller, Post, UploadedFile, UseInterceptors, Body, HttpException} from '@nestjs/common';
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
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (_req, _file, cb) => {
        cb(null, 'entry.txt');
      }
    }),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== 'text/plain') {
        return cb(new Error('Only .txt files are allowed!'), false);
      }
      cb(null, true);
    }
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
  async validatePattern(){
    try {
      const result = await this.uploadsService.validatePattern();
      return result;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}