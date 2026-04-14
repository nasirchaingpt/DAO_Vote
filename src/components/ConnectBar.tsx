import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";

export function ConnectBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const short =
    address === undefined
      ? ""
      : `${address.slice(0, 6)}…${address.slice(-4)}`;

  if (isConnected) {
    return (
      <div className="top-bar">
        <span className="address">
          {short} · chain {chainId}
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  const injected = connectors[0];
  return (
    <div className="top-bar">
      <button
        type="button"
        className="btn btn-primary"
        disabled={isPending || injected === undefined}
        onClick={() => {
          if (injected) connect({ connector: injected });
        }}
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </button>
    </div>
  );
}
