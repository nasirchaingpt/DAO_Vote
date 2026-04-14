import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { DAOPOLL_ADDRESS, daopollAbi } from "../daopoll";

type Props = {
  onConfirmed: () => void;
};

function minDateInputValue(): string {
  const d = new Date();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mo}-${day}`;
}

export function CreatePollCard({ onConfirmed }: Props) {
  const { isConnected } = useAccount();
  const [description, setDescription] = useState("");
  const [optionsRaw, setOptionsRaw] = useState("Yes, No, Abstain");
  const [endDate, setEndDate] = useState("");
  const [endTimePart, setEndTimePart] = useState("");
  const [deadlineError, setDeadlineError] = useState<string | null>(null);

  const minDate = useMemo(() => minDateInputValue(), []);

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess) return;
    onConfirmed();
    reset();
    setEndDate("");
    setEndTimePart("");
    setDeadlineError(null);
  }, [isSuccess, onConfirmed, reset]);

  const valid = isConnected;

  const resolveEndTimeUnix = (): { ok: true; endTime: bigint } | { ok: false; message: string } => {
    if (endDate.trim() === "") {
      return { ok: true, endTime: 0n };
    }
    const time = endTimePart.trim() === "" ? "23:59" : endTimePart.trim();
    const ms = new Date(`${endDate}T${time}`).getTime();
    if (Number.isNaN(ms)) {
      return { ok: false, message: "Invalid deadline date or time." };
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const endSec = Math.floor(ms / 1000);
    if (endSec <= nowSec) {
      return {
        ok: false,
        message: "Deadline must be in the future (contract rejects past times).",
      };
    }
    return { ok: true, endTime: BigInt(endSec) };
  };

  const submit = () => {
    if (!valid) return;
    reset();
    setDeadlineError(null);

    const options = optionsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) return;

    const end = resolveEndTimeUnix();
    if (!end.ok) {
      setDeadlineError(end.message);
      return;
    }

    writeContract({
      address: DAOPOLL_ADDRESS,
      abi: daopollAbi,
      functionName: "createPoll",
      args: [description, options, end.endTime],
    });
  };

  return (
    <div className="card">
      <h2>Create poll</h2>
      {!isConnected && (
        <p className="hint">Connect a wallet to create a poll on-chain.</p>
      )}
      <div className="field">
        <label htmlFor="desc">Description</label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are we voting on?"
        />
      </div>
      <div className="field">
        <label htmlFor="opts">Options (comma-separated)</label>
        <input
          id="opts"
          value={optionsRaw}
          onChange={(e) => setOptionsRaw(e.target.value)}
        />
        <p className="hint">At least two options, max 32.</p>
      </div>
      <div className="field deadline-field">
        <label htmlFor="end-date">Voting deadline (optional)</label>
        <div className="deadline-row">
          <input
            id="end-date"
            type="date"
            className="deadline-input"
            value={endDate}
            min={minDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <input
            id="end-time"
            type="time"
            className="deadline-input"
            value={endTimePart}
            step={60}
            onChange={(e) => setEndTimePart(e.target.value)}
            disabled={endDate.trim() === ""}
            aria-label="Deadline time (optional)"
          />
        </div>
        <p className="hint">
          Date opens the calendar. If you pick a date but no time,{" "}
          <strong>23:59</strong> local is used. Leave the date empty for no
          deadline.
        </p>
      </div>
      {deadlineError !== null && <p className="err">{deadlineError}</p>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!valid || isPending || isConfirming || description.trim() === ""}
        onClick={submit}
      >
        {isPending || isConfirming ? "Submitting…" : "Create poll"}
      </button>
      {writeError !== null && (
        <p className="err">{writeError.message.slice(0, 200)}</p>
      )}
      {isSuccess && (
        <p className="ok">Transaction confirmed. Poll list refreshed.</p>
      )}
    </div>
  );
}
