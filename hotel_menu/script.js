/* Menu data - images live in /images/ */
const MENU = [
  { id: 'ch_roast', name: 'Chicken Roast', price: 120, img: 'chicken_roast.jpg' },
  { id: 'bf_roast', name: 'Beef Roast', price: 120, img: 'beef_roast.jpg' },
  { id: 'ch_65',    name: 'Chicken65',    price: 100, img: 'chicken65.jpg' },
  { id: 'ch_curry', name: 'Chicken Curry',price: 100, img: 'chicken_curry.jpg' },
  { id: 'bf_curry', name: 'Beef Curry',   price: 100, img: 'beef_curry.jpg' },
  { id: 'ch_fry',   name: 'Chicken Fry',  price: 100, img: 'chicken_fry.jpg' },
  { id: 'bf_fry',   name: 'Beef Fry',     price: 100, img: 'beef_fry.jpg' },
  { id: 'porotta',  name: 'Porotta',      price: 10,  img: 'porotta.jpg' },
  { id: 'dosa',     name: 'Dosa',         price: 10,  img: 'dosa.jpg' },
  { id: 'chapati',  name: 'Chapati',      price: 10,  img: 'chapati.jpg' },
  { id: 'masala',   name: 'Masala Dosa',  price: 10,  img: 'masala_dosa.jpg' }
];

