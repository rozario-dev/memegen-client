import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PLANS } from '../../lib/constants';
import type { PricingPlan } from '../../lib/types';

export const Account: React.FC = () => {
  const { user, quota, loading, refreshQuota, solanaWalletAddress } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(PLANS[1]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const userId = user?.id || '';
  const email = user?.email || '';

  useEffect(() => {
    // auto refresh quota on mount (optional)
    // void refreshQuota();
  }, [refreshQuota]);

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

  const handleRecharge = () => {
    if (!selectedPlan) return;
    // TODO: integrate real recharge url when provided
    // For now show a placeholder action
    alert(`Recharge link will be provided later. You selected $${selectedPlan.usd}, total ${selectedPlan.total} credits`);
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

        {/* Profile + Quota */}
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

          {/* Quota */}
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl md:p-6 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quota</h2>
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

        {/* Recharge plans */}
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
                    {/* <div>credits: <span className="font-medium text-gray-900">{plan.credit}</span></div>
                    <div>bonus: <span className="font-medium text-gray-900">{plan.bonus}</span></div> */}
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
              disabled={!selectedPlan}
            >Top up</button>
          </div>
        </div>

        {/* Recharge records */}
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl md:p-6 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Top-up Records</h2>
          <div className="rounded-lg border border-dashed border-gray-300 md:p-6 p-4 text-center text-gray-500">
            No top-up records yet (will appear after the top-up link is provided)
          </div>
        </div>
      </div>
    </div>
  );
};