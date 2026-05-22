// frontend/src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import type { PaymentMethod, CreateOrderRequest } from '../types/order';
import PaymentMethodSelect from '../components/shared/PaymentMethodSelect';
import orderApi from '../services/orderApi';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../contexts/AuthContext';
import { ProfileForm } from '../components/profile/ProfileForm';
import profileApi from '../services/profileApi';
import { AppLayout } from '../components/layout/AppLayout';

const CheckoutPage: React.FC = () => {
  const { cart, clearCart, refreshCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toasts, success, error, removeToast } = useToast();
  const { user, checkAuth } = useAuth();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [step, setStep] = useState<'profile' | 'order'>('order');

  const [formData, setFormData] = useState({
    shippingAddress: '',
    phoneNumber: '',
    paymentMethod: 'CASH' as PaymentMethod,
    shippingFee: 5.00
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      if (cart.items.length === 0) {
        navigate('/cart');
        return;
      }

      await loadProfile();
      refreshCart();
    };

    init();
  }, [user]);

  const loadProfile = async () => {
    // Check if profile is complete
    if (user && !user.profileCompleted) {
      setStep('profile');
      setShowProfileForm(true);
      return;
    }

    // If profile is complete, ensure we're on the order step
    if (user && user.profileCompleted) {
      setStep('order');
      setShowProfileForm(false);

      try {
        const profileData = await profileApi.getProfile();

        // Pre-fill form with profile data
        setFormData(prev => ({
          ...prev,
          shippingAddress: profileData.address || '',
          phoneNumber: profileData.phoneNumber || ''
        }));
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.shippingAddress.trim()) {
      newErrors.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setLoading(true);

    try {
      const request: CreateOrderRequest = {
        items: cart.items.map(item => ({
          bookId: item.bookId,
          quantity: item.quantity
        })),
        shippingAddress: formData.shippingAddress,
        phoneNumber: formData.phoneNumber,
        paymentMethod: formData.paymentMethod,
        shippingFee: formData.shippingFee
      };

      const order = await orderApi.createOrder(request);

      success('Đặt hàng thành công!');
      clearCart();

      // Navigate after a short delay to show the success message
      setTimeout(() => {
        navigate(`/orders/${order.id}`);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to create order', err);

      // Check if error is due to incomplete profile
      if (err.response?.status === 428 || err.response?.data?.message?.includes('profile')) {
        setStep('profile');
        setShowProfileForm(true);
        error('Vui lòng hoàn thiện thông tin cá nhân trước khi đặt hàng');
      } else {
        error(err.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cart.totalAmount + formData.shippingFee;

  // If user profile is complete, ensure we're not stuck in profile mode
  useEffect(() => {
    if (user?.profileCompleted && step === 'profile') {
      setStep('order');
      setShowProfileForm(false);
    }
  }, [user?.profileCompleted, step]);

  return (
    <AppLayout>
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="page-stack">
        {/* Page Header */}
        {step === 'order' && !showProfileForm && (
          <div className="app-card-muted app-card-pad">
            <h1 className="page-title">Thanh toán</h1>
            <p className="page-subtitle">
              Hoàn tất đơn hàng của bạn với {cart.items.length} sản phẩm
            </p>
          </div>
        )}

      {step === 'profile' && showProfileForm && (
        <div className="max-w-2xl mx-auto">
          <div className="app-card app-card-pad">
            <h2 className="section-title mb-2">
              Hoàn thiện thông tin
            </h2>
            <p className="section-subtitle mb-6">
              Chúng tôi cần thông tin giao hàng của bạn để xử lý đơn hàng.
            </p>
            <ProfileForm
              profile={null}
              isCheckout={true}
              onSuccess={async () => {
                await checkAuth();
                setShowProfileForm(false);
                setStep('order');
                await loadProfile();
                success('Hoàn thiện thông tin thành công! Bạn có thể đặt hàng ngay.');
              }}
            />
          </div>
        </div>
      )}

      {step === 'order' && !showProfileForm && (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Shipping & Payment Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Shipping Information */}
              <div className="app-card app-card-pad">
                <h2 className="section-title mb-4">
                  Thông tin giao hàng
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-2">
                      Địa chỉ giao hàng <span className="text-error">*</span>
                    </label>
                    <textarea
                      value={formData.shippingAddress}
                      onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                      rows={3}
                      placeholder="Nhập địa chỉ giao hàng đầy đủ..."
                      className={`w-full px-3 py-2 text-[15px] border rounded-button focus:outline-none focus:border-primary focus:shadow-input-focus ${
                        errors.shippingAddress
                          ? 'border-error'
                          : 'border-primary/30'
                      }`}
                    />
                    {errors.shippingAddress && (
                      <p className="text-sm text-error mt-1">{errors.shippingAddress}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="Nhập số điện thoại của bạn..."
                      className={`w-full px-3 py-2 text-[15px] border rounded-button focus:outline-none focus:border-primary focus:shadow-input-focus ${
                        errors.phoneNumber
                          ? 'border-error'
                          : 'border-primary/30'
                      }`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-error mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="app-card app-card-pad">
                <h2 className="section-title mb-4">
                  Phương thức thanh toán
                </h2>
                <PaymentMethodSelect
                  value={formData.paymentMethod}
                  onChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  required
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="app-card app-card-pad sticky top-20">
                <h2 className="section-title mb-4">
                  Tóm tắt đơn hàng
                </h2>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {cart.items.map((item) => (
                    <div key={item.bookId} className="flex justify-between text-[15px]">
                      <span className="text-gray-600 flex-1">
                        {item.title} × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        {item.subtotal.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2 mb-4">
                  <div className="flex justify-between text-[15px] text-gray-600">
                    <span>Tạm tính</span>
                    <span>{cart.totalAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="flex justify-between text-[15px] text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span>{formData.shippingFee.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="price-tag">{totalAmount.toLocaleString('vi-VN')}<span className="text-sm font-normal">₫</span></span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-buy w-full py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Đặt hàng
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Bằng việc đặt hàng, bạn đồng ý với điều khoản và điều kiện của chúng tôi
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
      </div>
    </AppLayout>
  );
};

export default CheckoutPage;
