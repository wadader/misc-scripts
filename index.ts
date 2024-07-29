import {
  Abi,
  Address,
  Chain,
  ContractEventName,
  LimitExceededRpcError,
  PublicClient,
  createPublicClient,
  http,
} from "viem";
import { arbitrumSepolia } from "viem/chains";

async function main() {
  console.log("ALCHEMY_RPC_URL:", process.env.ALCHEMY_RPC_URL);

  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(process.env.ALCHEMY_RPC_URL),
  });

  const blockNumber = await client.getBlockNumber();

  console.table({ blockNumber });

  const events = await getContractEvents(
    arbitrumSepolia,
    "0x9426f127116c3652a262ae1ea48391ac8f44d35b",
    DISPUTE_KIT_CLASSIC_ABI,
    5179824n,
    49737306n,
    "VoteCast",
    client
  );

  const eventsLength = events.length;

  for (let i = 0; i < eventsLength; i++) {
    const event = events[i];
    const eventName = event.eventName;

    if (eventName === "VoteCast") {
      const { _coreDisputeID } = event.args;
      if (_coreDisputeID === 55n) {
        console.log("eventArgs:", event.args);
        console.log("blockNumber:", event.blockNumber);
      }
    }
  }
}

async function getContractEvents<Tabi extends Abi>(
  network: Chain,
  address: Address,
  abi: Tabi,
  fromBlock: bigint,
  toBlock: bigint,
  eventName: ContractEventName<Tabi>,
  client: PublicClient
) {
  if (fromBlock > toBlock) {
    throw new RangeError("fromBlock cannot be greater than toBlock");
  }

  const BLOCK_RANGE = BigInt(500000);

  let range = BLOCK_RANGE;
  const events = [];
  let _toBlock = fromBlock + range > toBlock ? toBlock : fromBlock + range;
  let errorCount = 0;
  do {
    const eventsBatch = await client.getContractEvents({
      address: address,
      abi: abi,
      fromBlock: fromBlock,
      toBlock: _toBlock,
      eventName: eventName,
    });

    console.log("fromBlock:", fromBlock);

    try {
      events.push(...eventsBatch);

      fromBlock = _toBlock + BigInt(1);
      _toBlock = _toBlock + range > toBlock ? toBlock : _toBlock + range;
    } catch (e: any) {
      if (e.name === LimitExceededRpcError) {
        range = range / BigInt(2);
        console.debug(`Reducing range to ${range}`);
      }
      if (errorCount > 5 || e.name != LimitExceededRpcError) {
        console.error(`Error getting events for contract: ${address}`);
        console.error(e);
        throw e;
      }
      errorCount++;
    }
  } while (_toBlock < toBlock);
  return events;
}

main();

