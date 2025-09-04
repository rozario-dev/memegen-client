import type { FC } from "react";
import { CREDIT_COSTS, TIER_CONFIT, USER_TIER_DESCRIPTIONS, USER_TIER_DESCRIPTIONS_MODIFY, USER_TIER_LABELS, USER_TIER_LABELS_MODIFY, type UserTierType } from "../../lib/constants";

export interface ModelSelectorProps {
    selectedTier: UserTierType;
    setSelectedTier: (tier: UserTierType) => void;
    action: 'create' | 'modify';
}

export const ModelSelector: FC<ModelSelectorProps> = ({ selectedTier, setSelectedTier, action }) => {
    return(
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
            <div className="flex items-center mb-4">
            <span className="text-2xl mr-2">🎯</span>
            <h3 className="text-lg font-semibold text-gray-900">
                Choose Model Tier
            </h3>
            </div>
            <div className={`grid ${action === "modify" ? "grid-cols-2" : "grid-cols-4"} gap-2`}>
            {Object.entries(action === "modify" ? USER_TIER_LABELS_MODIFY : USER_TIER_LABELS).map(([tier, label]) => {
                const isSelected = selectedTier === tier;
                const credits = CREDIT_COSTS[tier as UserTierType];
                const tierConfig = TIER_CONFIT[tier as UserTierType];
                return (
                <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier as UserTierType)}
                    className={`relative p-4 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 cursor-pointer ${
                    isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    {/* Selection indicator */}
                    {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                    </div>
                    )}
                    
                    {/* Tier icon */}
                    <div className="text-lg mb-1">{tierConfig}</div>
                    
                    {/* Tier name */}
                    <div className="text-sm font-medium text-gray-800">{label}</div>
                    
                    {/* Tier description */}
                    <div className="text-xs text-gray-400 mt-1">
                    {action === "modify" ? USER_TIER_DESCRIPTIONS_MODIFY[tier as UserTierType] : USER_TIER_DESCRIPTIONS[tier as UserTierType]}
                    </div>

                    {/* Credits */}
                    <div className="text-xs text-gray-500 mt-1">
                    {credits} credit{credits as number > 1 ? 's' : ''}
                    </div>
                </button>
                );
            })}
            </div>
        </div>
    )
}

