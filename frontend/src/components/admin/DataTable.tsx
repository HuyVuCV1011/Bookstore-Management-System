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
        <p className="text-sm font-semibold text-gray-800 dark:text-text-primary-dark">Không có dữ liệu phù hợp</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-text-primary-dark/60">Thử đổi từ khóa tìm kiếm hoặc thêm bản ghi mới.</p>
      </div>
    );
  }

  return (
    <div className="app-card dark:bg-gray-800 dark:border-gray-700">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead className="border-b border-border dark:border-gray-700 bg-bg-light dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-th text-left dark:text-text-primary-dark/60">
                {col.label.toUpperCase()}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="table-th text-right dark:text-text-primary-dark/60">THAO TÁC</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-gray-700 bg-white dark:bg-gray-800">
          {data.map((item, rowIndex) => {
            const rowKey = (item as { id?: string | number }).id ?? rowIndex;
            const customClassName = rowClassName ? rowClassName(item) : '';
            return (
            <tr key={rowKey} className={`transition hover:bg-bg-light dark:hover:bg-gray-700/50 ${customClassName}`}>
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {col.render ? col.render(item) : ((item as any)[col.key] ?? '-')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                  {onEdit && (
                    <button onClick={() => onEdit(item)} className="rounded-button border border-primary dark:border-primary/60 px-3 py-1.5 text-xs font-semibold text-primary dark:text-[#d4e9e2] transition hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white">
                      Sửa
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(item)} className="rounded-button border border-red-200 dark:border-red-900/50 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/30">
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
