import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PartiesService } from './parties.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { Party } from './entities/party.entity';
import { CommonSetupService } from '../common-setup/common-setup.service';
import { NoticeService } from '../../appeal/notice/notice.service';

@Controller('parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService,
              private readonly  commonSetupService: CommonSetupService,
              private readonly noticeService: NoticeService) {}

  @Post()
  create(@Body() createPartyDto: CreatePartyDto) {
    return this.partiesService.create(createPartyDto);
  }

  @Get()
  findAll() {
    return this.partiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartyDto: CreatePartyDto) {
    return this.partiesService.update(+id, updatePartyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partiesService.remove(+id);
  }

  @Get('type/:type')
  getBusinessByType(@Param('type') type: string) {
    return this.partiesService.getBusinessByType(type);
  }


  @Post("/import")
  async importParties() {
    const csv = require('csv-parser');
    const fs = require('fs');
    const rows = [];
    const uniqueNames = []; // Initialize an array to store unique names

    // Step 1: Read all rows into memory and collect unique names directly into the array
    fs.createReadStream('/Users/amtz/gepg/new_gepg/nest/appeals_with_headers.csv')
      .pipe(csv())
      .on('data', async (row) => {
        const partyName = row.appellant_name.trim().toUpperCase();  // Normalize the name
        if (partyName !== "COMMISSIONER GENERAL" && !uniqueNames.includes(partyName)) {
          uniqueNames.push(partyName);  // Add only unique names to the array
        }

        try {
          if (partyName === 'NONOTICE') {
            if (row.notice_number) {
              console.log("Notice number found" + row.notice_number);
              const notice = await this.noticeService.findByNoticeNo(row.notice_number);
              if (!uniqueNames.includes(notice.appellantFullName)) {
                uniqueNames.push(notice.appellantFullName);
              }
            }
          }
        }catch (error) {
          console.error("Error processing name:", error);
        }
      })
      .on('end', async () => {
        console.log("CSV Read completed. Now processing unique rows...");

        // Step 2: Process the unique names sequentially
        await this.processNamesSequentially(uniqueNames);
        console.log("CSV Import completed.");
      })
      .on('error', (err) => {
        console.error("Error reading the CSV file:", err);
      });
  }

  // Step 3: Process the unique names sequentially
  async processNamesSequentially(names: string[]) {
    // Iterate over each unique name and process it sequentially
    for (const name of names) {
      await this.processName(name);  // Wait for each name to be processed before moving to the next
    }
  }

  // Step 4: Process individual name
  async processName(name: string) {
    try {
      console.log(`Checking if ${name} exists:`);

      // Check if the party already exists in the database using the party name
      const existingParty = await this.partiesService.getBusinessByName(name);
      console.log(existingParty);  // Log the result of the existence check

      // If no existing party is found (i.e., the value is null or undefined), we proceed to save it
      if (!existingParty) {
        const party = new Party();
        console.log("Party does not exist, saving: " + name);

        // Fill in the party object with relevant data
        party.type = await this.commonSetupService.findOne(16);  // Retrieve business type
        party.phone_number = "No Phone";
        party.email_address = "No email";
        party.nature_of_business = "NOT MENTION";
        party.income_tax_file_number = "No income tax file number";
        party.vat_number = "No VAT number";
        party.name = name;  // Use the normalized name
        party.createdAt = new Date();
        party.updatedAt = new Date();

        // Save the new party to the database
        await this.partiesService.save(party);
        console.log("Party saved: " + party.name);
      } else {
        // If the party exists, log that it's already saved
        console.log("Party already exists: " + name);
      }
    } catch (error) {
      console.error("Error processing name:", error);
    }
  }
}

