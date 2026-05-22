import React from 'react';

interface POItemRowProps {
  item: {
    bookId: number;
    bookTitle: string;
    bookIsbn: string;
    quantity: number;
    unitCost: number;
    notes?: string;
  };
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  readOnly?: boolean;
}

export const POItemRow: React.FC<POItemRowProps> = ({
  item,
  index,
  onUpdate,
  onRemove,
  readOnly = false,
}) => {
  const lineTotal = item.quantity * item.unitCost;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{item.bookTitle}</h4>
          <p className="text-sm text-gray-500">ISBN: {item.bookIsbn}</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800 ml-4"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
            disabled={readOnly}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
            required
          />
        </div>

        {/* Unit Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá nhập (₫) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={item.unitCost}
            onChange={(e) => onUpdate(index, 'unitCost', parseFloat(e.target.value) || 0)}
            disabled={readOnly}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
            required
          />
        </div>

        {/* Line Total */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thành tiền
          </label>
          <input
            type="text"
            value={lineTotal.toLocaleString('vi-VN')}
            disabled
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 font-medium"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ghi chú
        </label>
        <input
          type="text"
          value={item.notes || ''}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
          disabled={readOnly}
          placeholder="Ghi chú cho sản phẩm này..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
        />
      </div>
    </div>
  );
};

export default POItemRow;
