import raw from "./daopoll-abi.json";
import { getAddress, isAddress, zeroAddress, type Address, type Abi } from "viem";

type DaoPollArtifact = {
  abi: Abi;
  DAOPOLL_ADDRESS: string;
};

const data = raw as unknown as DaoPollArtifact;

export const daopollAbi = data.abi as Abi;

const addr = data.DAOPOLL_ADDRESS?.trim() ?? "";

if (!isAddress(addr) || getAddress(addr) === zeroAddress) {
  throw new Error(
    "Set a valid non-zero DAOPOLL_ADDRESS in src/daopoll-abi.json (your deployed DAOPoll contract).",
  );
}

export const DAOPOLL_ADDRESS = addr as Address;
