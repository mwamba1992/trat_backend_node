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
    'http://10.1.1.134:80/api/bill/sigqrequest',
    gepgData,
  );
  console.log('\n' + response);
  return true;
}

export async function generatePaymentAck(): Promise<string> {
  // Create the data structure for the response
  const ackData = {
    Gepg: {
      gepgPmtSpInfoAck: [
        {
          TrxStsCode: '7101', // Transaction Status Code
        },
      ],
      gepgSignature: [
        'd0EEMUCItSuadQP6zamGoW1yOKomXWtMFKEl60zXq4/xsQ1MCtBNiwUqiiZQw2jfUSCIGzsXteLpZS3wEwOHPHF6AXyir7zCv4zJ8mqEDGDcJUVooUjuLtC602RuoE2a2ER0XKhPyBd0ijxLzYMiVioWAIDg0QgzYRk3qy8Pjy1o9U7a0Ya0X2nGklVApTFYQPlLZznmbFriFvV2L0AVfpJfWjcerIcON+JiGB5x8jok2Q34g6qWiEvhdwGYd3/qRFKoYRdBw4Il8BD/Ok7JM7u+QvC4WLWNVuu0jqgJaa+/e1rFHeOBAENqE8IwMDCoiIr6yzgi4+p63VxEZD4gOQ==',
      ],
    },
  };

  // Convert the JavaScript object to XML
  const builder = new xml2js.Builder();
  return builder.buildObject(ackData);
}

export async function generateBillAck(): Promise<string> {
  // Create the data structure for the response
  const ackData = {
    Gepg: {
      gepgBillSubRespAck: [
        {
          TrxStsCode: '7101', // Transaction Status Code
        },
      ],
      gepgSignature: [
        'CmUx2/7j6bgnLZX21VQXO1bQvGK8nz4XVfE07GmUqz6RPsYbSEq1iyqvUCBxKU3x4+jdlmz4AkP5Lf7+ZQa2+MIeYAytGXL1UoOB44JpqBozH8xW2OBzFPk7tMvrTU8AXYRTNlBDIrgDoW4S3lqqLOVeZD6YcwEmwHFRo26F1zc0ec/MT97Y84lO/KiWrKpC6X8Fim7QEb3vWR9hfTUyYyZQOE0LQQucY70LfswPvGeADOt/X+/vMbkI/bADcbr7QWg3DYZdt1NiHp1NMgeWa3JiqnFLY8R6kmVdPyoYvObrK/G4vEU4xIZOFFl3nwCQIHuArV+IbulHKY/LuhR9fA==',
      ],
    },
  };

  const builder = new xml2js.Builder();
  return builder.buildObject(ackData);
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
