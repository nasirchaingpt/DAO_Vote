import { useCallback, useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { type Address } from "viem";
import { DAOPOLL_ADDRESS, daopollAbi } from "./daopoll";
import { ConnectBar } from "./components/ConnectBar";
import { CreatePollCard } from "./components/CreatePollCard";
import { PollCard, type PollData } from "./components/PollCard";

function parsePoll(result: unknown): PollData | undefined {
  if (!Array.isArray(result) || result.length < 5) return undefined;
  const [description, options, votes, creator, endTime] = result as [
    string,
    readonly string[],
    readonly bigint[],
    Address,
    bigint,
  ];
  if (typeof description !== "string" || !Array.isArray(options)) return undefined;
  return {
    description,
    options,
    votes,
    creator,
    endTime,
  };
}

export function App() {
  const { address } = useAccount();

  const { data: pollCountRaw, refetch: refetchPollCount } = useReadContract({
    address: DAOPOLL_ADDRESS,
    abi: daopollAbi,
    functionName: "pollCount",
  });

  const pollCount =
    pollCountRaw !== undefined ? Number(pollCountRaw as bigint) : 0;

  const getPollContracts = useMemo(() => {
    if (pollCount === 0) return [];
    return Array.from({ length: pollCount }, (_, i) => ({
      address: DAOPOLL_ADDRESS,
      abi: daopollAbi,
      functionName: "getPoll" as const,
      args: [BigInt(i)] as const,
    }));
  }, [pollCount]);

  const { data: pollsRead, refetch: refetchPolls } = useReadContracts({
    contracts: getPollContracts,
    query: { enabled: getPollContracts.length > 0 },
  });

  const votedContracts = useMemo(() => {
    if (address === undefined || pollCount === 0) return [];
    return Array.from({ length: pollCount }, (_, i) => ({
      address: DAOPOLL_ADDRESS,
      abi: daopollAbi,
      functionName: "hasVoted" as const,
      args: [BigInt(i), address] as const,
    }));
  }, [address, pollCount]);

  const { data: votedRead, refetch: refetchVoted } = useReadContracts({
    contracts: votedContracts,
    query: { enabled: votedContracts.length > 0 },
  });

  const refreshPolls = useCallback(async () => {
    await refetchPollCount();
    await refetchPolls();
    await refetchVoted();
  }, [refetchPollCount, refetchPolls, refetchVoted]);

  return (
    <>
      <h1>DAO Poll</h1>
      <p className="subtitle">
        Connect your wallet on <strong>Avalanche Fuji</strong> or{" "}
        <strong>Hardhat</strong>, then create polls or vote. Contract:{" "}
        <code className="address">{DAOPOLL_ADDRESS}</code>
      </p>

      <ConnectBar />

      <CreatePollCard onConfirmed={refreshPolls} />

      <h2 className="section-title">Polls ({pollCount})</h2>
      {pollCount === 0 && (
        <p className="hint">No polls yet. Create one above.</p>
      )}
      <div className="poll-grid">
        {pollCount > 0 &&
          Array.from({ length: pollCount }, (_, i) => {
            const pollId = BigInt(i);
            const pr = pollsRead?.[i];
            const poll =
              pr?.status === "success"
                ? parsePoll(pr.result)
                : undefined;
            const vr = votedRead?.[i];
            const hasVoted =
              vr?.status === "success" ? (vr.result as boolean) : undefined;
            return (
              <PollCard
                key={i}
                pollId={pollId}
                contractAddress={DAOPOLL_ADDRESS}
                poll={poll}
                hasVoted={hasVoted}
                onConfirmed={refreshPolls}
              />
            );
          })}
      </div>
    </>
  );
}
