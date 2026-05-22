import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StaffLayout } from '../../components/staff/StaffLayout';
import { purchaseOrderApi } from '../../services/api/purchaseOrderApi';
import { supplierApi } from '../../services/api/supplierApi';
import BookSearchModal from '../../components/purchaseOrders/BookSearchModal';
import POItemRow from '../../components/purchaseOrders/POItemRow';
import type { CreatePurchaseOrderRequest } from '../../types/purchaseOrder';
import type { Book } from '../../types/book';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface POItemForm {
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

export const PurchaseOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItemForm[]>([]);

  // Suppliers list
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Book search modal
  const [showBookModal, setShowBookModal] = useState(false);

  // Load suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await supplierApi.getActive();
        console.log('Active suppliers response:', response.data);

        // Handle response - supplierApi.getActive returns array directly
        const suppliersList = Array.isArray(response.data) ? response.data : [];
        setSuppliers(suppliersList);
      } catch (err: any) {
        console.error('Failed to load suppliers', err);
        console.error('Error details:', err.response?.data);
        setSuppliers([]);
        setError('Không thể tải danh sách nhà cung cấp');
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Load PO data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchPO = async () => {
        try {
          const po = await purchaseOrderApi.getById(parseInt(id));

          if (po.status !== 'DRAFT') {
            setError('Chỉ có thể chỉnh sửa đơn hàng ở trạng thái Nháp');
            setTimeout(() => navigate(`/staff/purchase-orders/${id}`), 2000);
            return;
          }

          setSupplierId(po.supplierId);
          setExpectedDeliveryDate(po.expectedDeliveryDate || '');
          setNotes(po.notes || '');
          setItems(
            po.items.map((item) => ({
              bookId: item.bookId,
              bookTitle: item.bookTitle,
              bookIsbn: item.bookIsbn,
              quantity: item.quantityOrdered,
              unitCost: item.unitCost,
              notes: item.notes || '',
            }))
          );
        } catch (err: any) {
          setError(err.response?.data?.message || 'Không thể tải thông tin đơn hàng');
        } finally {
          setLoading(false);
        }
      };
      fetchPO();
    }
  }, [isEditMode, id, navigate]);

  const handleAddBook = (book: Book) => {
    // Check if book already added
    if (items.some((item) => item.bookId === book.id)) {
      alert('Sách này đã được thêm vào đơn hàng');
      return;
    }

    setItems([
      ...items,
      {
        bookId: book.id,
        bookTitle: book.title,
        bookIsbn: book.isbn || 'N/A',
        quantity: 1,
        unitCost: book.price * 0.8, // Default 80% of retail price
        notes: '',
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      setError('Vui lòng chọn nhà cung cấp');
      return;
    }

    if (items.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const requestData: CreatePurchaseOrderRequest = {
        supplierId: supplierId as number,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          notes: item.notes || undefined,
        })),
      };

      if (isEditMode && id) {
        await purchaseOrderApi.update(parseInt(id), requestData);
        alert('Cập nhật đơn mua hàng thành công!');
      } else {
        await purchaseOrderApi.create(requestData);
        alert('Tạo đơn mua hàng thành công!');
      }

      navigate('/staff/purchase-orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể lưu đơn hàng');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500">Đang tải...</div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Chỉnh sửa đơn mua hàng' : 'Tạo đơn mua hàng mới'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? 'Cập nhật thông tin đơn mua hàng'
              : 'Tạo đơn đặt hàng mới với nhà cung cấp'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Thông tin nhà cung cấp
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(parseInt(e.target.value) || '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  disabled={loadingSuppliers}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày giao dự kiến
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ghi chú cho đơn hàng..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Danh sách sản phẩm
              </h2>
              <button
                type="button"
                onClick={() => setShowBookModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Thêm sách
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                Chưa có sản phẩm nào. Nhấn "Thêm sách" để bắt đầu.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <POItemRow
                    key={index}
                    item={item}
                    index={index}
                    onUpdate={handleUpdateItem}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>
            )}

            {/* Total */}
            {items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">
                    {calculateTotal().toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/staff/purchase-orders')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || items.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo đơn'}
            </button>
          </div>
        </form>

        {/* Book Search Modal */}
        <BookSearchModal
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          onSelectBook={handleAddBook}
        />
      </div>
    </StaffLayout>
  );
};

export default PurchaseOrderFormPage;
