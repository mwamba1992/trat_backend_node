import * as bcrypt from 'bcryptjs';
import { Party } from '../settings/parties/entities/party.entity';
import { Repository } from 'typeorm';

// The encodePassword function that hashes a plain password with bcrypt
export async function encodePassword(plainPassword: string): Promise<string> {
  const saltRounds = 4; // You can adjust the salt rounds as per your requirement
  return await bcrypt.hash(plainPassword, saltRounds);
}

// The decodePassword function that compares a plain password with a hashed password
export async function decodePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}


const axios = require('axios');

export async function postData(url: string, data: string): Promise<string> {
  const response = await axios.post(url, data, {
    headers: {
      'Content-Type': 'application/xml',
      'Gepg-Com': 'default.sp.in',
      'Gepg-Code': 'SP535',
    },
  });

  return response.data;
}

// Generalized processParties function
export async function processParties(
  partyList: { appellantList: any[]; respondentList: any[] }, // Accepts both appellantList and respondentList
  partyRepository: Repository<Party>, // Repository for Party entity
): Promise<{ applicants: Party[]; respondents: Party[] }> {
  const applicants: Party[] = [];
  const respondents: Party[] = [];

  // Process respondents
  for (const respondentMap of partyList.respondentList) {
    const respondent = { ...respondentMap }; // Shallow copy the respondent object
    const dbRespondent = await findPartyById(respondent.id, partyRepository);
    if (dbRespondent) {
      respondents.push(dbRespondent); // Add to respondents list if found
    }
  }

  // Process appellants (applicants)
  for (const appellantMap of partyList.appellantList) {
    const appellant = { ...appellantMap }; // Shallow copy the appellant object
    const dbAppellant = await findPartyById(appellant.id, partyRepository);
    if (dbAppellant) {
      applicants.push(dbAppellant); // Add to applicants list if found
    }
  }

  // Return the structured response with applicants and respondents
  return { applicants, respondents };
}

export async function findPartyById(
  partyId: number,
  partRepository: Repository<Party>,
) {
  return await partRepository.findOne({
    where: { id: partyId },
  });
}

// top-appellant.dto.ts
export class TopAppellantDTO {
  id: number;
  name: string;
  appealCount: number;
}

// Utility to generate date ranges for each month
export function generateDateRanges(year: number) {
  const dateRanges = [];
  for (let i = 0; i < 12; i++) {
    const startDate = new Date(year, i, 1);
    const endDate = new Date(year, i + 1, 0);
    dateRanges.push({ startDate, endDate });
  }
  return dateRanges;
}

// Helper to map month index to setter method name
export function getMonthName(index: number) {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return monthNames[index];
}

// Method to format date from dd/MM/yyyy to yyyy-MM-dd
export function formatDate(dateString: string): Date {
  console.log(dateString);
  // Split the input date (e.g. 15/05/2024) into day, month, year
  const [day, month, year] = dateString
    .split('/')
    .map((num) => parseInt(num, 10));

  // Create a new Date object using the parsed values (Note: months are 0-indexed in JavaScript)
  const date = new Date(year, month - 1, day);

  console.log('date', date);

  // Format the date as yyyy-MM-dd using toISOString and string manipulation

  // Gets 'yyyy-MM-dd'
  return date;
}

export function isValidaPhone(phoneNo: string) {
  if (!phoneNo || phoneNo.trim() === '') {
    return false;
  } else if (
    phoneNo.trim().match(/^\d{10}$/) &&
    phoneNo.trim().charAt(0) === '0'
  ) {
    // Validate phone numbers of format "0723XXXXXX"
    return true;
  } else
    return (
      phoneNo.trim().match(/^\d{12}$/) &&
      phoneNo.trim().substring(0, 3) === '255'
    );
}
