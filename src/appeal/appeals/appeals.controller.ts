import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppealsService } from './appeals.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { AppealFilterDto } from './dto/appeal.filter.dto';
import { NoticeService } from '../notice/notice.service';
import { PartiesService } from '../../settings/parties/parties.service';
import { AuthGuard } from '../../auth/auth.guard';
import { BillService } from '../../payment/bill/bill.service';
import { CommonSetupService } from '../../settings/common-setup/common-setup.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProgressStatus } from './dto/appeal.status.enum';

@Controller('appeals')
export class AppealsController {
  private readonly logger = new Logger(AppealsService.name);
  constructor(
    private readonly appealsService: AppealsService,
    private readonly noticeService: NoticeService,
    private readonly partyService: PartiesService,
    private readonly billService: BillService,
    private readonly commonSetupService: CommonSetupService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createAppealDto: CreateAppealDto) {
    return this.appealsService.create(createAppealDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.appealsService.findAll();
  }

  @Get('/appeal/:id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.appealsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppealDto: CreateAppealDto) {
    return this.appealsService.update(+id, updateAppealDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.appealsService.remove(+id);
  }

  @Get('/top-appellant')
  @UseGuards(AuthGuard)
  getTopAppellant() {
    return this.appealsService.getTopAppellants();
  }

  @Get('/card-details')
  @UseGuards(AuthGuard)
  getCardDetails() {
    return this.appealsService.getCardsStatistics();
  }

  @Get('/yearly-cases')
  @UseGuards(AuthGuard)
  getYearlyCases() {
    return this.appealsService.getCaseSummary();
  }

  @Get('/filter')
  @UseGuards(AuthGuard)
  async filterAppeals(@Query() filters: AppealFilterDto) {
    return this.appealsService.filterAppeals(filters);
  }

  @Post('/update')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
      fileFilter: (req, file, callback) => {
        // Allow specific file types
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg',
          'image/png',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.',
            ),
            false,
          );
        }
      },
    }),
  )
  async updateDecision(
    @Body() updateDecisionDto: any,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<void> {
    try {
      this.logger.log(
        `Received update request for appeal: ${updateDecisionDto.appealNo}`,
      );
      this.logger.log(`Files received: ${files?.length || 0}`);

      if (!updateDecisionDto.appealNo) {
        throw new BadRequestException('Appeal number is required');
      }

      return await this.appealsService.updateDecision(updateDecisionDto, files);
    } catch (error) {
      this.logger.error('Error updating decision:', error);
      throw new BadRequestException('Failed to update decision');
    }
  }

  @Post('/import-dsm')
  //@UseGuards(AuthGuard)
  async importDsmAppeals() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const csv = require('csv-parser');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    let i = 0;

    await fs
      .createReadStream('/Users/mwendavano/trat/new_cas.csv')
      .pipe(csv())
      .on('data', async (row) => {
        i++;

        try {
          console.log('Appeal No' + row.appeal_no);
          console.log('Status Trend: ' + row.status_trend);
          console.log('Decision Date: ' + row.decision_date);

          const existingAppeal = await this.appealsService.findByAppealNo(
            row.appeal_no.trim(),
          );

          if (
            existingAppeal &&
            row.status_trend != '20' &&
            row.status_trend != '0'
          ) {
            const decisionDate = this.parseDate(row.decision_date);
            if (decisionDate) {
              existingAppeal.dateOfDecision = decisionDate;
            }

            const statusTrendId = parseInt(row.status_trend);
            if (!isNaN(statusTrendId)) {
              const statusTrend =
                await this.commonSetupService.findOne(statusTrendId);
              if (statusTrend) {
                existingAppeal.statusTrend = statusTrend;
              }
            }

            existingAppeal.progressStatus = ProgressStatus.DECIDED;
            await this.appealsService.save(existingAppeal);
            console.log(`Updated appeal: ${existingAppeal.appealNo}`);
          }
        } catch (error) {
          console.error(`Error processing row ${i}:`, error);
        }
      });

    console.log(`Total rows processed: ${i}`);
    return { message: `Processed ${i} rows successfully` };
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString || dateString === 'null') return null;

    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return null;
  }
}
