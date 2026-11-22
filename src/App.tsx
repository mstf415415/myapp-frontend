import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(false); 

  // @@@@@@@@@@@@@@@@@@ استیت‌های محصولات و سبد خرید @@@@@@@@@@@@@@@@@@
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');

  // @@@@@@@@@@@@@@@@@@ استیت‌های سفارشات (کاربر و ادمین) @@@@@@@@@@@@@@@@@@
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState('products');

  // @@@@@@@@@@@@@@@@@@ استیت‌های پروفایل و آدرس‌ها @@@@@@@@@@@@@@@@@@
  const [profileData, setProfileData] = useState({ full_name: '', phone: '', email: '' });
  const [myAddresses, setMyAddresses] = useState<any[]>([]);
  const [newAddress, setNewAddress] = useState({ province: '', city: '', street: '', postal_code: '' });

  // @@@@@@@@@@@@@@@@@@ استیت‌های لاگین و پنل ادمین @@@@@@@@@@@@@@@@@@
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [adminProduct, setAdminProduct] = useState({ name: '', description: '', price: '', stock: '' });
  const [adminImage, setAdminImage] = useState<File | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'admin') setIsAdmin(true);
      } catch (e) { console.log(e); }
    }

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment') === 'verify') {
      const authority = queryParams.get('Authority');
      const status = queryParams.get('Status');
      const lastOrderId = localStorage.getItem('last_pay_order_id');
      
      if (status === 'OK' && authority && lastOrderId) {
        fetch(`http://127.0.0.1:8000/orders/${lastOrderId}/verify?authority=${authority}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (res.ok) {
            alert('🎉 پرداخت شما با موفقیت تایید شد!');
            window.history.replaceState({}, document.title, "/");
            setCurrentPage('my-orders');
            fetchMyOrders();
          } else { alert('خطا در تایید پرداخت'); window.history.replaceState({}, document.title, "/"); }
        });
      } else {
        alert('پرداخت ناموفق بود یا لغو شد.');
        window.history.replaceState({}, document.title, "/");
      }
    }
    fetchProducts();
  }, []);

  // @@@@@@@@@@@@@@@@@@ توابع دریافت اطلاعات @@@@@@@@@@@@@@@@@@
  const fetchProducts = () => {
    fetch(`http://127.0.0.1:8000/products/?search=${searchQuery}`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.log(err));
  };

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; 
    try {
      const res = await fetch('http://127.0.0.1:8000/carts/', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setCart(await res.json()); }
    } catch (e) { console.log(e); }
  };

  const fetchMyOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/orders/my-orders', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setMyOrders(await res.json()); }
    } catch (e) { console.log(e); }
  };

  const fetchAdminOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/orders/admin/all', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setAdminOrders(await res.json()); }
    } catch (e) { console.log(e); }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfileData({ full_name: data.full_name, phone: data.phone || '', email: data.email });
      }
    } catch (e) { console.log(e); }
  };

  const fetchMyAddresses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/orders/addresses/my', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setMyAddresses(await res.json()); }
    } catch (e) { console.log(e); }
  };

  // @@@@@@@@@@@@@@@@@@ توابع لاگین و پرداخت @@@@@@@@@@@@@@@@@@
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginData) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        setIsLoggedIn(true); 
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        setIsAdmin(payload.role === 'admin');
        setCurrentPage('home'); fetchCart(); 
      } else { alert('ایمیل یا رمز اشتباه است'); }
    } catch (e) { alert('خطا'); }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/orders/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ province: 'تهران', city: 'تهران', street: 'خیابان تست', postal_code: '1234567890' }) });
      const data = await res.json();
      if (res.ok) { alert(`🎉 سفارش ${data.order_id} ثبت شد!`); fetchCart(); setCurrentPage('my-orders'); fetchMyOrders(); }
    } catch (e) { alert('خطا'); }
  };

  const handlePayOrder = async (orderId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/orders/${orderId}/pay`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.payment_url) {
        localStorage.setItem('last_pay_order_id', orderId.toString());
        window.location.href = data.payment_url;
      } else { alert(data.detail || 'خطا در اتصال به درگاه بانک'); }
    } catch (e) { alert('خطا'); }
  };

  // @@@@@@@@@@@@@@@@@@ توابع سبد خرید @@@@@@@@@@@@@@@@@@
  const addToCart = async (product: any) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('ابتدا وارد شوید.'); setCurrentPage('login'); return; }
    try {
      const res = await fetch('http://127.0.0.1:8000/carts/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      if (res.ok) { fetchCart(); }
    } catch (e) { alert('خطا'); }
  };

  const removeFromCart = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/carts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { fetchCart(); }
    } catch (e) { console.error(e); }
  };

  const updateQuantity = async (id: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) { removeFromCart(id); return; }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/carts/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) { fetchCart(); }
    } catch (e) { console.error(e); }
  };

  // @@@@@@@@@@@@@@@@@@ توابع پروفایل و آدرس @@@@@@@@@@@@@@@@@@
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ full_name: profileData.full_name, phone: profileData.phone })
      });
      if (res.ok) alert('🎉 پروفایل با موفقیت به‌روزرسانی شد!');
      else { const err = await res.json(); alert('خطا: ' + err.detail); }
    } catch (e) { alert('خطا در ارتباط با سرور'); }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/orders/addresses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newAddress)
      });
      if (res.ok) {
        alert('✅ آدرس جدید اضافه شد');
        setNewAddress({ province: '', city: '', street: '', postal_code: '' });
        fetchMyAddresses();
      } else { const err = await res.json(); alert('خطا: ' + err.detail); }
    } catch (e) { alert('خطا'); }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/orders/addresses/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { fetchMyAddresses(); }
      else { const err = await res.json(); alert('خطا: ' + err.detail); }
    } catch (e) { alert('خطا'); }
  };

  // @@@@@@@@@@@@@@@@@@ توابع پنل ادمین @@@@@@@@@@@@@@@@@@
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', adminProduct.name);
    formData.append('description', adminProduct.description);
    formData.append('price', adminProduct.price);
    formData.append('stock', adminProduct.stock);
    if (adminImage) formData.append('image', adminImage);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/products/', { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        alert('🎉 محصول ثبت شد!');
        setAdminProduct({ name: '', description: '', price: '', stock: '' }); setAdminImage(null); setShowAdminForm(false); 
        fetchProducts();
      } else { alert('خطا: دسترسی غیرمجاز'); }
    } catch (e) { alert('خطا'); }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/orders/admin/${orderId}/status?new_status=${newStatus}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { alert('✅ وضعیت تغییر کرد'); fetchAdminOrders(); }
      else { alert('خطا در تغییر وضعیت'); }
    } catch (e) { alert('خطا'); }
  };

  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalCartPrice = cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);

  return (
    <div className="app-container">
      <header>
        <nav className="navbar">
          <div className="logo" onClick={() => setCurrentPage('home')}>فروشگاه من</div>
          <div className="nav-links">
            <button onClick={() => setCurrentPage('home')} className="nav-item">صفحه اصلی</button>
            <button onClick={() => setCurrentPage('products')} className="nav-item">محصولات</button>
            {isLoggedIn && <button onClick={() => { setCurrentPage('my-orders'); fetchMyOrders(); }} className="nav-item">📋 سفارش‌های من</button>}
            <button onClick={() => setCurrentPage('cart')} className="nav-item cart-btn">🛒 سبد خرید ({totalCartItems})</button>
            {isLoggedIn && <button onClick={() => { setCurrentPage('profile'); fetchProfile(); fetchMyAddresses(); }} className="nav-item" style={{color: '#23a6d5'}}>👤 پروفایل</button>}
            {isAdmin && <button onClick={() => { setCurrentPage('admin'); setShowAdminForm(false); setAdminTab('products'); fetchAdminOrders(); }} className="nav-item" style={{color: '#e73c7e', fontWeight: 'bold'}}>⚙️ پنل ادمین</button>}
            {isLoggedIn ? (
              <button onClick={() => { localStorage.removeItem('token'); setIsLoggedIn(false); setIsAdmin(false); setCurrentPage('home'); setCart([]); }} className="nav-item" style={{ color: '#d32f2f' }}>خروج</button>
            ) : (
              <button onClick={() => setCurrentPage('login')} className="nav-item highlight">ورود</button>
            )}
          </div>
        </nav>
      </header>

      <main className="content-area">
        {currentPage === 'home' && <div className="home-container"><h1>به فروشگاه خوش آمدید</h1></div>}

        {currentPage === 'products' && (
          <div className="products-container">
            <h2>لیست محصولات</h2>
            <input type="text" placeholder="جستجو..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setTimeout(fetchProducts, 500); }} className="search-input" style={{marginBottom: '20px', padding: '10px', width: '100%', borderRadius: '8px', border: 'none'}} />
            <div className="products-grid">
              {products.map((p) => (
                <div key={p.id} className="product-card">
                  {p.image_url ? <img src={`http://127.0.0.1:8000${p.image_url}`} alt={p.name} className="product-image" /> : <div className="product-image-placeholder">{p.name}</div>}
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="product-footer">
                    <span className="price">{Number(p.price).toLocaleString('fa-IR')} تومان</span>
                    <button onClick={() => addToCart(p)} className="add-to-cart">افزودن به سبد</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'cart' && (
          <div className="products-container">
            <h2>سبد خرید شما</h2>
            {cart.length === 0 ? ( <p style={{ color: 'white', textAlign: 'center' }}>سبد خرید خالی است.</p> ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <span className="item-name">{item.name}</span>
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity, 1)}>+</button>
                    </div>
                    <span className="price">{Number(item.price).toLocaleString('fa-IR')} تومان</span>
                    <button onClick={() => removeFromCart(item.id)} className="remove-btn">حذف</button>
                  </div>
                ))}
                <div className="cart-total"><strong>جمع کل: {Number(totalCartPrice).toLocaleString('fa-IR')} تومان</strong></div>
                <div className="cart-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleCheckoutSubmit} className="checkout-btn" style={{ flex: 2 }}>ادامه فرآیند خرید</button>
                  <button onClick={() => setCurrentPage('products')} className="back-btn" style={{ flex: 1, marginTop: 0 }}>بازگشت</button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'my-orders' && (
          <div className="orders-container">
            <h2>سفارش‌های من</h2>
            {myOrders.length === 0 ? ( <p style={{ color: 'white', textAlign: 'center' }}>سفارشی ندارید.</p> ) : (
              <div className="orders-list">
                {myOrders.map((order) => (
                  <div key={order.order_id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">شماره سفارش: <strong>#{order.order_id}</strong></div>
                      <div className={`order-status status-${order.status}`}>{order.status === 'pending' ? 'در انتظار پرداخت' : order.status === 'paid' ? 'پرداخت شده' : order.status}</div>
                    </div>
                    <div className="order-footer">
                      <span>مبلغ کل: <strong className="total-price">{Number(order.total_price).toLocaleString('fa-IR')} تومان</strong></span>
                      {order.status === 'pending' && (
                        <button onClick={() => handlePayOrder(order.order_id)} className="pay-btn">پرداخت سفارش</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* @@@@@@@@@@@@@@@@@@ صفحه پروفایل کاربری با دکمه در هدر @@@@@@@@@@@@@@@@@@ */}
        {currentPage === 'profile' && isLoggedIn && (
          <div className="profile-container">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: 'white', margin: 0, textShadow: '1px 1px 4px rgba(0,0,0,0.3)' }}>پروفایل کاربری</h2>
              <button 
                onClick={() => setCurrentPage('home')} 
                className="back-btn" 
                style={{ width: 'auto', padding: '10px 20px', margin: 0 }}
              >
                ⬅️ بازگشت به صفحه اصلی
              </button>
            </div>

            <div className="profile-grid">
              <div className="profile-card">
                <h3>اطلاعات شخصی</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group"><label>ایمیل (غیرقابل تغییر)</label><input value={profileData.email} disabled style={{background: '#eee'}} /></div>
                  <div className="form-group"><label>نام کامل</label><input value={profileData.full_name} onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} required /></div>
                  <div className="form-group"><label>شماره تماس</label><input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} /></div>
                  <button type="submit" className="submit-btn">ذخیره تغییرات</button>
                </form>
              </div>

              <div className="profile-card">
                <h3>دفترچه آدرس‌ها</h3>
                {myAddresses.length === 0 ? ( <p style={{color: '#777', fontSize: '14px'}}>هیچ آدرسی ثبت نکرده‌اید.</p> ) : (
                  <ul className="address-list">
                    {myAddresses.map((addr) => (
                      <li key={addr.id} className="address-item">
                        <span>{addr.province}، {addr.city}، {addr.street}</span>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="remove-btn">حذف</button>
                      </li>
                    ))}
                  </ul>
                )}
                <h4 style={{marginTop: '20px', marginBottom: '15px', color: '#333'}}>افزودن آدرس جدید</h4>
                <form onSubmit={handleAddAddress} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group"><label>استان</label><input value={newAddress.province} onChange={(e) => setNewAddress({...newAddress, province: e.target.value})} required /></div>
                  <div className="form-group"><label>شهر</label><input value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} required /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>خیابان و پلاک</label><input value={newAddress.street} onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} required /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>کد پستی</label><input value={newAddress.postal_code} onChange={(e) => setNewAddress({...newAddress, postal_code: e.target.value})} required /></div>
                  <div style={{ gridColumn: 'span 2' }}><button type="submit" className="checkout-btn" style={{ marginTop: 0 }}>افزودن آدرس</button></div>
                </form>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'admin' && isAdmin && (
          <div className="admin-container">
            <div className="admin-header">
              <h2>پنل مدیریت</h2>
              <button onClick={() => setCurrentPage('home')} className="back-btn" style={{ padding: '10px 20px', margin: 0 }}>بازگشت</button>
            </div>

            <div className="admin-tabs">
              <button className={`tab-btn ${adminTab === 'products' ? 'active' : ''}`} onClick={() => setAdminTab('products')}>مدیریت محصولات</button>
              <button className={`tab-btn ${adminTab === 'orders' ? 'active' : ''}`} onClick={() => { setAdminTab('orders'); fetchAdminOrders(); }}>مدیریت سفارشات</button>
            </div>

            {adminTab === 'products' && (
              <>
                <button onClick={() => setShowAdminForm(!showAdminForm)} style={{ backgroundColor: '#23a6d5', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                  {showAdminForm ? 'بستن فرم' : '➕ افزودن محصول جدید'}
                </button>
                
                {showAdminForm && (
                  <div className="form-container" style={{ maxWidth: '100%', marginBottom: '20px' }}>
                    <form onSubmit={handleAdminSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group"><label>نام محصول</label><input value={adminProduct.name} onChange={(e) => setAdminProduct({...adminProduct, name: e.target.value})} required /></div>
                      <div className="form-group"><label>قیمت</label><input type="number" value={adminProduct.price} onChange={(e) => setAdminProduct({...adminProduct, price: e.target.value})} required /></div>
                      <div className="form-group"><label>موجودی</label><input type="number" value={adminProduct.stock} onChange={(e) => setAdminProduct({...adminProduct, stock: e.target.value})} required /></div>
                      <div className="form-group"><label>توضیحات</label><input value={adminProduct.description} onChange={(e) => setAdminProduct({...adminProduct, description: e.target.value})} required /></div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}><label>تصویر</label><input type="file" onChange={(e) => setAdminImage(e.target.files ? e.target.files[0] : null)} /></div>
                      <div style={{ gridColumn: 'span 2' }}><button type="submit" className="submit-btn">ثبت محصول</button></div>
                    </form>
                  </div>
                )}

                <table className="admin-table">
                  <thead><tr><th>تصویر</th><th>نام محصول</th><th>قیمت</th><th>موجودی</th></tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.image_url ? <img src={`http://127.0.0.1:8000${p.image_url}`} alt={p.name} style={{width: '50px'}} /> : 'بدون عکس'}</td>
                        <td>{p.name}</td>
                        <td>{Number(p.price).toLocaleString('fa-IR')} تومان</td>
                        <td>{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {adminTab === 'orders' && (
              <table className="admin-table">
                <thead><tr><th>شماره</th><th>خریدار</th><th>مبلغ</th><th>وضعیت فعلی</th><th>تغییر وضعیت</th></tr></thead>
                <tbody>
                  {adminOrders.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>هیچ سفارشی ثبت نشده است.</td></tr>
                  ) : (
                    adminOrders.map((order) => (
                      <tr key={order.order_id}>
                        <td>#{order.order_id}</td>
                        <td>{order.user_name} <br/><small style={{color: '#888'}}>{order.user_email}</small></td>
                        <td>{Number(order.total_price).toLocaleString('fa-IR')} تومان</td>
                        <td>
                          <span className={`status-badge badge-${order.status}`}>
                            {order.status === 'pending' ? 'در انتظار' : order.status === 'paid' ? 'پرداخت شده' : order.status === 'shipped' ? 'ارسال شده' : order.status === 'delivered' ? 'تحویل شده' : 'لغو شده'}
                          </span>
                        </td>
                        <td>
                          <select className="status-select" value={order.status} onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}>
                            <option value="pending">در انتظار پرداخت</option>
                            <option value="paid">پرداخت شده</option>
                            <option value="shipped">ارسال شده</option>
                            <option value="delivered">تحویل داده شده</option>
                            <option value="canceled">لغو شده</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {currentPage === 'login' && (
          <div className="form-container">
            <h2 className="form-title">ورود</h2>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group"><label>ایمیل</label><input type="email" onChange={(e) => setLoginData({...loginData, email: e.target.value})} required /></div>
              <div className="form-group"><label>رمز عبور</label><input type="password" onChange={(e) => setLoginData({...loginData, password: e.target.value})} required /></div>
              <button type="submit" className="submit-btn">ورود</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;