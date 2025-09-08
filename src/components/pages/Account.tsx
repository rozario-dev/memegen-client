import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PLANS } from '../../lib/constants';
import type { PricingPlan } from '../../lib/types';
import { apiService } from '../../lib/api';
import type { PaymentCreateResponse, PaymentRecord } from '../../lib/types';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export const Account: React.FC = () => {
  const { user, quota, loading, refreshQuota, solanaWalletAddress, isSolanaAuth } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(PLANS[1]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentCreateResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [payError, setPayError] = useState<string | null>(null);

  const [records, setRecords] = useState<PaymentRecord[] | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { connection } = useConnection();
  const wallet = useWallet();

  const userId = user?.id || '';
  const email = user?.email || '';

  useEffect(() => {
    // auto refresh quota on mount (optional)
    // void refreshQuota();
    void loadRecords();
  }, [refreshQuota, page]);

  const loadRecords = async () => {
    if (!user) return;
    try {
      setRecordsLoading(true);
      setRecordsError(null);
      const offset = (page - 1) * PAGE_SIZE;
      const list = await apiService.getPaymentRecords(PAGE_SIZE, offset);
      setRecords(list);
    } catch (e: any) {
      console.error('Failed to load payment records', e);
      setRecordsError(e?.message || 'Failed to load records');
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 1500);
    } catch (e) {
      console.error('Copy failed', e);
      alert('Copy failed, please copy manually');
    }
  };

  const openTopupModal = async () => {
    if (!selectedPlan) return;
    if (!isSolanaAuth) {
      alert('Only Solana wallet top-up is supported. Please login with Solana.');
      return;
    }
    setCreatingPayment(true);
    setPayError(null);
    try {
      const orderDesc = `Top up ${selectedPlan.usd} USD`;
      const info = await apiService.createPayment(selectedPlan.usd, 'sol', orderDesc);
      setPaymentInfo(info);
      // Generate QR for solana: URI with amount param for better wallet UX.
      const { toDataURL } = (await import('qrcode')) as any;
      const params = new URLSearchParams();
      if (info.pay_amount) params.set('amount', String(info.pay_amount));
      const uri = `solana:${info.pay_address}?${params.toString()}`;
      const dataUrl = await toDataURL(uri, { margin: 1, width: 256 });
      setQrDataUrl(dataUrl);
      setModalOpen(true);
    } catch (e: any) {
      console.error('Create payment failed', e);
      alert(e?.message || e?.detail || 'Create payment failed');
    } finally {
      setCreatingPayment(false);
    }
  };

  const tryPayNow = async () => {
    if (!paymentInfo) return;
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setPayError('Wallet not connected. Please connect your Solana wallet.');
      return;
    }
    setPayError(null);
    setPaying(true);
    try {
      // Validate recipient address
      const to = new PublicKey(paymentInfo.pay_address);
      // Use ceil to avoid underpaying due to floating rounding (ensure >= required lamports)
      const lamports = Math.ceil(paymentInfo.pay_amount * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: to,
          lamports,
        })
      );
      // Align commitment between preflight and blockhash to reduce mismatch errors
      const latest = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = latest.blockhash;
      tx.feePayer = wallet.publicKey;

      const sig = await wallet.sendTransaction(tx, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });
      // Wait for confirmation
      const conf = await connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed');
      if (conf?.value?.err) {
        throw new Error(`Transaction confirmed with error: ${JSON.stringify(conf.value.err)}`);
      }

      // After on-chain success, start a 5s countdown to allow backend/IPN to process
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // close modal and refresh quota + records
            setModalOpen(false);
            setPaymentInfo(null);
            setQrDataUrl(null);
            void refreshQuota();
            void loadRecords();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      console.error('Pay now failed', e);
      const net = (import.meta as any).env?.VITE_SOLANA_NETWORK === 'mainnet' ? 'mainnet' : 'devnet';
      setPayError((e?.message || 'Payment failed or cancelled') + ` (Network: ${net})`);
    } finally {
      setPaying(false);
    }
  };

  const handleRecharge = () => {
    void openTopupModal();
  };

  if (loading) {
    return (
      <div className="pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg md:p-6 p-4">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Login Required</h3>
            <p className="text-yellow-700">Please sign in to view your account information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👤 Account</h1>
          <p className="text-gray-600">View your profile, quota, and top up</p>
        </div>

        {/* Profile + Credits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Profile */}
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl md:p-6 p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">User ID</div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm break-all flex-1">{userId}</code>
                  <button
                    onClick={handleCopyUserId}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                    aria-label="Copy user ID"
                  >
                    {copyStatus === 'copied' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">{!solanaWalletAddress ? "Email" : "Solana Address"}</div>
                <div className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-800 text-sm break-all">
                  {!solanaWalletAddress ? email : solanaWalletAddress}
                </div>
              </div>
            </div>
          </div>

          {/* Credits */}
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl md:p-6 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Credits</h2>
              <button
                onClick={() => void refreshQuota()}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
              >Refresh</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Total</div>
                <div className="text-xl font-semibold text-gray-900">{quota?.total_quota ?? 0}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Used</div>
                <div className="text-xl font-semibold text-gray-900">{quota?.used_quota ?? 0}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">Remaining</div>
                <div className="text-xl font-semibold text-gray-900">{quota?.remaining_quota ?? 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top up section (Solana only) */}
        {!isSolanaAuth ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg md:p-6 p-4 mb-8">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Top-up not available</h3>
            <p className="text-yellow-700">Only Solana wallet top-up is supported currently. Please login with Solana to purchase credits.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl md:p-6 p-4 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top up</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {PLANS.map((plan) => {
                const selected = selectedPlan?.usd === plan.usd;
                return (
                  <button
                    key={plan.usd}
                    onClick={() => setSelectedPlan(plan)}
                    className={`cursor-pointer text-left rounded-xl border p-4 transition-all ${selected ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold text-gray-900">${plan.usd}</div>
                      {plan.bonus > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Bonus +{plan.bonus}</span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <div>Credits: <span className="font-medium text-gray-900">{plan.total}</span></div>
                      <div>Max: <span className="font-medium text-gray-900">{plan.total} images</span></div>
                      <div className="text-xs text-gray-500">Avg: ${(plan.avgPrice * 100).toFixed(2)} / 100 credit</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleRecharge}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedPlan || creatingPayment}
              >{creatingPayment ? 'Creating...' : 'Top up'}</button>
            </div>
          </div>
        )}

        {/* Top-up Records */}
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl md:p-6 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Top-up Records</h2>
            <button
              onClick={() => void loadRecords()}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
              disabled={recordsLoading}
              aria-label="Refresh Top-up Records"
            >{recordsLoading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
          {recordsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 md:p-6 p-4 text-red-700">{recordsError}</div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4">Payment ID</th>
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">USD</th>
                      <th className="py-2 pr-4">SOL Payed</th>
                      <th className="py-2 pr-4">Credit</th>
                      <th className="py-2 pr-4">Status</th>
                      {/* <th className="py-2 pr-4">Processed</th> */}
                      {/* <th className="py-2 pr-4">Order</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {recordsLoading ? (
                      Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <tr key={`sk-${i}`} className="border-t border-gray-100">
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-32" /></td>
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16" /></td>
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-10" /></td>
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-12" /></td>
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-40" /></td>
                          <td className="py-2 pr-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24" /></td>
                        </tr>
                      ))
                    ) : records && records.length > 0 ? (
                      <>
                        {records?.map((r) => (
                          <tr key={`${r.payment_id}`} className="border-t border-gray-100">
                            <td className="py-2 pr-4">{r.payment_id}</td>
                            <td className="py-2 pr-4 text-gray-700">{new Date(r.created_at).toLocaleString()}</td>
                            <td className="py-2 pr-4">{r.price_amount} {r.price_currency.toUpperCase()}</td>
                            <td className="py-2 pr-4">{r.pay_amount} {r.pay_currency.toUpperCase()}</td>
                            <td className="py-2 pr-4">
                              {(() => {
                                const parts = (r.order_id ?? '').split(':');
                                const val = parts.length >= 3 ? Number(parts[2]) : NaN;
                                return Number.isFinite(val) ? val : (r.credits ?? '-');
                              })()}
                            </td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded text-xs border ${r.payment_status === 'finished' ? 'bg-green-50 border-green-200 text-green-700' : r.payment_status === 'failed' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>{r.payment_status}</span>
                            </td>
                            {/* <td className="py-2 pr-4">{r.processed ? 'Yes' : 'No'}</td> */}
                            {/* <td className="py-2 pr-4 text-gray-700" title={r.order_id}>
                              {(() => {
                                const parts = (r.order_id ?? '').split(':');
                                const last = parts[parts.length - 1];
                                return last || r.order_id;
                              })()}
                            </td> */}
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, PAGE_SIZE - (records?.length ?? 0)) }).map((_, i) => (
                          <tr key={`ph-${i}`} className="border-t border-gray-100">
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <>
                        <tr className="border-t border-gray-100">
                          <td className="py-4 pr-4 text-gray-500 text-center" colSpan={8}>No top-up records yet</td>
                        </tr>
                        {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                          <tr key={`ph-empty-${i}`} className="border-t border-gray-100">
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                            <td className="py-2 pr-4 text-transparent">-</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={recordsLoading || page === 1}
                >Previous</button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <button
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={recordsLoading || (records !== null && records.length < PAGE_SIZE)}
                >Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && paymentInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !paying && setModalOpen(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-[95%] max-w-md p-6 border border-gray-200">
            <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" onClick={() => !paying && setModalOpen(false)} aria-label="Close">✕</button>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Pay with Solana</h3>
            <div className="space-y-3 mb-4">
              <div className="text-sm text-gray-700">Please pay <span className="font-semibold">{paymentInfo.price_amount} {paymentInfo.price_currency.toUpperCase()}</span>, which is <span className="font-semibold">{paymentInfo.pay_amount} {paymentInfo.pay_currency.toUpperCase()}</span>.</div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Pay to address</div>
                <div className="px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-800 text-xs break-all">{paymentInfo.pay_address}</div>
              </div>
              {qrDataUrl && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 border border-gray-200 rounded" />
                  {/* <a className="text-purple-600 text-sm hover:underline" href={solanaUri} target="_blank" rel="noreferrer">Open in wallet: {solanaUri}</a> */}
                </div>
              )}
            </div>

            {payError && <div className="mb-3 text-sm text-red-600">{payError}</div>}

            {countdown > 0 ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Payment sent. Waiting for processing... ({countdown}s)</div>
                <button disabled className="px-4 py-2 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">Processing...</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button onClick={() => void tryPayNow()} disabled={paying} className={`px-4 py-2 rounded-lg text-white transition-colors ${paying ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>{paying ? 'Paying...' : 'Pay now with wallet'}</button>
                <button onClick={() => setModalOpen(false)} disabled={paying} className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">Close</button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};