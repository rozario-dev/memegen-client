import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

interface WalletSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: { name: string; publicKey?: string }) => void;
}

const readinessOrder = (state: WalletReadyState) => {
  switch (state) {
    case WalletReadyState.Installed:
      return 0;
    case WalletReadyState.Loadable:
      return 1;
    case WalletReadyState.NotDetected:
      return 2;
    case WalletReadyState.Unsupported:
    default:
      return 3;
  }
};

const readinessLabel = (state: WalletReadyState) => {
  switch (state) {
    case WalletReadyState.Installed:
      return 'Installed';
    case WalletReadyState.Loadable:
      return 'Loadable';
    case WalletReadyState.NotDetected:
      return 'Not detected';
    case WalletReadyState.Unsupported:
    default:
      return 'Unsupported';
  }
};

export const WalletSelectModal: React.FC<WalletSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { wallets, select } = useWallet();

  if (!isOpen) return null;

  const sorted = [...wallets].sort((a, b) => readinessOrder(a.readyState) - readinessOrder(b.readyState));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose a wallet</h3>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {sorted.map((w) => {
            const name = w.adapter.name;
            const icon = (w.adapter as any).icon as string | undefined;
            const rs = w.readyState;
            const disabled = rs === WalletReadyState.Unsupported;

            return (
              <button
                key={name}
                type="button"
                onClick={async () => {
                  console.log("Connecting...")
                  if (disabled) return;
                  select(name);
                  try {
                    await w.adapter.connect();
                  } catch (e) {
                    console.error('connect error', e);
                  }
                  onSelect?.({ name });
                  onClose();
                }}
                disabled={disabled}
                className="w-full flex items-center cursor-pointer justify-between px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {icon ? (
                    <img src={icon} alt="" className="w-6 h-6 rounded" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-emerald-400" />
                  )}
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{name}</div>
                    <div className="text-xs text-gray-500">{readinessLabel(rs)}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  {rs === WalletReadyState.NotDetected ? 'Install to use' : rs === WalletReadyState.Loadable ? 'Click to launch' : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};