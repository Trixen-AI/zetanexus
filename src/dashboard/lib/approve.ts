import { erc20Abi, type Address } from 'viem';
import { useConnection, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { CHAIN_ID } from '../config';

/**
 * A real ERC-20 approval on Robinhood Chain, from the connected wallet.
 * Reads the live balance and allowance, sends `approve(spender, amount)`,
 * and follows the transaction to its receipt. The dashboard stops at the
 * approval: the contract that pulls the funds does the rest.
 */
export function useApproval(token: Address, spender: Address | '', amount: bigint) {
  const { address, chainId } = useConnection();
  const owner = address as Address | undefined;
  const hasSpender = spender !== '';

  const balance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!owner, refetchInterval: 15_000 },
  });

  const allowance = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && hasSpender ? [owner, spender as Address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!owner && hasSpender, refetchInterval: 15_000 },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: write.data, chainId: CHAIN_ID, query: { enabled: !!write.data } });
  const { mutate: switchChain, isPending: switching } = useSwitchChain();

  const wrongChain = chainId !== undefined && chainId !== CHAIN_ID;
  const bal = balance.data ?? 0n;
  const allowed = allowance.data ?? 0n;
  const enough = amount > 0n && bal >= amount;
  const alreadyApproved = hasSpender && amount > 0n && allowed >= amount;

  const approve = () => {
    if (!hasSpender || amount <= 0n) return;
    if (wrongChain) {
      switchChain({ chainId: CHAIN_ID });
      return;
    }
    write.mutate(
      { address: token, abi: erc20Abi, functionName: 'approve', args: [spender as Address, amount], chainId: CHAIN_ID },
      { onSuccess: () => void allowance.refetch() },
    );
  };

  let stage: 'idle' | 'switch' | 'signing' | 'pending' | 'done' | 'error' = 'idle';
  if (wrongChain) stage = 'switch';
  if (write.isPending) stage = 'signing';
  else if (write.data && receipt.isLoading) stage = 'pending';
  else if (receipt.isSuccess) stage = 'done';
  else if (write.isError || receipt.isError) stage = 'error';

  const error = (write.error ?? receipt.error)?.message.split('\n')[0] ?? null;

  if (receipt.isSuccess && allowed < amount) void allowance.refetch();

  return {
    balance: bal,
    balanceLoaded: balance.data !== undefined,
    allowance: allowed,
    enough,
    alreadyApproved,
    hasSpender,
    stage,
    switching,
    txHash: write.data,
    error,
    approve,
    reset: write.reset,
  };
}
