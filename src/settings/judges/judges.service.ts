import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJudgeDto } from './dto/create-judge.dto';
import { UpdateJudgeDto } from './dto/update-judge.dto';
import { Judge } from './entities/judge.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JudgesService {
  constructor(
    @InjectRepository(Judge)
    private readonly judgeRepository: Repository<Judge>,
  ) {}

  async findAll(): Promise<Judge[]> {
    return await this.judgeRepository.find();
  }

  async findOne(id: number): Promise<Judge> {
    const judge = await this.judgeRepository.findOneBy({ id });
    if (!judge) throw new NotFoundException(`Judge with ID ${id} not found`);
    return judge;
  }

  async create(createJudgeDto: CreateJudgeDto): Promise<Judge> {
    const judge = this.judgeRepository.create(createJudgeDto);
    return await this.judgeRepository.save(judge);
  }

  async update(id: number, updateJudgeDto: UpdateJudgeDto): Promise<Judge> {
    const judge = await this.findOne(id);
    Object.assign(judge, updateJudgeDto);
    return await this.judgeRepository.save(judge);
  }

  async remove(id: number): Promise<void> {
    const judge = await this.findOne(id);
    await this.judgeRepository.remove(judge);
  }
}