document.addEventListener('DOMContentLoaded', () => {
  const menuList = document.getElementById('menuList');
  if (!menuList) return; // not on menu page -> stop

  // DOM nodes
  const cartSection = document.getElementById('cartSection');
  const cartItemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const gstEl = document.getElementById('gst');
  const totalEl = document.getElementById('grandTotal');
  const clearBtn = document.getElementById('clearCart');
  const placeBtn = document.getElementById('placeOrder');
  const tableSelect = document.getElementById('tableSelect');

  // cart: array of {id,name,price,img,qty}
  let cart = [];

  // render menu items (vertical long boxes) with staggered animation
  MENU.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.style.animationDelay = `${idx * 0.12}s`;
    card.innerHTML = `
      <img src="images/${item.img}" alt="${item.name}">
      <div class="item-info">
        <h3>${item.name}</h3>
        <div class="price">₹${item.price}</div>
        <div class="add-row">
          <button class="add-button" data-id="${item.id}">Add</button>
          <div class="muted small">Tap to add — cart appears below</div>
        </div>
      </div>
    `;
    menuList.appendChild(card);
    // reveal after inserted
    setTimeout(()=> card.classList.add('reveal'), 80 + idx * 120);
  });

  // Add via delegation
  menuList.addEventListener('click', (e) => {
    const addBtn = e.target.closest('button.add-button');
    if (!addBtn) return;
    const id = addBtn.getAttribute('data-id');
    addToCart(id);
    // small visual feedback
    addBtn.animate([{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:220});
  });

  // add item (aggregate qty)
  function addToCart(id) {
    const item = MENU.find(x => x.id === id);
    if (!item) return;
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ ...item, qty: 1 });
    showCart();
    renderCart();
  }

  function showCart() {
    if (cartSection.classList.contains('hidden')) {
      cartSection.classList.remove('hidden');
      cartSection.classList.add('reveal');
    }
  }

  // render cart and totals
  function renderCart() {
    cartItemsEl.innerHTML = '';
    let subtotal = 0;
    cart.forEach(ci => {
      subtotal += ci.price * ci.qty;
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="left">
          <img src="images/${ci.img}" alt="${ci.name}">
          <div>
            <div style="font-weight:700">${ci.name}</div>
            <div class="muted small">₹${ci.price} each</div>
          </div>
        </div>

        <div class="right">
          <div class="qty-controls">
            <button class="qty-btn" data-action="dec" data-id="${ci.id}">-</button>
            <div class="qty-bubble">${ci.qty}</div>
            <button class="qty-btn" data-action="inc" data-id="${ci.id}">+</button>
          </div>
          <div style="margin-top:6px;font-weight:700">₹${ci.price * ci.qty}</div>
        </div>
      `;
      cartItemsEl.appendChild(li);
    });

    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;

    subtotalEl.textContent = subtotal;
    gstEl.textContent = gst;
    totalEl.textContent = total;
  }

  // qty inc/dec in cart (delegation)
  cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const idx = cart.findIndex(x => x.id === id);
    if (idx === -1) return;

    if (action === 'inc') cart[idx].qty += 1;
    if (action === 'dec') {
      cart[idx].qty -= 1;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
    }

    if (cart.length === 0) cartSection.classList.add('hidden');
    else showCart();

    renderCart();
  });

  // clear cart
  clearBtn.addEventListener('click', () => {
    cart = [];
    cartSection.classList.add('hidden');
    renderCart();
  });

 // place order
placeBtn.addEventListener('click', () => {
  if (cart.length === 0) { alert('Cart is empty.'); return; }
  const table = tableSelect.value;
  if (!table) { alert('Please select your table before placing order.'); tableSelect.focus(); return; }

  const orders = JSON.parse(localStorage.getItem('orders') || '[]');

  const order = {
    id: 'ORD-' + Date.now(),
    table,
    items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, img: i.img, qty: i.qty })),
    totals: (() => {
      const s = cart.reduce((sum,i)=> sum + i.price * i.qty, 0);
      const g = Math.round(s * 0.05);
      return { subtotal: s, gst: g, total: s + g };
    })(),
    createdAt: new Date().toISOString(),
    delivered: false
  };

  orders.unshift(order);
  localStorage.setItem('orders', JSON.stringify(orders));

  // --- Show Invoice on same page ---
  const invoiceSection = document.getElementById('invoiceSection');
  const invoiceTableNumber = document.getElementById('invoiceTableNumber');
  const invoiceItems = document.querySelector('#invoiceItems tbody');
  const invoiceTotalAmount = document.getElementById('invoiceTotalAmount');

  invoiceTableNumber.innerText = table;
  invoiceItems.innerHTML = '';

  let total = 0;
  cart.forEach(item => {
    const price = Number(item.price) * Number(item.qty);
    total += price;
    invoiceItems.innerHTML += `
      <tr>
        <td>${item.name.trim()}</td>
        <td>${item.qty}</td>
        <td>₹${price}</td>
      </tr>
    `;
  });
  const gst = Math.round(total * 0.05);
const grandTotal = total + gst;
invoiceTotalAmount.innerText = grandTotal;
  invoiceSection.classList.remove('hidden');

  // clear cart and hide cart section
  cart = [];
  cartSection.classList.add('hidden');
  renderCart();
});
// --- Download Invoice with attractive table and correct ₹ symbol ---
const downloadBtn = document.getElementById('downloadInvoiceBtn');

downloadBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont('times'); // ensures ₹ symbol works



  const tableNumber = document.getElementById('invoiceTableNumber').innerText;
  const rows = Array.from(document.querySelectorAll('#invoiceItems tbody tr')).map(tr => {
    const cols = tr.querySelectorAll('td');
    return [cols[0].innerText, cols[1].innerText, '₹' + cols[2].innerText.replace('₹','')];
  });

  // Header
  doc.setFontSize(18);
  doc.text('INFERNO RESTAURANT', 105, 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Invoice', 105, 25, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Table: ' + tableNumber, 14, 35);

  // Table using AutoTable
  doc.autoTable({
    startY: 45,
    head: [['Item', 'Qty', 'Price']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [255,204,51], textColor:[0,0,0], fontStyle:'bold', halign:'center' },
    alternateRowStyles: { fillColor: [245,245,245] },
    styles: { fontSize: 12 },
    columnStyles: {
      0:{cellWidth:90},
      1:{cellWidth:30, halign:'center'},
      2:{cellWidth:40, halign:'right'}
    }
  });

  // Total
  const totalAmount = document.getElementById('invoiceTotalAmount').innerText;
  doc.setFontSize(14);
  doc.text(`Total: ₹${totalAmount}`, 14, doc.lastAutoTable.finalY + 10);

  doc.save(`Invoice_Table${tableNumber}.pdf`);
});

});

