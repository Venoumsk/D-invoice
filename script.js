// Global variables
let invoiceItems = [];
let savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
let invoiceHistory = JSON.parse(localStorage.getItem('invoiceHistory')) || [];
let invoiceNumber = localStorage.getItem('lastInvoiceNumber')
    ? parseInt(localStorage.getItem('lastInvoiceNumber')) + 1
    : 1001;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    loadShopDetails(); // ✅ Load saved shop details on page load
    updateInvoiceNumber();
    updateInvoiceDate();
    updateInvoice();

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️ Light Mode';
    }

    themeToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // ✅ Save shop details whenever they change
    const shopFields = ['shopName', 'shopAddress', 'shopCity', 'shopPhone', 'shopEmail', 'gstin'];
    shopFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', saveShopDetails);
        }
    });

    // ✅ TEXT RECEIPT DOWNLOAD (replaces PDF)
    document.getElementById('downloadPdf').addEventListener('click', function () {
        downloadTextReceipt();
        saveInvoiceToHistory();
    });
});

function updateInvoiceNumber() {
    document.getElementById('invoiceNo').textContent = invoiceNumber;
}

function updateInvoiceDate() {
    document.getElementById('invoiceDate').textContent =
        new Date().toLocaleDateString();
}

// ✅ Save shop details to localStorage
function saveShopDetails() {
    const shopDetails = {
        shopName: document.getElementById('shopName').value,
        shopAddress: document.getElementById('shopAddress').value,
        shopCity: document.getElementById('shopCity').value,
        shopPhone: document.getElementById('shopPhone').value,
        shopEmail: document.getElementById('shopEmail').value,
        gstin: document.getElementById('gstin').value
    };
    localStorage.setItem('shopDetails', JSON.stringify(shopDetails));
}

// ✅ Load shop details from localStorage
function loadShopDetails() {
    const savedShopDetails = localStorage.getItem('shopDetails');
    if (savedShopDetails) {
        const shopDetails = JSON.parse(savedShopDetails);
        document.getElementById('shopName').value = shopDetails.shopName || '';
        document.getElementById('shopAddress').value = shopDetails.shopAddress || '';
        document.getElementById('shopCity').value = shopDetails.shopCity || '';
        document.getElementById('shopPhone').value = shopDetails.shopPhone || '';
        document.getElementById('shopEmail').value = shopDetails.shopEmail || '';
        document.getElementById('gstin').value = shopDetails.gstin || '';
    }
}

// ✅ Save invoice to history
function saveInvoiceToHistory() {
    if (invoiceItems.length === 0) return;

    const invoice = {
        number: invoiceNumber,
        date: new Date().toLocaleDateString(),
        customer: document.getElementById('customerName').value,
        total: document.getElementById('grandTotal').textContent,
        items: [...invoiceItems]
    };

    invoiceHistory.push(invoice);
    localStorage.setItem('invoiceHistory', JSON.stringify(invoiceHistory));

    invoiceNumber++;
    localStorage.setItem('lastInvoiceNumber', invoiceNumber);
    updateInvoiceNumber();
}

