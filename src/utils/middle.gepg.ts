import { Bill } from '../payment/bill/entities/bill.entity';
import { GePGGlobalSignature } from './sig.gepg';
import { postData } from './helper.utils';
import { BillItem } from '../payment/bill-item/entities/bill-item.entity';
import { Repository } from 'typeorm';
import { Constants } from './constants';
import { Fee } from '../settings/fees/entities/fee.entity';

const xml2js = require('xml2js');

export async function sendBill(
  bill: Bill,
  billItemRepository: Repository<BillItem>,
): Promise<boolean> {
  const billets: BillItem[] = await billItemRepository.find({
    where: { bill: bill },
  });

  const billItemsArray = [];

  billets.forEach((billItem) => {
    const item = {
      BillItemRef: billItem.billItemRef,
      UseItemRefOnPay: 'N',
      BillItemAmt: billItem.billItemAmount,
      BillItemEqvAmt: billItem.billItemEqvAmount,
      BillItemMiscAmt: billItem.billItemMiscAmount,
      GfsCode: billItem.gfsCode,
    };
    billItemsArray.push(item);
  });

  const formattedDateGeneratedDate = new Date(bill.generatedDate)
    .toISOString()
    .split('T');
  const formattedDateStringGeneratedDate = `${formattedDateGeneratedDate[0]}T${formattedDateGeneratedDate[1].split('.')[0]}`;

  const formattedExpiry = new Date(bill.expiryDate).toISOString().split('T');
  const formattedExpiryDate = `${formattedExpiry[0]}T${formattedExpiry[1].split('.')[0]}`;

  const generatedBy = bill.payerName.substring(0, 40);
  console.log(generatedBy);

  // Define the data object according to the XML structure
  const gepgBillSubReq = {
    gepgBillSubReq: {
      BillHdr: {
        SpCode: Constants.SP_CODE,
        RtrRespFlg: 'true',
      },
      BillTrxInf: {
        BillId: bill.billId,
        SubSpCode: '1001',
        SpSysId: Constants.SYSTEM_ID,
        BillAmt: bill.billedAmount,
        MiscAmt: '0',
        BillExprDt: formattedExpiryDate,
        PyrId: 'MBEYA CEMENT COMPANY LIMITED',
        PyrName: bill.payerName,
        BillDesc: bill.billDescription,
        BillGenDt: formattedDateStringGeneratedDate,
        BillGenBy: generatedBy,
        BillApprBy: 'TRAIS VERSION 2',
        PyrCellNum: bill.payerPhone,
        PyrEmail: Constants.REGISTER_EMAIL,
        Ccy: 'TZS',
        BillEqvAmt: bill.billEquivalentAmount,
        RemFlag: 'false',
        BillPayOpt: Constants.FULL_BILL_PAY_TYPE,
        BillItems: {
          BillItem: billItemsArray,
        },
      },
    },
  };

  const builder = new xml2js.Builder({
    renderOpts: { pretty: false, indent: ' ', newline: '\n' },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  });

  const content = builder.buildObject(gepgBillSubReq);

  const gePGGlobalSignature = new GePGGlobalSignature();
  const gepgBillSubReqString = getStringWithinXmlTag(content, 'gepgBillSubReq');
  const signature = gePGGlobalSignature.createSignature(gepgBillSubReqString);

  const gepgData =
    '<Gepg>' +
    gepgBillSubReqString +
    '<gepgSignature>' +
    signature +
    '</gepgSignature></Gepg>';
  console.log(gepgData);
  const response = await postData(
    'http://154.118.230.202:80/api/bill/sigqrequest',
    gepgData,
  );
  console.log('\n' + response);
  return true;
}

export async function generatePaymentAck(): Promise<string> {
  // Create the data structure for the response
  const ackData = {
    gepgPmtSpInfoAck: [
      {
        TrxStsCode: '7101', // Transaction Status Code
      },
    ],
  };

  // Initialize the XML builder with formatting options
  const builder = new xml2js.Builder({
    renderOpts: { pretty: false, indent: ' ', newline: '\n' },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  });

  // Generate the XML content
  const content = builder.buildObject(ackData);
  const gepgPmtSpInfoAck = getStringWithinXmlTag(content, 'gepgPmtSpInfoAck');

  // Create digital signature
  const gePGGlobalSignature = new GePGGlobalSignature();
  const signature = gePGGlobalSignature.createSignature(gepgPmtSpInfoAck);

  // Construct the final XML response
  return `<Gepg>${gepgPmtSpInfoAck}<gepgSignature>${signature}</gepgSignature></Gepg>`;
}

export async function generateBillAck(): Promise<string> {
  // Create the data structure for the response
  const ackData = {
    gepgBillSubRespAck: [
      {
        TrxStsCode: '7101', // Transaction Status Code
      },
    ],
  };

  // Initialize the XML builder with formatting options
  const builder = new xml2js.Builder({
    renderOpts: { pretty: false, indent: ' ', newline: '\n' },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  });

  // Generate the XML content
  const content = builder.buildObject(ackData);
  const gepgBillSubRespAck = getStringWithinXmlTag(
    content,
    'gepgBillSubRespAck',
  );

  // Create digital signature
  const gePGGlobalSignature = new GePGGlobalSignature();
  const signature = gePGGlobalSignature.createSignature(gepgBillSubRespAck);

  // Construct the final XML response
  return `<Gepg>${gepgBillSubRespAck}<gepgSignature>${signature}</gepgSignature></Gepg>`;
}

function getStringWithinXmlTag(xmlBody, xmlTag) {
  let xmlString = '';

  if (xmlBody && xmlTag) {
    try {
      // Construct the start and end tags
      const startTag = `<${xmlTag}>`;
      const endTag = `</${xmlTag}>`;

      // Check if the tags are present in the XML body
      const startIndex = xmlBody.indexOf(startTag);
      const endIndex = xmlBody.indexOf(endTag);

      if (startIndex !== -1 && endIndex !== -1) {
        // Extract the string within the XML tag
        xmlString = xmlBody.substring(startIndex, endIndex + endTag.length);
      }
    } catch (e) {
      console.error('Error extracting string from XML tag:', e);
    }
  }
  console.log(xmlString);
  return xmlString;
}

// This version assumes you pass the repository as a parameter

export async function createBillItem(
  bill: Bill,
  no: string,
  billItemRepository: Repository<BillItem>,
  fee: Fee,
  source: string,
): Promise<void> {
  const billItem = new BillItem();
  billItem.billItemAmount = fee.amount;
  billItem.billItemDescription = no;
  billItem.billItemRef = `REF${no}`;
  billItem.billItemMiscAmount = 0;
  billItem.billItemEqvAmount = fee.amount;
  billItem.sourceName = source;
  billItem.bill = bill;
  billItem.gfsCode = fee.gfs.name;

  // Save the BillItem
  await billItemRepository.save(billItem);
}