const DISPUTE_KIT_CLASSIC_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "AlreadyInitialized", type: "error" },
  { inputs: [], name: "FailedDelegateCall", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "implementation", type: "address" },
    ],
    name: "InvalidImplementation",
    type: "error",
  },
  { inputs: [], name: "NotInitializing", type: "error" },
  { inputs: [], name: "UUPSUnauthorizedCallContext", type: "error" },
  {
    inputs: [{ internalType: "bytes32", name: "slot", type: "bytes32" }],
    name: "UUPSUnsupportedProxiableUUID",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreDisputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreRoundID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_choice",
        type: "uint256",
      },
    ],
    name: "ChoiceFunded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreDisputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_juror",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "_voteIDs",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "_commit",
        type: "bytes32",
      },
    ],
    name: "CommitCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreDisputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreRoundID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_choice",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_contributor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "Contribution",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreDisputeID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_numberOfChoices",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "_extraData",
        type: "bytes",
      },
    ],
    name: "DisputeCreation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreDisputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_juror",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "_voteIDs",
        type: "uint256[]",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_choice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "_justification",
        type: "string",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreDisputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_coreRoundID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_choice",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_contributor",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "Withdrawal",
    type: "event",
  },
  {
    inputs: [],
    name: "LOSER_APPEAL_PERIOD_MULTIPLIER",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LOSER_STAKE_MULTIPLIER",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ONE_BASIS_POINT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WINNER_STAKE_MULTIPLIER",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
    ],
    name: "areCommitsAllCast",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
    ],
    name: "areVotesAllCast",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256[]", name: "_voteIDs", type: "uint256[]" },
      { internalType: "bytes32", name: "_commit", type: "bytes32" },
    ],
    name: "castCommit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256[]", name: "_voteIDs", type: "uint256[]" },
      { internalType: "uint256", name: "_choice", type: "uint256" },
      { internalType: "uint256", name: "_salt", type: "uint256" },
      { internalType: "string", name: "_justification", type: "string" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_core", type: "address" }],
    name: "changeCore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address payable", name: "_governor", type: "address" },
    ],
    name: "changeGovernor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "core",
    outputs: [
      { internalType: "contract KlerosCore", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "coreDisputeIDToLocal",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_numberOfChoices", type: "uint256" },
      { internalType: "bytes", name: "_extraData", type: "bytes" },
      { internalType: "uint256", name: "_nbVotes", type: "uint256" },
    ],
    name: "createDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
    ],
    name: "currentRuling",
    outputs: [
      { internalType: "uint256", name: "ruling", type: "uint256" },
      { internalType: "bool", name: "tied", type: "bool" },
      { internalType: "bool", name: "overridden", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "disputes",
    outputs: [
      { internalType: "uint256", name: "numberOfChoices", type: "uint256" },
      { internalType: "bool", name: "jumped", type: "bool" },
      { internalType: "bytes", name: "extraData", type: "bytes" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_nonce", type: "uint256" },
    ],
    name: "draw",
    outputs: [
      { internalType: "address", name: "drawnAddress", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_destination", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "executeGovernorProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_choice", type: "uint256" },
    ],
    name: "fundAppeal",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_coreRoundID", type: "uint256" },
    ],
    name: "getCoherentCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_coreRoundID", type: "uint256" },
      { internalType: "uint256", name: "_voteID", type: "uint256" },
    ],
    name: "getDegreeOfCoherence",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
    ],
    name: "getFundedChoices",
    outputs: [
      { internalType: "uint256[]", name: "fundedChoices", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_coreRoundID", type: "uint256" },
      { internalType: "uint256", name: "_choice", type: "uint256" },
    ],
    name: "getRoundInfo",
    outputs: [
      { internalType: "uint256", name: "winningChoice", type: "uint256" },
      { internalType: "bool", name: "tied", type: "bool" },
      { internalType: "uint256", name: "totalVoted", type: "uint256" },
      { internalType: "uint256", name: "totalCommited", type: "uint256" },
      { internalType: "uint256", name: "nbVoters", type: "uint256" },
      { internalType: "uint256", name: "choiceCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_coreRoundID", type: "uint256" },
      { internalType: "uint256", name: "_voteID", type: "uint256" },
    ],
    name: "getVoteInfo",
    outputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bytes32", name: "commit", type: "bytes32" },
      { internalType: "uint256", name: "choice", type: "uint256" },
      { internalType: "bool", name: "voted", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "governor",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_governor", type: "address" },
      { internalType: "contract KlerosCore", name: "_core", type: "address" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      { internalType: "uint256", name: "_coreRoundID", type: "uint256" },
      { internalType: "uint256", name: "_voteID", type: "uint256" },
    ],
    name: "isVoteActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_coreDisputeID", type: "uint256" },
      {
        internalType: "address payable",
        name: "_beneficiary",
        type: "address",
      },
      { internalType: "uint256", name: "_coreRoundID", type: "uint256" },
      { internalType: "uint256", name: "_choice", type: "uint256" },
    ],
    name: "withdrawFeesAndRewards",
    outputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
