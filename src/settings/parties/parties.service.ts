import { Injectable, NotFoundException } from '@nestjs/common';
import { Party } from './entities/party.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePartyDto } from './dto/create-party.dto';
import { CommonSetup } from '../common-setup/entities/common-setup.entity';

@Injectable()
export class PartiesService {
  constructor(
    @InjectRepository(Party)
    private readonly businessRepository: Repository<Party>,
    @InjectRepository(CommonSetup)
    private readonly commonSetupRepository: Repository<CommonSetup>
  ) {}

  async create(createBusinessDto: CreatePartyDto): Promise<Party> {
    const business = this.businessRepository.create(createBusinessDto);
    return this.businessRepository.save(business);
  }

  async findAll(): Promise<Party[]> {
    return this.businessRepository.find(
      {relations: ['type']}
    );
  }

  async findOne(id: number): Promise<Party> {
    const business = await this.businessRepository.findOne({ where: { id } });
    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found.`);
    }
    return business;
  }

  async update(id: number, updateBusinessDto: CreatePartyDto): Promise<Party> {
    const business = await this.findOne(id);
    Object.assign(business, updateBusinessDto);
    return this.businessRepository.save(business);
  }

  async remove(id: number): Promise<void> {
    const result = await this.businessRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Business with ID ${id} not found.`);
    }
  }

  async getBusinessByType(type: string): Promise<Party[]> {
    const businessType = await this.commonSetupRepository.findOne({
      where: { name: type },
    });

    return this.businessRepository.find({
      where: { type: businessType },
    });
  }

}
