import React from 'react';
import { X, Check, LayoutGrid, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { WIDGET_REGISTRY, getOrderedWidgets } from './widgetRegistry';

/**
 * Widget Selector Modal
 * Allows users to select and reorder widgets on Dashboard
 */
const WidgetSelector = ({ isOpen, onClose, enabledWidgets, onToggleWidget, onReorderWidgets }) => {
    if (!isOpen) return null;

    const allWidgets = getOrderedWidgets();

    // Get enabled widgets in their current order, then disabled ones
    const enabledOrdered = enabledWidgets
        .map(id => WIDGET_REGISTRY[id])
        .filter(Boolean);

    const disabledWidgets = allWidgets.filter(w => !enabledWidgets.includes(w.id));

    const handleMoveUp = (widgetId) => {
        const index = enabledWidgets.indexOf(widgetId);
        if (index > 0) {
            const newOrder = [...enabledWidgets];
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
            onReorderWidgets(newOrder);
        }
    };

    const handleMoveDown = (widgetId) => {
        const index = enabledWidgets.indexOf(widgetId);
        if (index < enabledWidgets.length - 1) {
            const newOrder = [...enabledWidgets];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            onReorderWidgets(newOrder);
        }
    };

    const renderWidgetItem = (widget, isEnabled, showReorder = false, index = 0, total = 0) => {
        const Icon = widget.icon;

        return (
            <div
                key={widget.id}
                className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${isEnabled
                        ? 'bg-indigo-500/10 border-indigo-500/50'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
            >
                {/* Reorder Controls (only for enabled widgets) */}
                {showReorder && (
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => handleMoveUp(widget.id)}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleMoveDown(widget.id)}
                            disabled={index === total - 1}
                            className={`p-1 rounded ${index === total - 1 ? 'text-slate-600' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Widget Icon */}
                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                    <Icon className="w-5 h-5" />
                </div>

                {/* Widget Info */}
                <div className="flex-1 min-w-0">
                    <div className={`font-medium ${isEnabled ? 'text-white' : 'text-slate-300'}`}>
                        {widget.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                        {widget.description}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => onToggleWidget(widget.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isEnabled
                            ? 'bg-indigo-500 border-indigo-500 hover:bg-indigo-600'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                >
                    {isEnabled && <Check className="w-4 h-4 text-white" />}
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <LayoutGrid className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Widget Yönetimi</h2>
                            <p className="text-xs text-slate-400">Seçin ve sıralayın</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Widget Lists */}
                <div className="flex-1 overflow-y-auto">
                    {/* Enabled Widgets (Reorderable) */}
                    {enabledOrdered.length > 0 && (
                        <div className="p-4 border-b border-slate-800">
                            <div className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
                                <GripVertical className="w-3 h-3" />
                                AKTİF WIDGET'LAR (sıralayabilirsiniz)
                            </div>
                            <div className="space-y-2">
                                {enabledOrdered.map((widget, index) =>
                                    renderWidgetItem(widget, true, true, index, enabledOrdered.length)
                                )}
                            </div>
                        </div>
                    )}

                    {/* Disabled Widgets */}
                    {disabledWidgets.length > 0 && (
                        <div className="p-4">
                            <div className="text-xs font-medium text-slate-400 mb-3">
                                MEVCUT WIDGET'LAR
                            </div>
                            <div className="space-y-2">
                                {disabledWidgets.map(widget => renderWidgetItem(widget, false))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Tamam
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WidgetSelector;
