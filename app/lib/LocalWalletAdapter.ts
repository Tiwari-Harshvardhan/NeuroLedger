import {
  BaseWalletAdapter,
  WalletConnectionError,
  WalletNotConnectedError,
  WalletPublicKeyError,
  WalletReadyState,
  WalletSignTransactionError,
  WalletName,
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction, Keypair, SendOptions, VersionedTransaction } from '@solana/web3.js';
import { nacl } from '@coral-xyz/anchor';

export class LocalWalletAdapter extends BaseWalletAdapter {
  readonly name = 'Local Test Wallet' as WalletName<'Local Test Wallet'>;
  readonly url = 'http://localhost';
  readonly icon =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iIzA4OTFiMiIvPjx0ZXh0IHg9IjI0IiB5PSIyOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj5MPC90ZXh0Pjwvc3ZnPg==';
  readonly supportedTransactionVersions = null;

  private _connecting = false;
  private _wallet: Keypair | null = null;
  private _publicKey: PublicKey | null = null;

  constructor() {
    super();
    this._loadOrCreateWallet();
  }

  private _loadOrCreateWallet() {
    try {
      const stored = localStorage.getItem('local_wallet_keypair');
      if (stored) {
        const secret = JSON.parse(stored) as number[];
        this._wallet = Keypair.fromSecretKey(new Uint8Array(secret));
        this._publicKey = this._wallet.publicKey;
        console.log('[LocalWalletAdapter] Loaded stored wallet:', this._publicKey.toString());
      } else {
        this._wallet = Keypair.generate();
        this._publicKey = this._wallet.publicKey;
        localStorage.setItem('local_wallet_keypair', JSON.stringify(Array.from(this._wallet.secretKey)));
        console.log('[LocalWalletAdapter] Created new local wallet:', this._publicKey.toString());
      }
    } catch (error) {
      console.error('[LocalWalletAdapter] Failed to load/create wallet:', error);
    }
  }

  get publicKey(): PublicKey {
    if (!this._publicKey) throw new WalletPublicKeyError();
    return this._publicKey;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return !!this._wallet && !!this._publicKey;
  }

  get readyState(): WalletReadyState {
    return WalletReadyState.Installed;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected) return;
      this._connecting = true;

      if (!this._wallet || !this._publicKey) {
        this._loadOrCreateWallet();
      }

      if (!this._wallet || !this._publicKey) {
        throw new WalletConnectionError('Failed to initialize local wallet');
      }

      this.emit('connect', this._publicKey);
    } catch (error: any) {
      this.emit('error', new WalletConnectionError(error?.message, error));
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this._wallet) {
      this._wallet = null;
      this._publicKey = null;
      this.emit('disconnect');
    }
  }

  async sendTransaction(
    transaction: VersionedTransaction | Transaction,
    connection: any,
    options?: SendOptions
  ): Promise<string> {
    try {
      if (!this._wallet) throw new WalletNotConnectedError();
      
      if (transaction instanceof VersionedTransaction) {
        transaction.sign([this._wallet]);
      } else {
        transaction.sign(this._wallet);
      }

      const rawTransaction = transaction instanceof VersionedTransaction 
        ? transaction.serialize() 
        : transaction.serialize();
      
      const txid = await connection.sendRawTransaction(rawTransaction, options);
      return txid;
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this._wallet) throw new WalletNotConnectedError();
      transaction.sign(this._wallet);
      return transaction;
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    try {
      if (!this._wallet) throw new WalletNotConnectedError();
      return transactions.map((tx) => {
        tx.sign(this._wallet!);
        return tx;
      });
    } catch (error: any) {
      throw new WalletSignTransactionError(error?.message, error);
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      if (!this._wallet) throw new WalletNotConnectedError();
      const signature = nacl.sign.detached(message, this._wallet.secretKey);
      return signature;
    } catch (error: any) {
      throw new Error(`Sign message error: ${error?.message}`);
    }
  }
}
