import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosInstance';
import { MdSearch, MdDownload, MdPerson, MdCheckCircle, MdPhone, MdInfoOutline, MdShoppingCart, MdAdd, MdRemove, MdClose, MdQrCodeScanner } from 'react-icons/md';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customers, setCustomers] = useState([]);
  
  // Phone-based Customer lookup
  const [customerPhone, setCustomerPhone] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  
  const [createdBill, setCreatedBill] = useState(null);

  const fetchPOSData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        axios.get('/api/shop/products'),
        axios.get('/api/shop/customers')
      ]);
      setProducts(prodRes.data.data || []);
      setCustomers(custRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch POS data", err);
    }
  };

  useEffect(() => {
    fetchPOSData();
  }, []);

  // Live lookup by phone number
  const handlePhoneChange = (val) => {
    setCustomerPhone(val);
    if (!val || val.trim() === '') {
      setMatchedCustomer(null);
      setCustomCustomerName('');
      return;
    }
    
    const clean = val.trim();
    const found = customers.find(c => c.phone === clean || c.phone?.endsWith(clean));
    
    if (found) {
      setMatchedCustomer(found);
      setCustomCustomerName(found.name);
    } else {
      setMatchedCustomer(null);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product_id: product.id, product_name: product.name, price: parseFloat(product.price), quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.product_id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subTotal - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty. Please add items before billing.');
    if (paymentMethod === 'Udhar' && !customerPhone) {
      return alert('Please enter a Customer Phone Number for Udhar credit billing');
    }

    try {
      const payload = {
        customer_phone: customerPhone || null,
        customer_name: matchedCustomer ? matchedCustomer.name : (customCustomerName || null),
        customer_id: matchedCustomer ? matchedCustomer.id : null,
        items: cart,
        payment_method: paymentMethod,
        discount_amount: discount
      };
      const res = await axios.post('/api/bills', payload);
      
      const billData = res.data.data;
      setCreatedBill({
        id: billData.billId,
        invoice_no: billData.invoice_no,
        customer_name: matchedCustomer ? matchedCustomer.name : (customCustomerName || (customerPhone ? `Customer (${customerPhone})` : 'Walk-in Customer')),
        total: total,
        payment_method: paymentMethod,
        isTemp: billData.temp || false
      });

      // Clear Cart and inputs
      setCart([]);
      setDiscount(0);
      setCustomerPhone('');
      setCustomCustomerName('');
      setMatchedCustomer(null);
      fetchPOSData();
    } catch (err) {
      alert('Error generating bill');
      console.error(err);
    }
  };

  const handleDownloadPDF = (billId) => {
    if (!billId) {
      alert('This bill is saved in temporary staging and will generate a full PDF receipt once the customer registers!');
      return;
    }
    window.open(`/api/bills/${billId}/pdf`, '_blank');
  };

  const categories = ['All', ...new Set(products.map(p => p.category_name || 'General'))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(search));
    const matchesCategory = selectedCategory === 'All' || (p.category_name || 'General') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-10rem)]">
      {/* Catalog & Product Selection */}
      <div className="flex-1 bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col overflow-hidden">
        {/* Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3.5 top-3 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search items or scan barcode..." 
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-xs transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <MdQrCodeScanner className="absolute right-3.5 top-3 text-slate-400 hover:text-indigo-600 cursor-pointer" size={18} />
            </div>

            <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-2.5 rounded-xl shadow-xs self-center">
              Catalog Items: <span className="text-indigo-600 font-bold">{filteredProducts.length}</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-auto p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <MdShoppingCart size={40} className="mx-auto mb-2 opacity-40 text-slate-300" />
              <p className="font-semibold text-slate-600">No products found matching query</p>
            </div>
          ) : (
            filteredProducts.map(p => {
              const inCartItem = cart.find(c => c.product_id === p.id);
              return (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)} 
                  className={`bg-white border rounded-2xl p-4 cursor-pointer hover-lift transition-all relative flex flex-col justify-between group ${
                    inCartItem ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/10' : 'border-slate-200/80 hover:border-indigo-400 hover:shadow-card'
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-scale-up">
                      {inCartItem.quantity}
                    </span>
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      {p.category_name || 'General'}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                      <span className="text-indigo-600 font-extrabold text-base">₹{p.price}</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      p.stock <= 10 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart & Billing Checkout Panel */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-card border border-slate-100 flex flex-col overflow-hidden shrink-0">
        {/* Invoice Top Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-xs">
          <div className="flex items-center space-x-2">
            <MdShoppingCart size={20} className="text-indigo-400" />
            <h2 className="font-extrabold text-sm tracking-wide uppercase">Current Order</h2>
          </div>
          <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full font-bold">
            {cart.reduce((a, b) => a + b.quantity, 0)} Items
          </span>
        </div>

        {/* Customer Lookup & Udhar Section */}
        <div className="p-4 border-b border-slate-100 bg-indigo-50/40 space-y-2.5">
          <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
            Customer Identification (Phone / Udhar)
          </label>
          <div className="relative">
            <MdPhone className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Enter Phone Number..."
              value={customerPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono shadow-xs"
            />
          </div>

          {/* Quick Select Buttons from Existing Customers */}
          {customers.length > 0 && !customerPhone && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Frequent:</span>
              {customers.slice(0, 3).map(c => (
                <button 
                  key={c.id} 
                  type="button" 
                  onClick={() => handlePhoneChange(c.phone)}
                  className="text-xs bg-white hover:bg-indigo-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md transition font-medium"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Dynamic Customer Banner */}
          {matchedCustomer ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  <MdPerson size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">{matchedCustomer.name}</div>
                  <div className="text-[10px] text-emerald-700 font-mono">Reg. Customer</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-500 uppercase font-bold">Udhar Balance</div>
                <div className="text-xs font-extrabold text-rose-600">₹{matchedCustomer.outstanding_balance || 0}</div>
              </div>
            </div>
          ) : customerPhone ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <MdInfoOutline size={16} className="text-amber-600 shrink-0" />
                <span>Guest Phone Record</span>
              </div>
              <p className="text-[10px] text-amber-800 leading-tight">
                Bill auto-links when customer registers account on Bahi Khata!
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic pt-0.5">
              Billing mode: <span className="font-semibold text-slate-700">Walk-in Counter Customer</span>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-12 space-y-2">
              <MdShoppingCart size={36} className="mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-500">Click product cards on left to add to bill</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="flex justify-between items-center bg-slate-50/70 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition">
                <div className="flex-1 pr-2 min-w-0">
                  <div className="font-bold text-xs text-slate-800 truncate">{item.product_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    ₹{item.price} × {item.quantity} = <strong className="text-indigo-600">₹{(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs shrink-0">
                  <button 
                    onClick={() => updateQuantity(item.product_id, -1)} 
                    className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold text-xs transition"
                  >
                    <MdRemove size={12} />
                  </button>
                  <span className="text-xs font-bold w-5 text-center text-slate-800">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product_id, 1)} 
                    className="w-5 h-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded flex items-center justify-center font-bold text-xs transition"
                  >
                    <MdAdd size={12} />
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.product_id)} 
                    className="w-5 h-5 text-rose-500 hover:bg-rose-50 rounded flex items-center justify-center transition ml-1"
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer Calculation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-3">
          <div className="space-y-1.5 text-xs font-medium text-slate-600">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Discount</span>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">₹</span>
                <input 
                  type="number" 
                  min="0"
                  value={discount} 
                  onChange={e => setDiscount(Number(e.target.value))} 
                  className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-right text-xs bg-white focus:ring-1 focus:ring-indigo-500 font-bold" 
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Payable</span>
              <span className="text-xl font-black text-indigo-600">₹{total.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)} 
                className="border border-slate-200 rounded-xl py-2.5 px-3 text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
              >
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 UPI</option>
                <option value="Card">💳 Card</option>
                <option value="Udhar">📕 Udhar</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl py-3 font-extrabold text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2"
          >
            <MdCheckCircle size={20} />
            <span>Complete Order (₹{total.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* Bill Download Success Modal */}
      {createdBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100 animate-scale-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <MdCheckCircle size={40} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {createdBill.isTemp ? 'Bill Saved to Temp Staging!' : 'Bill Issued Successfully!'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Transaction recorded into ledger</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-1.5 border border-slate-100 font-medium">
              <div className="flex justify-between"><span className="text-slate-500">Invoice:</span> <strong className="text-indigo-600 font-mono">{createdBill.invoice_no}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Customer:</span> <strong>{createdBill.customer_name}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Net Amount:</span> <strong>₹{createdBill.total} ({createdBill.payment_method})</strong></div>
              {createdBill.isTemp && (
                <div className="pt-2 text-[11px] text-amber-800 font-semibold border-t border-amber-200/60">
                  * Auto-link queued for customer registration
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setCreatedBill(null)} 
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                Done
              </button>
              {!createdBill.isTemp && (
                <button 
                  onClick={() => handleDownloadPDF(createdBill.id)} 
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-200"
                >
                  <MdDownload size={16} />
                  <span>Download PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;

