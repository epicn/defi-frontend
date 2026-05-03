import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import ERC20_ABI from './abi/ERC20Token.json';
import VAULT_ABI from './abi/Vault.json';

const FT_ADDRESS = '0x78661E5c4b50D20F4DFb9a212025b6DaBcc50E4c';
const VAULT_ADDRESS = '0xCe1eFDC55B79290d0D0E379126CAbb51eaE616B6';

function App() {
  const [account, setAccount] = useState(null);
  const [ftBalance, setFtBalance] = useState('0');
  const [vaultBalance, setVaultBalance] = useState('0');
  const [isMember, setIsMember] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [status, setStatus] = useState('');

  async function connectWallet() {
  if (!window.ethereum) {
    setStatus('MetaMask not installed');
    return;
  }
  await window.ethereum.request({
    method: 'wallet_requestPermissions',
    params: [{ eth_accounts: {} }],
  });
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  setAccount(accounts[0]);
}

  async function refreshBalances() {
    if (!account) return;
    const provider = new BrowserProvider(window.ethereum);
    const ft = new Contract(FT_ADDRESS, ERC20_ABI, provider);
    const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, provider);

    const ftBal = await ft.balanceOf(account);
    const vaultBal = await vault.balanceOf(account);
    const memberBal = await vault._balanceOfmembershipToken(account);

    setFtBalance(formatUnits(ftBal, 18));
    setVaultBalance(formatUnits(vaultBal, 18));
    setIsMember(memberBal > 0n);
  }

  useEffect(() => {
    refreshBalances();
  }, [account]);

  async function handleDeposit() {
    try {
      setStatus('Approving...');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const ft = new Contract(FT_ADDRESS, ERC20_ABI, signer);
      const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const amount = parseUnits(depositAmount, 18);
      const approveTx = await ft.approve(VAULT_ADDRESS, amount);
      await approveTx.wait();

      setStatus('Depositing...');
      const depositTx = await vault.deposit(amount);
      await depositTx.wait();

      setStatus('Deposit successful');
      setDepositAmount('');
      refreshBalances();
    } catch (err) {
      setStatus('Error');
    }
  }

  async function handleWithdraw() {
    try {
      setStatus('Withdrawing...');
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = new Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const shares = parseUnits(withdrawAmount, 18);
      const tx = await vault.withdraw(shares);
      await tx.wait();

      setStatus('Withdraw successful');
      setWithdrawAmount('');
      refreshBalances();
    } catch (err) {
      setStatus('Error');
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: "'Inconsolata', monospace", padding: 20}}>
      <h1>🍊 Orange (ORG) Vault</h1>

      {!account ? (
        <button onClick={connectWallet} style={{ padding: '10px 20px', fontSize: 16 }}>
          Connect Wallet
        </button>
      ) : (
        <>

          <div style={{ textAlign: 'left', display: 'inline-block', margin: ' 0 auto 20px', padding: 20}}>
          <p><strong>Account:</strong> {account.slice(0, 7)}...{account.slice(-5)}</p>
          <p><strong>Token (ORG) Balance:</strong> {ftBalance}</p>
          <p><strong>Vault Token Balance:</strong> {vaultBalance}</p>
          <p><strong>Governance Member:</strong> {isMember ? 'Yes' : 'No'}</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button onClick={connectWallet} style={{ marginRight: 10 }}>
            Switch Account
          </button>
          <button onClick={refreshBalances}>
            ↻
          </button>
          </div>

          <h3>Deposit</h3>
          <input
            type="text"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="# of tokens to deposit"
            style={{ padding: 8, width: 200 }}
          />
          <button onClick={handleDeposit} style={{ marginLeft: 10, padding: 8 }}>
            Deposit
          </button>

          <h3>Withdraw</h3>
          <input
            type="text"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="# of shares to withdraw"
            style={{ padding: 8, width: 200 }}
          />
          <button onClick={handleWithdraw} style={{ marginLeft: 10, padding: 8 }}>
            Withdraw
          </button>

          <p>{status}</p>
        </>
      )}
    </div>
  );
}

export default App;
