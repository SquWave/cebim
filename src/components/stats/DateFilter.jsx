import React, { useState, useEffect } from 'react';
import { Calendar, History } from 'lucide-react';

const DateFilter = ({ filter, onFilterChange }) => {
    const [activeGroup, setActiveGroup] = useState('calendar'); // 'calendar' or 'rolling'

    const calendarFilters = [
        { id: 'today', label: 'Bugün' },
        { id: 'week', label: 'Bu Hafta' },
        { id: 'month', label: 'Bu Ay' },
        { id: 'year', label: 'Bu Yıl' },
        { id: 'custom', label: 'Özel' }
    ];

    const rollingFilters = [
        { id: '7days', label: '7 Gün' },
        { id: '30days', label: '30 Gün' },
        { id: '3months', label: '3 Ay' },
        { id: '6months', label: '6 Ay' },
        { id: '1year', label: '1 Yıl' }
    ];

    // Auto-switch group if external filter changes
    useEffect(() => {
        if (rollingFilters.find(f => f.id === filter)) {
            setActiveGroup('rolling');
        } else if (calendarFilters.find(f => f.id === filter)) {
            setActiveGroup('calendar');
        }
    }, [filter]);

    const currentFilters = activeGroup === 'calendar' ? calendarFilters : rollingFilters;

    return (
        <div className="space-y-3">
            {/* Group Tabs */}
            <div className="flex p-1 bg-slate-900/50 rounded-lg w-fit border border-slate-800">
                <button
                    onClick={() => setActiveGroup('calendar')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeGroup === 'calendar'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Calendar className="w-3.5 h-3.5" />
                    Takvim
                </button>
                <button
                    onClick={() => setActiveGroup('rolling')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeGroup === 'rolling'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <History className="w-3.5 h-3.5" />
                    Geçmiş
                </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {currentFilters.map(f => (
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
        </div>
    );
};

export default DateFilter;
