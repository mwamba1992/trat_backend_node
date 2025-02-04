// summons.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Summons, SummonsStatus } from './entities/summons.entity';
import { CreateSummonsDto } from './dto/summons.dto';
import { Judge } from '../../settings/judges/entities/judge.entity';
import { Appeal } from './entities/appeal.entity';
import { ProgressStatus } from './dto/appeal.status.enum';

@Injectable()
export class SummonsService {
  constructor(
    @InjectRepository(Summons)
    private readonly summonsRepository: Repository<Summons>,
    @InjectRepository(Judge)
    private readonly judgeRepository: Repository<Judge>,
    @InjectRepository(Appeal)
    private readonly appealRepository: Repository<Appeal>,
  ) {}

  // Get all summons
  async findAll(): Promise<Summons[]> {
    return await this.summonsRepository.find({
      relations: ['judge', 'appealList', 'applicationList'],
    });
  }

  // Get a single summons by id
  async findOne(id: number): Promise<Summons> {
    return await this.summonsRepository.findOne({
      where: { id: id },
      relations: ['judge', 'appealList', 'applicationList'],
    });
  }

  // Create a new summons
  // Private method to set common properties for Summons entity
  private async setSummonsProperties(
    summons: Summons,
    createSummonsDto: CreateSummonsDto,
  ): Promise<Summons> {
    summons.startDate = createSummonsDto.startDate;
    summons.endDate = createSummonsDto.endDate;
    summons.status = createSummonsDto.status;
    summons.remarks = createSummonsDto.remarks;
    summons.venue = createSummonsDto.venue;
    summons.time = createSummonsDto.time;
    summons.judge = await this.judgeRepository.findOne({
      where: { id: createSummonsDto.judge },
    });

    summons.member1 = await this.judgeRepository.findOne({
      where: { id: createSummonsDto.member1 },
    });

    summons.member2 = await this.judgeRepository.findOne({
      where: { id: createSummonsDto.member2 },
    });

    summons.appealList = createSummonsDto.appeals;
    summons.applicationList = createSummonsDto.applications;
    return summons;
  }

  // Create a new summons
  async create(createSummonsDto: CreateSummonsDto): Promise<Summons> {
    console.log(createSummonsDto);

    const summons = new Summons();

    // Use the helper method to set properties
    await this.setSummonsProperties(summons, createSummonsDto);

    const saveDSummon = this.summonsRepository.create(summons);
    return await this.summonsRepository.save(summons);
  }

  // Update an existing summons
  async update(
    id: number,
    createSummonsDto: CreateSummonsDto,
  ): Promise<Summons> {
    const summons = await this.summonsRepository.findOne({
      where: { id: id },
    });

    // Use the helper method to set properties
    await this.setSummonsProperties(summons, createSummonsDto);
    this.summonsRepository.create(summons);
    await this.summonsRepository.save(summons);

    return this.findOne(id); // Return updated summons
  }

  // Delete a summons
  async remove(id: number): Promise<void> {
    await this.summonsRepository.delete(id);
  }

  async concludeSummons(id: number, data: any) {
    const summons = await this.summonsRepository.findOne({
      where: { id: id },
      relations: ['appealList', 'applicationList'],
    });
    summons.status = SummonsStatus.CONCLUDED;
    await this.summonsRepository.save(summons);

    summons.appealList.forEach((appeal) => {
      appeal.concludingDate = data.concludeDate;
      appeal.progressStatus = ProgressStatus.CONCLUDED;
      this.appealRepository.save(appeal);
    });
  }
}
