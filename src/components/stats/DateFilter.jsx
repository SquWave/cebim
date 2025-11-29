import React from 'react';

const DateFilter = ({ filter, onFilterChange }) => {
    const filters = [
        { id: 'today', label: 'Bugün' },
        { id: 'week', label: 'Bu Hafta' },
        { id: 'month', label: 'Bu Ay' },
        { id: 'year', label: 'Bu Yıl' },
        { id: 'custom', label: 'Özel' }
    ];

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filters.map(f => (
                <button
                    key={f.id}
                    onClick={() => onFilterChange(f.id)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === f.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
};

export default DateFilter;
