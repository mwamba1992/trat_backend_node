import * as bcrypt from 'bcryptjs';
import { Party } from '../settings/parties/entities/party.entity';
import { Repository } from 'typeorm';


// The encodePassword function that hashes a plain password with bcrypt
export async function encodePassword(plainPassword: string): Promise<string> {
  const saltRounds = 4; // You can adjust the salt rounds as per your requirement
  return await bcrypt.hash(plainPassword, saltRounds);
}


// The decodePassword function that compares a plain password with a hashed password
export async function decodePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}


const axios = require('axios');

export async  function postData(url: string, data: string): Promise<String>{
  const response = await axios.post(url, data, {
    headers: { 'Content-Type': 'application/xml' , 'Gepg-Com': "default.sp.in", 'Gepg-Code':'SP566' },

  });

  return response.data;
}

// Generalized processParties function
export async function processParties(
  partyList: { appellantList: any[]; respondentList: any[] },  // Accepts both appellantList and respondentList
  partyRepository: Repository<Party>  // Repository for Party entity
): Promise<{ applicants: Party[]; respondents: Party[] }> {
  let applicants: Party[] = [];
  let respondents: Party[] = [];

  // Process respondents
  for (const respondentMap of partyList.respondentList) {
    const respondent = { ...respondentMap };  // Shallow copy the respondent object
    const dbRespondent = await findPartyById(respondent.id, partyRepository);
    if (dbRespondent) {
      respondents.push(dbRespondent);  // Add to respondents list if found
    }
  }

  // Process appellants (applicants)
  for (const appellantMap of partyList.appellantList) {
    const appellant = { ...appellantMap };  // Shallow copy the appellant object
    const dbAppellant = await findPartyById(appellant.id, partyRepository);
    if (dbAppellant) {
      applicants.push(dbAppellant);  // Add to applicants list if found
    }
  }

  // Return the structured response with applicants and respondents
  return { applicants, respondents };
}



 export async function findPartyById(partyId: number,  partRepository: Repository<Party>) {
  return await partRepository.findOne({
    where: { id: partyId },
  });
}


