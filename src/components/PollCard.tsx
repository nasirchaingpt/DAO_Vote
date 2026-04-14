import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Address, isAddress } from "viem";
import { useEffect } from "react";
import { daopollAbi } from "../daopoll";

export type PollData = {
  description: string;
  options: readonly string[];
  votes: readonly bigint[];
  creator: Address;
  endTime: bigint;
};

type Props = {
  pollId: bigint;
  contractAddress: Address;
  poll: PollData | undefined;
  hasVoted: boolean | undefined;
  onConfirmed: () => void;
};

function formatAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function PollCard({
  pollId,
  contractAddress,
  poll,
  hasVoted,
  onConfirmed,
}: Props) {
  const { address, isConnected } = useAccount();

  const {
    data: hash,
    writeContract,
    isPending,
    reset,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess) return;
    onConfirmed();
    reset();
  }, [isSuccess, onConfirmed, reset]);

  if (poll === undefined) {
    return (
      <div className="card poll-card">
        <h3>Poll #{pollId.toString()}</h3>
        <p className="hint">Could not load poll data.</p>
      </div>
    );
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  const ended = poll.endTime !== 0n && now > poll.endTime;

  const vote = (optionIndex: number) => {
    if (!isConnected || !isAddress(contractAddress)) return;
    writeContract({
      address: contractAddress,
      abi: daopollAbi,
      functionName: "vote",
      args: [pollId, BigInt(optionIndex)],
    });
  };

  return (
    <div className="card poll-card">
      <h3>Poll #{pollId.toString()}</h3>
      <p className="poll-meta">
        Creator {formatAddr(poll.creator)}
        {poll.endTime === 0n ? (
          <> · no deadline</>
        ) : (
          <>
            {" "}
            · ends {new Date(Number(poll.endTime) * 1000).toLocaleString()}
          </>
        )}
      </p>
      {ended && <span className="badge badge-ended">Closed</span>}
      {hasVoted === true && (
        <span className="badge badge-voted" style={{ marginLeft: 8 }}>
          You voted
        </span>
      )}
      <p style={{ marginTop: "0.75rem" }}>{poll.description}</p>
      <div style={{ marginTop: "0.75rem" }}>
        {poll.options.map((label, i) => {
          const count = poll.votes[i] ?? 0n;
          const canVote =
            isConnected &&
            hasVoted === false &&
            !ended &&
            address !== undefined;
          return (
            <div key={i} className="option-row">
              <span>
                {label} — <strong>{count.toString()}</strong> votes
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!canVote || isPending || isConfirming}
                onClick={() => vote(i)}
              >
                Vote
              </button>
            </div>
          );
        })}
      </div>
      {writeError !== null && (
        <p className="err">{writeError.message.slice(0, 180)}</p>
      )}
      {isPending || isConfirming ? (
        <p className="hint" style={{ marginTop: 8 }}>
          Confirm in your wallet…
        </p>
      ) : null}
    </div>
  );
}
