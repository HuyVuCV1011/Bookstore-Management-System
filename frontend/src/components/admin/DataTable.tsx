import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  rowClassName?: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  onEdit,
  onDelete,
  loading = false,
  rowClassName,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="app-empty-state">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="app-empty-state">
        <p className="text-sm font-semibold text-gray-800">Không có dữ liệu phù hợp</p>
        <p className="mt-1 text-sm text-gray-500">Thử đổi từ khóa tìm kiếm hoặc thêm bản ghi mới.</p>
      </div>
    );
  }

  return (
    <div className="app-card">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead className="border-b border-border bg-bg-light">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-th text-left">
                {col.label.toUpperCase()}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="table-th text-right">THAO TÁC</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">
          {data.map((item, rowIndex) => {
            const rowKey = (item as { id?: string | number }).id ?? rowIndex;
            const customClassName = rowClassName ? rowClassName(item) : '';
            return (
            <tr key={rowKey} className={`transition hover:bg-bg-light ${customClassName}`}>
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-4 text-sm text-gray-700">
                  {col.render ? col.render(item) : ((item as any)[col.key] ?? '-')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                  {onEdit && (
                    <button onClick={() => onEdit(item)} className="rounded-button border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white">
                      Sửa
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(item)} className="rounded-button border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                      Xóa
                    </button>
                  )}
                  </div>
                </td>
              )}
            </tr>
          );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
