import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import orderApi from '../services/orderApi';
import type { OrderDetail } from '../types/order';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/common/Toast';

export const PaymentSimulationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, success, error, removeToast } = useToast();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<'CREDIT_CARD' | 'BANK_TRANSFER' | 'E_WALLET'>('CREDIT_CARD');
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Credit Card Form
  const [cardNo, setCardNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // OTP Modal
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id]);

  const fetchOrder = async (orderId: string) => {
    try {
      const data = await orderApi.getOrderById(orderId);
      if (data.paymentStatus === 'PAID') {
        success('Đơn hàng này đã được thanh toán');
        setTimeout(() => navigate(`/orders/${orderId}`), 1500);
        return;
      }
      setOrder(data);
    } catch (err) {
      console.error(err);
      error('Không thể tải thông tin đơn hàng');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    // Format card number with spaces every 4 digits
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNo(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvv(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (method === 'CREDIT_CARD') {
      if (cardNo.replace(/\s/g, '').length !== 16) {
        error('Số thẻ phải chứa đúng 16 chữ số');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        error('Hạn dùng không đúng định dạng MM/YY');
        return;
      }
      if (cvv.length !== 3) {
        error('Mã CVV phải chứa 3 chữ số');
        return;
      }
      if (!cardName.trim()) {
        error('Vui lòng nhập tên chủ thẻ');
        return;
      }
      // Show OTP modal for Credit Card
      setShowOtp(true);
    } else {
      // Direct payment for Bank Transfer & E-Wallet
      executePayment();
    }
  };

  const executePayment = async () => {
    if (!id || !order) return;
    setProcessing(true);
    setShowOtp(false);

    try {
      await orderApi.payOrder(id, {
        paymentMethod: method,
        accountNumber: method === 'CREDIT_CARD' ? cardNo.replace(/\s/g, '') : 'SIMULATED-ACC',
        cvv: method === 'CREDIT_CARD' ? cvv : undefined,
        otp: method === 'CREDIT_CARD' ? otpCode : undefined,
        simulateFailure: simulateFailure
      });

      success('Thanh toán thành công!');
      setTimeout(() => {
        navigate(`/orders/${id}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      error(err.response?.data?.message || 'Giao dịch thất bại. Thẻ bị từ chối.');
    } finally {
      setProcessing(false);
      setOtpCode('');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!order) return null;

  return (
    <AppLayout>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="app-card-muted app-card-pad mb-6 flex justify-between items-center">
          <div>
            <h1 className="page-title text-2xl font-bold">Cổng Thanh Toán Mô Phỏng</h1>
            <p className="page-subtitle text-sm text-gray-500">Mã đơn hàng: {order.orderCode}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 block">Số tiền cần thanh toán</span>
            <span className="text-2xl font-bold price-tag text-green-700">
              {order.totalAmount.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Method Selection Sidebar */}
          <div className="md:col-span-1 space-y-3">
            <button
              onClick={() => setMethod('CREDIT_CARD')}
              className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center gap-3 ${
                method === 'CREDIT_CARD'
                  ? 'border-primary bg-primary/5 font-semibold text-primary'
                  : 'border-border bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">💳</span>
              Thẻ tín dụng
            </button>

            <button
              onClick={() => setMethod('BANK_TRANSFER')}
              className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center gap-3 ${
                method === 'BANK_TRANSFER'
                  ? 'border-primary bg-primary/5 font-semibold text-primary'
                  : 'border-border bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">🏦</span>
              Chuyển khoản QR
            </button>

            <button
              onClick={() => setMethod('E_WALLET')}
              className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center gap-3 ${
                method === 'E_WALLET'
                  ? 'border-primary bg-primary/5 font-semibold text-primary'
                  : 'border-border bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">📱</span>
              Ví điện tử MoMo
            </button>
          </div>

          {/* Form / Interactive Area */}
          <div className="md:col-span-2">
            <div className="app-card app-card-pad bg-white shadow-md rounded-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {method === 'CREDIT_CARD' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Nhập thông tin thẻ</h3>

                    {/* Card Mockup Visual */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-xl aspect-[1.586/1] flex flex-col justify-between max-w-sm mx-auto relative overflow-hidden">
                      <div className="absolute right-4 top-4 text-2xl font-bold opacity-30 italic">VISA</div>
                      <div className="w-10 h-8 bg-yellow-400/90 rounded-md"></div>
                      <div className="text-xl font-mono tracking-widest my-4">
                        {cardNo || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between font-mono text-sm">
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase">Chủ thẻ</div>
                          <div>{cardName.toUpperCase() || 'TEN CHU THE'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase">Hạn dùng</div>
                          <div>{expiry || 'MM/YY'}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Số thẻ (16 chữ số)</label>
                      <input
                        type="text"
                        value={cardNo}
                        onChange={handleCardNumberChange}
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Hạn dùng (MM/YY)</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={handleExpiryChange}
                          placeholder="12/28"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mã CVV (3 chữ số)</label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={handleCvvChange}
                          placeholder="123"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Họ tên chủ thẻ</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                )}

                {method === 'BANK_TRANSFER' && (
                  <div className="space-y-4 text-center">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Chuyển khoản nhanh qua QR</h3>
                    <div className="border border-border p-4 rounded-xl bg-gray-50 inline-block">
                      {/* Fake QR generator */}
                      <svg width="180" height="180" viewBox="0 0 180 180" className="mx-auto">
                        <rect width="180" height="180" fill="white" />
                        {/* Outer corners */}
                        <rect x="10" y="10" width="40" height="40" fill="#111827" />
                        <rect x="20" y="20" width="20" height="20" fill="white" />
                        <rect x="130" y="10" width="40" height="40" fill="#111827" />
                        <rect x="140" y="20" width="20" height="20" fill="white" />
                        <rect x="10" y="130" width="40" height="40" fill="#111827" />
                        <rect x="20" y="140" width="20" height="20" fill="white" />
                        {/* Random QR noise blocks */}
                        <rect x="60" y="20" width="10" height="30" fill="#111827" />
                        <rect x="80" y="10" width="20" height="10" fill="#111827" />
                        <rect x="110" y="30" width="10" height="40" fill="#111827" />
                        <rect x="60" y="70" width="40" height="10" fill="#111827" />
                        <rect x="110" y="90" width="20" height="20" fill="#111827" />
                        <rect x="10" y="80" width="30" height="10" fill="#111827" />
                        <rect x="70" y="100" width="20" height="30" fill="#111827" />
                        <rect x="140" y="80" width="30" height="40" fill="#111827" />
                        <rect x="20" y="100" width="10" height="20" fill="#111827" />
                        <rect x="100" y="140" width="40" height="20" fill="#111827" />
                        <rect x="60" y="150" width="30" height="10" fill="#111827" />
                        {/* Center Logo mock */}
                        <rect x="75" y="75" width="30" height="30" fill="#006241" rx="4" />
                        <text x="90" y="95" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">
                          BMS
                        </text>
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600 max-w-sm mx-auto space-y-1">
                      <p>Quét mã bằng ứng dụng ngân hàng của bạn để thanh toán.</p>
                      <p className="font-semibold text-gray-800">Số tiền: {order.totalAmount.toLocaleString('vi-VN')}₫</p>
                      <p className="text-xs text-gray-500 font-mono">Nội dung chuyển khoản: {order.orderCode}</p>
                    </div>
                  </div>
                )}

                {method === 'E_WALLET' && (
                  <div className="space-y-4 text-center">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Ví điện tử MoMo</h3>
                    <div className="border border-pink-100 p-4 rounded-xl bg-pink-50/50 inline-block">
                      <span className="text-6xl">📱</span>
                    </div>
                    <div className="text-sm text-gray-600 max-w-sm mx-auto space-y-1">
                      <p>Mô phỏng thanh toán trực tuyến qua ứng dụng ví điện tử MoMo.</p>
                      <p className="font-semibold text-pink-600">Số tiền: {order.totalAmount.toLocaleString('vi-VN')}₫</p>
                    </div>
                  </div>
                )}

                {/* Simulation Mode Selector */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded"
                    />
                    <div className="text-left">
                      <span className="text-sm font-semibold text-amber-900 block">Kích hoạt Mô Phỏng Giao Dịch Thất Bại</span>
                      <span className="text-xs text-amber-700 block">
                        Chọn tùy chọn này để test trường hợp thẻ bị từ chối hoặc giao dịch lỗi.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex-1 py-3 text-center border rounded-xl hover:bg-gray-50 transition font-medium"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 py-3 bg-[#006241] text-white rounded-xl hover:bg-[#004d33] transition font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Đang xác thực...
                      </>
                    ) : (
                      'Xác nhận thanh toán'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <span className="text-4xl">🔐</span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">Mã Xác Thực OTP</h3>
              <p className="text-sm text-gray-500 mt-1">
                Một mã OTP đã được gửi đến số điện thoại đăng ký thẻ. Vui lòng nhập mã để hoàn tất thanh toán.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 6 chữ số (e.g. 123456)"
                  className="w-full px-4 py-3 border rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOtp(false);
                    setOtpCode('');
                  }}
                  className="flex-1 py-2.5 border rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={executePayment}
                  disabled={otpCode.length !== 6 || processing}
                  className="flex-1 py-2.5 bg-[#006241] hover:bg-[#004d33] text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  {processing ? 'Đang kiểm tra...' : 'Xác nhận OTP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PaymentSimulationPage;
