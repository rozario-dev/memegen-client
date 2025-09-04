import React, { useMemo, useState } from 'react';
import { STYLES } from '../../lib/constants';

interface StyleSelectorProps {
  onSelect: (style: { name: string; description: string }) => void;
  className?: string;
  label?: string;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ onSelect, className = '', label = 'Select Style' }) => {
  const [selectedId, setSelectedId] = useState<number | ''>('');

  const styleMap = useMemo(() => {
    const map = new Map<number, { name: string; description: string; name_cn?: string }>();
    STYLES.forEach((s: any) => map.set(s.id, { name: s.name, description: s.description, name_cn: s.name_cn }));
    return map;
  }, []);

  const selected = typeof selectedId === 'number' ? styleMap.get(selectedId) : undefined;

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    setSelectedId(val === '' ? '' : Number(val));
    if (val !== '') {
      const st = styleMap.get(Number(val));
      if (st) onSelect({ name: st.name, description: st.description });
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={selectedId}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="">-- Choose a style --</option>
        {STYLES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {selected && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-200">
          <div className="font-semibold">{selected.name}</div>
          <div className="mt-1">{selected.description}</div>
        </div>
      )}
    </div>
  );
};