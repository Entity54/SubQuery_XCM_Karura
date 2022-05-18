import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
import {AccountId20, ExternalAccountId32, XTokensTransferredMultiAssetsEvent, Account, XcmpQueueEvent } from "../types";
import {Balance} from "@polkadot/types/interfaces";
import { u128 } from "@polkadot/types-codec";

const KaruraTreasuryAddress = "qmmNufxeWaAVLMER2va1v4w2HbuU683c5gGtuxQG4fKTZSb";
// endpoint: 'wss://karura.api.onfinality.io/public-ws'

//RECEIVE  This event is picked up on the parachain when an XCM deposit is made. From within it we get the extrinsic and from there the other importan events
export async function handleXCMpQueueEvent(event: SubstrateEvent): Promise<void> {
    const [xcmHash] = event.event.data.toJSON() as any;
    let record = new XcmpQueueEvent(`${event.block.block.header.number.toNumber()}-${event.idx}`);
    record.blockNum   =  event.block.block.header.number.toBigInt();
    record.blockHash  = event.block.block.header.hash.toString()
    record.timestamp  = event.block.timestamp;
    record.xcmHash    = xcmHash;

    record.extrinsicHash = event.extrinsic.extrinsic.hash.toString();

    //TODO Reade horizontal Messaged BlockNumber abd decode data message

    const nEv = event.extrinsic.events.length;
    // logger.info(`\n =============================> nEv ${nEv} extrinsicHash: ${record.extrinsicHash}`);  

    for (let i=0; i<nEv; i++) 
    {
        // logger.info(`\n  i:${i}  event.index : ` + event.extrinsic.events[i].event.index + " method: " + event.extrinsic.events[i].event.method + " section: " + event.extrinsic.events[i].event.section);  //0x0a08
        if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="balances" && (event.extrinsic.events[i].event.method).toLowerCase() ==="withdraw")
        {
            const [accntId32, totalWithdrawnAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
                record.token = "KAR";  //we know this because it is balances section and not tokens
                record.fromAccountId32 = accntId32
                record.totalWithdrawn = totalWithdrawnAmount;
                logger.info(`\n handleXCMpQueueEvent  record.token :${record.token} record.fromAccountId32: ${record.fromAccountId32} record.totalWithdrawn: ${record.totalWithdrawn}`);  
        }
        else if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="balances" && (event.extrinsic.events[i].event.method).toLowerCase() ==="deposit")
        {
            const [accntId32, totalDepositAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
            if ( accntId32!==KaruraTreasuryAddress) 
            {
                const to_accntId32 = await Account.get(accntId32);
                if ( !to_accntId32 )
                {
                    await new Account( accntId32 ).save();
                }
                record.toAccountId32Id = accntId32;

                record.netReceivedAmount = totalDepositAmount;
                logger.info(`\n handleXCMpQueueEvent  record.toAccountId32Id: ${record.toAccountId32Id} record.netReceivedAmount: ${record.netReceivedAmount}`);  
            }
            else ( accntId32===KaruraTreasuryAddress) 
            {
                record.treasuryAddress = accntId32
                record.treasuryFees = totalDepositAmount;
                logger.info(`\n handleXCMpQueueEvent  record.treasuryAddress: ${record.treasuryAddress} record.treasuryFees: ${record.treasuryFees}`);  
            }
        }
        else if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="tokens" && (event.extrinsic.events[i].event.method).toLowerCase() ==="withdrawn")
        {
            const [tknen, accntId32, totalWithdrawnAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
                record.token = tknen.token;
                record.fromAccountId32 = accntId32;
                record.totalWithdrawn = totalWithdrawnAmount;
                logger.info(`\n handleXCMpQueueEvent  record.token: ${record.token} record.fromAccountId32: ${record.fromAccountId32} record.totalWithdrawn: ${record.totalWithdrawn}`);  
        }
        else if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="tokens" && (event.extrinsic.events[i].event.method).toLowerCase() ==="deposited")
        {
            const [tknen, accntId32, totalDepositAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
            if ( accntId32!==KaruraTreasuryAddress) 
            {
                const to_accntId32 = await Account.get(accntId32);
                if ( !to_accntId32 )
                {
                    await new Account( accntId32 ).save();
                }
                record.toAccountId32Id = accntId32;

                record.netReceivedAmount = totalDepositAmount;
                logger.info(`\n handleXCMpQueueEvent  record.toAccountId32Id: ${record.toAccountId32Id} record.netReceivedAmount: ${record.netReceivedAmount}`);  
            }
            else ( accntId32===KaruraTreasuryAddress) 
            {
                record.treasuryAddress = accntId32
                record.treasuryFees = totalDepositAmount;
                logger.info(`\n handleXCMpQueueEvent  record.treasuryAddress: ${record.treasuryAddress} record.treasuryFees: ${record.treasuryFees}`);  
            }
        }
      
    }

    await record.save();
}