// ✅ TEXT RECEIPT GENERATOR
function downloadTextReceipt() {
    let text = '';
    text += '=============================\n';
    text += '        INVOICE\n';
    text += '=============================\n\n';

    text += `Invoice No : ${invoiceNumber}\n`;
    text += `Date       : ${new Date().toLocaleDateString()}\n\n`;

    text += 'SHOP DETAILS\n';
    text += '-----------------------------\n';
    text += `${document.getElementById('shopName').value || 'Shop Name'}\n`;
    text += `${document.getElementById('shopAddress').value || ''}\n`;
    text += `${document.getElementById('shopCity').value || ''}\n`;
    text += `Phone: ${document.getElementById('shopPhone').value || ''}\n`;
    text += `Email: ${document.getElementById('shopEmail').value || ''}\n`;
    if (document.getElementById('gstin').value) {
        text += `GSTIN: ${document.getElementById('gstin').value}\n`;
    }

    text += '\nCUSTOMER\n';
    text += '-----------------------------\n';
    text += `${document.getElementById('customerName').value || 'N/A'}\n`;
    text += `${document.getElementById('customerAddress').value || ''}\n`;
    text += `${document.getElementById('customerPhone').value || ''}\n`;

    text += '\nITEMS\n';
    text += '-----------------------------\n';
    text += 'Name         | Qty | Price   | Disc% | Tax%  | Total\n';
    text += '-----------------------------\n';

    let subtotal = 0;
    let totalItemDiscounts = 0;
    let taxBreakdown = {};

    invoiceItems.forEach(item => {
        const itemSubtotal = item.qty * item.price;
        subtotal += itemSubtotal;

        const discountAmt = itemSubtotal * (item.discount / 100);
        totalItemDiscounts += discountAmt;

        const afterDiscount = itemSubtotal - discountAmt;
        const rate = parseFloat(item.taxRate);
        const taxAmt = afterDiscount * (rate / 100);
        const total = afterDiscount + taxAmt;

        if (rate > 0) {
            taxBreakdown[rate] = (taxBreakdown[rate] || 0) + taxAmt;
        }

        text += `${item.name.padEnd(12)} | ${item.qty.toString().padEnd(3)} | ₹${item.price.toFixed(2).padEnd(6)} | ${item.discount}% | ${item.taxRate}% | ₹${total.toFixed(2)}\n`;
    });

    text += '\n=============================\n';
    text += 'SUMMARY\n';
    text += '-----------------------------\n';
    text += `Subtotal         : ₹${subtotal.toFixed(2)}\n`;

    if (totalItemDiscounts > 0) {
        text += `Item Discounts   : -₹${totalItemDiscounts.toFixed(2)}\n`;
    }

    const globalDiscountPercent = parseFloat(document.getElementById('globalDiscount').value) || 0;
    const globalDiscountAmt = (subtotal - totalItemDiscounts) * (globalDiscountPercent / 100);
    
    if (globalDiscountPercent > 0) {
        text += `Global Discount  : -₹${globalDiscountAmt.toFixed(2)}\n`;
    }

    // Tax breakdown
    Object.keys(taxBreakdown).forEach(rate => {
        text += `CGST ${rate / 2}%        : ₹${(taxBreakdown[rate] / 2).toFixed(2)}\n`;
        text += `SGST ${rate / 2}%        : ₹${(taxBreakdown[rate] / 2).toFixed(2)}\n`;
    });

    let grandTotal = subtotal - totalItemDiscounts - globalDiscountAmt + Object.values(taxBreakdown).reduce((a, b) => a + b, 0);

    if (document.getElementById('roundOff').checked) {
        const rounded = Math.round(grandTotal);
        text += `Round Off        : ₹${(rounded - grandTotal).toFixed(2)}\n`;
        grandTotal = rounded;
    }

    text += '-----------------------------\n';
    text += `GRAND TOTAL      : ₹${grandTotal.toFixed(2)}\n`;
    text += '=============================\n\n';

    const paymentMethod = document.getElementById('paymentMethod').value;
    const bankDetails = document.getElementById('bankDetails').value;

    if (paymentMethod || bankDetails) {
        text += 'PAYMENT DETAILS\n';
        text += '-----------------------------\n';
        if (paymentMethod) text += `Method: ${paymentMethod}\n`;
        if (bankDetails) text += `${bankDetails}\n`;
        text += '\n';
    }

    text += 'Thank you for your business!\n';

    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_${invoiceNumber}.txt`;
    link.click();
}

/* 🔽 REST OF THE FUNCTIONS BELOW 🔽 */

function handleLogoUpload() {
    const file = document.getElementById('shopLogo').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('logoPreview').innerHTML =
                `<img src="${e.target.result}" alt="Logo">`;
        };
        reader.readAsDataURL(file);
    }
}

function addItem() {
    const name = document.getElementById('itemName').value;
    const qty = parseFloat(document.getElementById('qty').value);
    const price = parseFloat(document.getElementById('price').value);
    const taxRate = document.getElementById('itemTaxRate').value;
    const discount = parseFloat(document.getElementById('itemDiscount').value) || 0;

    if (!name || !qty || !price) {
        alert('Please fill in item name, quantity, and price');
        return;
    }

    const item = { name, qty, price, taxRate, discount };
    invoiceItems.push(item);

    if (document.getElementById('saveItemCheck').checked) {
        if (!savedItems.find(i => i.name === name)) {
            savedItems.push(item);
            localStorage.setItem('savedItems', JSON.stringify(savedItems));
        }
    }

    document.getElementById('itemName').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('price').value = '';
    document.getElementById('itemDiscount').value = '';
    document.getElementById('saveItemCheck').checked = false;

    updateInvoice();
}

function removeItem(index) {
    invoiceItems.splice(index, 1);
    updateInvoice();
}

function updateInvoice() {
    document.getElementById('invShop').textContent =
        document.getElementById('shopName').value || 'Shop Name';
    document.getElementById('invShopAddress').textContent =
        document.getElementById('shopAddress').value;
    document.getElementById('invShopCity').textContent =
        document.getElementById('shopCity').value;
    document.getElementById('invShopPhone').textContent =
        document.getElementById('shopPhone').value;
    document.getElementById('invShopEmail').textContent =
        document.getElementById('shopEmail').value;

    const gstin = document.getElementById('gstin').value;
    document.getElementById('invGST').textContent =
        gstin ? `GSTIN: ${gstin}` : '';

    const customerName =
        document.getElementById('customerName').value || '—';
    document.getElementById('invCustomer').textContent = customerName;
    document.getElementById('invCustomerAddress').textContent =
        document.getElementById('customerAddress').value;
    document.getElementById('invCustomerPhone').textContent =
        document.getElementById('customerPhone').value;

    const paymentMethod = document.getElementById('paymentMethod').value;
    const bankDetails = document.getElementById('bankDetails').value;

    if (paymentMethod || bankDetails) {
        document.getElementById('paymentSection').style.display = 'block';
        document.getElementById('invPaymentMethod').textContent =
            paymentMethod ? `Payment Method: ${paymentMethod}` : '';
        document.getElementById('invBankDetails').textContent =
            bankDetails ? `Details: ${bankDetails}` : '';
    } else {
        document.getElementById('paymentSection').style.display = 'none';
    }

    const tbody = document.getElementById('invoiceItems');
    if (invoiceItems.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" class="empty-state"><p>No items added yet</p></td></tr>';
    } else {
        tbody.innerHTML = invoiceItems.map((item, index) => {
            const subtotal = item.qty * item.price;
            const discountAmt = subtotal * (item.discount / 100);
            const afterDiscount = subtotal - discountAmt;
            const taxAmt = afterDiscount * (parseFloat(item.taxRate) / 100);
            const total = afterDiscount + taxAmt;

            return `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>${item.discount}%</td>
                <td>${item.taxRate}%</td>
                <td>₹${total.toFixed(2)}</td>
                <td class="no-print">
                    <button onclick="removeItem(${index})">❌</button>
                </td>
            </tr>`;
        }).join('');
    }

    let subtotal = 0;
    let totalItemDiscounts = 0;
    let taxBreakdown = {};

    invoiceItems.forEach(item => {
        const itemSubtotal = item.qty * item.price;
        subtotal += itemSubtotal;

        const discountAmt = itemSubtotal * (item.discount / 100);
        totalItemDiscounts += discountAmt;

        const afterDiscount = itemSubtotal - discountAmt;
        const rate = parseFloat(item.taxRate);
        const taxAmt = afterDiscount * (rate / 100);

        if (rate > 0) {
            taxBreakdown[rate] = (taxBreakdown[rate] || 0) + taxAmt;
        }
    });

    document.getElementById('subTotal').textContent =
        subtotal.toFixed(2);

    document.getElementById('itemDiscountRow').style.display =
        totalItemDiscounts > 0 ? 'block' : 'none';
    document.getElementById('itemDiscounts').textContent =
        totalItemDiscounts.toFixed(2);

    const globalDiscountPercent =
        parseFloat(document.getElementById('globalDiscount').value) || 0;
    const globalDiscountAmt =
        (subtotal - totalItemDiscounts) *
        (globalDiscountPercent / 100);

    document.getElementById('globalDiscountRow').style.display =
        globalDiscountPercent > 0 ? 'block' : 'none';
    document.getElementById('globalDiscountAmt').textContent =
        globalDiscountAmt.toFixed(2);

    const taxBreakdownDiv = document.getElementById('taxBreakdown');
    taxBreakdownDiv.innerHTML = '';
    Object.keys(taxBreakdown).forEach(rate => {
        taxBreakdownDiv.innerHTML += `
        <p><span>CGST ${rate / 2}%:</span> <span>₹${(taxBreakdown[rate] / 2).toFixed(2)}</span></p>
        <p><span>SGST ${rate / 2}%:</span> <span>₹${(taxBreakdown[rate] / 2).toFixed(2)}</span></p>`;
    });

    const totalTax =
        Object.values(taxBreakdown).reduce((a, b) => a + b, 0);

    let grandTotal =
        subtotal - totalItemDiscounts - globalDiscountAmt + totalTax;

    if (document.getElementById('roundOff').checked) {
        const rounded = Math.round(grandTotal);
        document.getElementById('roundOffRow').style.display = 'block';
        document.getElementById('roundOffAmt').textContent =
            `₹${(rounded - grandTotal).toFixed(2)}`;
        grandTotal = rounded;
    } else {
        document.getElementById('roundOffRow').style.display = 'none';
    }

    document.getElementById('grandTotal').textContent =
        grandTotal.toFixed(2);
}

function toggleSavedItems() {
    const list = document.getElementById('savedItemsList');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        list.innerHTML = savedItems.map((item, index) => `
            <div class="saved-item" onclick="useSavedItem(${index})">
                <strong>${item.name}</strong> - ₹${item.price} (Tax: ${item.taxRate}%)
            </div>
        `).join('') || '<p>No saved items</p>';
    } else {
        list.style.display = 'none';
    }
}

function useSavedItem(index) {
    const item = savedItems[index];
    document.getElementById('itemName').value = item.name;
    document.getElementById('qty').value = item.qty;
    document.getElementById('price').value = item.price;
    document.getElementById('itemTaxRate').value = item.taxRate;
    document.getElementById('itemDiscount').value = item.discount || 0;
    toggleSavedItems();
}

function showManageItems() {
    const modal = document.getElementById('manageItemsModal');
    const list = document.getElementById('manageItemsList');

    list.innerHTML = savedItems.map((item, index) => `
        <div style="padding:1rem;margin:0.5rem 0;background:var(--card-bg);border:1px solid var(--border);border-radius:5px;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <strong>${item.name}</strong><br>
                <small>₹${item.price} | Qty: ${item.qty} | Tax: ${item.taxRate}%</small>
            </div>
            <button onclick="deleteSavedItem(${index})" class="danger">Delete</button>
        </div>
    `).join('') || '<p>No saved items</p>';

    modal.style.display = 'block';
}

function deleteSavedItem(index) {
    if (confirm('Delete this saved item?')) {
        savedItems.splice(index, 1);
        localStorage.setItem('savedItems', JSON.stringify(savedItems));
        showManageItems();
    }
}

function printInvoice() {
    saveInvoiceToHistory();
    window.print();
}

function showHistory() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');

    list.innerHTML = invoiceHistory.map((inv, index) => `
        <div style="padding:1rem;margin:0.5rem 0;background:var(--card-bg);border:1px solid var(--border);border-radius:5px;">
            <strong>Invoice #${inv.number}</strong> - ${inv.date}<br>
            <small>Customer: ${inv.customer || 'N/A'} | Total: ₹${inv.total}</small>
        </div>
    `).join('') || '<p>No invoice history</p>';

    modal.style.display = 'block';
}

function filterHistory() {
    const search =
        document.getElementById('historySearch').value.toLowerCase();
    const filtered = invoiceHistory.filter(inv =>
        inv.number.toString().includes(search) ||
        (inv.customer && inv.customer.toLowerCase().includes(search))
    );

    document.getElementById('historyList').innerHTML =
        filtered.map(inv => `
        <div>
            <strong>Invoice #${inv.number}</strong> - ${inv.date}
        </div>
    `).join('') || '<p>No matching invoices</p>';
}

function loadInvoice(index) {
    alert('Feature coming soon!');
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function resetInvoice() {
    if (confirm('Clear all data? This will clear invoice items and customer details but keep shop details.')) {
        // Save current invoice to history before clearing
        saveInvoiceToHistory();
        
        // Clear invoice items
        invoiceItems = [];
        
        // Clear customer details
        document.getElementById('customerName').value = '';
        document.getElementById('customerAddress').value = '';
        document.getElementById('customerPhone').value = '';
        
        // Clear payment details
        document.getElementById('paymentMethod').value = '';
        document.getElementById('bankDetails').value = '';
        
        // Clear global discount and round off
        document.getElementById('globalDiscount').value = '';
        document.getElementById('roundOff').checked = false;
        
        // Clear logo preview
        document.getElementById('logoPreview').innerHTML = '';
        document.getElementById('shopLogo').value = '';
        
        // Update the invoice display
        updateInvoice();
    }
}

function updateTaxPreview() {}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