//SEND KAR or AUSD/KUSD using xTokens.TransferredMultiAssets EVENT
export async function handleXTokensTransferredMultiAssetEvent(event: SubstrateEvent): Promise<void> {
    const [fromAccountId20, alpha, beta, extra] = event.event.data.toJSON() as any;
    
    if  ( Object.keys( event ).includes("extrinsic") && Object.keys( event.extrinsic ).includes("extrinsic") && Array.isArray(alpha) )
    {

    let record = new XTokensTransferredMultiAssetsEvent(`${event.block.block.header.number.toNumber()}-${event.idx}`);
    record.blockNum   = event.block.block.header.number.toBigInt();
    record.blockHash  = event.block.block.header.hash.toString()
    record.timestamp  = event.block.timestamp;
    record.extrinsicHash = event.extrinsic.extrinsic.hash.toString();
    record.signer        = event.extrinsic.extrinsic.signer.toString();      

    const fromAccount_Id20 = await AccountId20.get(fromAccountId20);
    if ( !fromAccount_Id20 )
    {
        await new AccountId20( fromAccountId20 ).save();
    }
    record.fromAccountId20Id = fromAccountId20;
    
    // record.toChainName = event.event.data.toString()
    logger.info("\nSTARTING REPORTING");


    const alpha_id_Objkeys = Object.keys(alpha[0].id);
    // if (alpha_id_Objkeys.includes("concrete") && alpha[0].id.concrete.parents===1 &&  Object.keys(alpha[0].id.concrete.interior).includes("here"))  
    // {
    //     // logger.info("\n handleXTokensTransferredMultiAssetEvent  WE ARE TRANFERRING KSM")
    //     // record.toChainName = "Kusama";
    //     // record.toChainCode = "";
    //     // record.transferredToken = "KSM";
    //     // record.transferredTokenGeneralKey = "";
    //     // record.sentAmount =  alpha[0].fun.fungible;

    //     // const x1_Objkeys = Object.keys( extra.interior.x1 );
    //     // if (x1_Objkeys.includes("accountId32"))
    //     // {
    //     //     const to_AccountId32 = extra.interior.x1.accountId32.id;
    //     //     const to_acntId32 = await ExternalAccountId32.get(to_AccountId32);
    //     //     if ( !to_acntId32 )
    //     //     {
    //     //         await new ExternalAccountId32( to_AccountId32 ).save();
    //     //     }
    //     //     record.toAccountId32Id = to_AccountId32;

    //     //     logger.info(`\n handleXTokensTransferredMultiAssetEvent TRANAFERRING KSM FROM record.transferredToken:${record.fromAccountId20Id}  FOR AMOUNT record.sentAmount:${record.sentAmount} TO ACCOUNT record.to_AccountId32:${record.toAccountId32Id}`);
    //     // }
    // }
    if (alpha_id_Objkeys.includes("concrete") && alpha[0].id.concrete.parents===1 &&  Object.keys(alpha[0].id.concrete.interior).includes("x2"))     //Karura To Parachain
    {
       
      logger.info(`\n handleXTokensTransferredMultiAssetEvent event.event.data.toJSON() ==> `,event.event.data.toJSON());
       
        // const parachain = alpha[0].id.concrete.interior.x2[0].parachain;
        // logger.info(`\n Herrrrr===>  extra.interior.x2[0]: `, extra.interior.X2[0]);

        const parachain = extra.interior.x2[0]["parachain"];
        const generalkey = `${alpha[0].id.concrete.interior.x2[1]["generalKey"]}`;
        // const generalkey = JSON.stringify(Object.keys(alpha[0].id.concrete.interior.x2[0]));

        let parachainName, assetName;
        if (parachain===2000) parachainName = "Karura";
        else if (parachain===2023) parachainName = "Moonriver";

        record.toChainName = parachainName;
        record.toChainCode = parachain;

        if (generalkey==="0x0080") assetName = "KAR"
        else if (generalkey==="0x0081") assetName = "KUSD"
      

        record.transferredToken =  assetName; //event.event.data.toString(); //assetName;
        record.transferredTokenGeneralKey =  generalkey;
        record.sentAmount =  alpha[0].fun.fungible;

        const x2_1_Objkeys = Object.keys( extra.interior.x2[1] );
        if (x2_1_Objkeys.includes("accountKey20"))
        {
            const to_AccountId32 = extra.interior.x2[1].accountKey20.key;    
            const to_acntId32 = await ExternalAccountId32.get(to_AccountId32);
            if ( !to_acntId32 )
            {
                await new ExternalAccountId32( to_AccountId32 ).save();
            }
            record.toAccountId32Id = to_AccountId32;
            const accountId_1 = to_AccountId32.toString();
            // const accountId_2 = hexToU8a(to_AccountId32); //to_AccountId32.toU8a(); 
            // const accountId_3 = hexToU8a(to_AccountId32).toString(); //to_AccountId32.toU8a(); 
            
            logger.info(`\n handleXTokensTransferredMultiAssetEvent  WE ARE TRANFERRING TO PARACHAIN FROM record.transferredToken:${record.fromAccountId20Id}  FOR AMOUNT record.sentAmount:${record.sentAmount} TO ACCOUNT record.to_AccountId32:${record.toAccountId32Id}`);
            logger.info(`\n *********** accountId_1: ` + accountId_1 + " to_AccountId32: " + to_AccountId32);
       }

    }
    else 
    {
        logger.info("\n handleXTokensTransferredMultiAssetEvent  WE ARE NOT TRANFERRING ksm  !!!!!!!")
    }
    
    const {callIndex, args} =   event.extrinsic.extrinsic.method.toJSON() as any;

    const nEv = event.extrinsic.events.length;
    logger.info(`\n =============================> nEv ${nEv} extrinsicHash: ${record.extrinsicHash}`);  
    for (let i =0; i<nEv; i++)
    {
      if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="balances" && (event.extrinsic.events[i].event.method).toLowerCase() ==="withdraw")
      {
          const [accntId20, totalWithdrawnAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
          if ( accntId20===fromAccountId20)
          {
            record.totalWithdrawn = totalWithdrawnAmount;
            logger.info(`\n handleXTokensTransferredMultiAssetEvent record.totalWithdrawn: ${record.totalWithdrawn}`);  
          }
      }
      else if (  (event.extrinsic.events[i].event.section).toLowerCase()==="assets"  && (event.extrinsic.events[i].event.method).toLowerCase() ==="burned")
      {
          const [asset, accntId20, burnedAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
          if ( accntId20===fromAccountId20) 
          {
            record.burnedAmount = burnedAmount;
            logger.info(`\n handleXTokensTransferredMultiAssetEvent record.burnedAmount: ${record.burnedAmount}`);  
          }
      }
      else if (  (event.extrinsic.events[i].event.section).toLowerCase()==="ethereum"  && (event.extrinsic.events[i].event.method).toLowerCase() ==="executed")
      {
          const [from, toPrecompile, payload, extra] = event.extrinsic.events[i].event.data.toJSON() as any;
          if ( from===fromAccountId20) 
          {
            record.toPrecompile = toPrecompile;
            record.payload = payload;
            record.evmCoreErrorExitReason = extra.succeed;
            logger.info(`\n handleXTokensTransferredMultiAssetEvent record.toPrecompile: ${record.toPrecompile} record.payload: ${record.payload} record.evmCoreErrorExitReason: ${record.evmCoreErrorExitReason}`);  
          }
      }
      else if (  (event.extrinsic.events[i].event.section).toLowerCase()==="balances"  && (event.extrinsic.events[i].event.method).toLowerCase() ==="deposit")
      {
        const [accntId20, amount] = event.extrinsic.events[i].event.data.toJSON() as any;
        if ( accntId20===fromAccountId20) //todo
        {
            record.returnedDeposit = amount;
            logger.info(`\n handleXTokensTransferredMultiAssetEvent record.returnedDeposit: ${record.returnedDeposit}`);
        }
        else if ( accntId20===KaruraTreasuryAddress) 
        {
            record.treasuryFees = amount;
            record.treasuryAdress = KaruraTreasuryAddress;
            logger.info(`\n handleXTokensTransferredMultiAssetEvent record.treasuryFees: ${record.treasuryFees}  record.treasuryAdress: ${record.treasuryAdress}`);
        }
        else 
        {
            record.valAddress = accntId20;
            record.otherFees = amount;
            logger.info(`\n handleXTokensTransferredMultiAssetEvent record.otherFees: ${record.otherFees} record.valAddress: ${record.valAddress}`);
        }
        
      }
      else if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="xcmpqueue" && (event.extrinsic.events[i].event.method).toLowerCase() ==="xcmpmessagesent")
      {
            const [xcmpMessage] = event.extrinsic.events[i].event.data.toJSON() as any;
            record.xcmpMessage = xcmpMessage;
            logger.info(`\n handleXTokensTransferredMultiAssetEvent record.xcmpMessage: ${record.xcmpMessage}`);
      }


      else if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="tokens" && (event.extrinsic.events[i].event.method).toLowerCase() ==="withdrawn")
      {
        //   const [tknen, accntId32, totalWithdrawnAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
        //       record.transferredToken = tknen.token;
        //       record.fromAccountId20 = accntId32
        //       record.totalWithdrawn = totalWithdrawnAmount;
        //       logger.info(`\n handleXTokensTransferredMultiAssetEvent  record.transferredToken: ${record.transferredToken} record.fromAccountId20: ${record.fromAccountId20} record.totalWithdrawn: ${record.totalWithdrawn}`);  
      }
      else if (  (event.extrinsic.events[i].event.section).toLowerCase() ==="tokens" && (event.extrinsic.events[i].event.method).toLowerCase() ==="deposited")
      {
        //   const [tknen, accntId32, totalDepositAmount] = event.extrinsic.events[i].event.data.toJSON() as any;
        //   if ( accntId32!==KaruraTreasuryAddress) 
        //   {
        //       const to_accntId32 = await Account.get(accntId32);
        //       if ( !to_accntId32 )
        //       {
        //           await new Account( accntId32 ).save();
        //       }
        //       record.toAccountId32Id = accntId32;

        //       record.netReceivedAmount = totalDepositAmount;
        //       logger.info(`\n handleXTokensTransferredMultiAssetEvent  record.toAccountId32Id: ${record.toAccountId32Id} record.netReceivedAmount: ${record.netReceivedAmount}`);  
        //   }
        //   else ( accntId32===KaruraTreasuryAddress) 
        //   {
        //       record.treasuryAddress = accntId32
        //       record.treasuryFees = totalDepositAmount;
        //       logger.info(`\n handleXTokensTransferredMultiAssetEvent  record.treasuryAddress: ${record.treasuryAddress} record.treasuryFees: ${record.treasuryFees}`);  
        //   }
      }
    
    }
    //#endregion

    await record.save();
    }
}
