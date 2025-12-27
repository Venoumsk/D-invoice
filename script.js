let items = [];
let invoiceCounter = Number(localStorage.getItem("invoiceCounter")) || 1;

document.addEventListener("DOMContentLoaded", () => {
    setInvoiceMeta();
    loadShopDetails();
    updateInvoice();
});

function setInvoiceMeta() {
    document.getElementById("invoiceNo").innerText =
        `INV-${String(invoiceCounter).padStart(4, "0")}`;
    document.getElementById("invoiceDate").innerText =
        new Date().toLocaleDateString("en-IN");
}

function addItem() {
    const itemName = document.getElementById("itemName").value.trim();
    const qty = Number(document.getElementById("qty").value);
    const price = Number(document.getElementById("price").value);

    if (!itemName || qty <= 0 || price <= 0) {
        alert("⚠️ Please enter valid item details");
        return;
    }

    items.push({ itemName, qty, price });
    clearItemInputs();
    updateInvoice();
}

function removeItem(index) {
    if (confirm("🗑️ Are you sure you want to remove this item?")) {
        items.splice(index, 1);
        updateInvoice();
    }
}

function updateInvoice() {
    const shopName = document.getElementById("shopName").value || "Shop Name";
    const gstin = document.getElementById("gstin").value;
    const customer = document.getElementById("customerName").value || "—";

    document.getElementById("invShop").innerText = shopName;
    document.getElementById("invGST").innerText = gstin ? `GSTIN: ${gstin}` : "";
    document.getElementById("invCustomer").innerText = customer;

    saveShopDetails();

    const tbody = document.getElementById("invoiceItems");
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <p>No items added yet</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = "";
        let subtotal = 0;

        items.forEach((item, i) => {
            const total = item.qty * item.price;
            subtotal += total;

            tbody.innerHTML += `
                <tr>
                    <td>${item.itemName}</td>
                    <td>${item.qty}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${total.toFixed(2)}</td>
                    <td class="no-print"><button onclick="removeItem(${i})">🗑️ Remove</button></td>
                </tr>
            `;
        });

        const cgst = subtotal * 0.09;
        const sgst = subtotal * 0.09;

        document.getElementById("subTotal").innerText = subtotal.toFixed(2);
        document.getElementById("cgst").innerText = cgst.toFixed(2);
        document.getElementById("sgst").innerText = sgst.toFixed(2);
        document.getElementById("grandTotal").innerText =
            (subtotal + cgst + sgst).toFixed(2);
    }
}

function saveShopDetails() {
    localStorage.setItem("shopDetails", JSON.stringify({
        shopName: document.getElementById("shopName").value,
        gstin: document.getElementById("gstin").value
    }));
}

function loadShopDetails() {
    const data = localStorage.getItem("shopDetails");
    if (!data) return;
    const shop = JSON.parse(data);
    document.getElementById("shopName").value = shop.shopName || "";
    document.getElementById("gstin").value = shop.gstin || "";
}

function finalizeInvoice() {
    invoiceCounter++;
    localStorage.setItem("invoiceCounter", invoiceCounter);
    items = [];
    document.getElementById("customerName").value = "";
    updateInvoice();
    setInvoiceMeta();
}

function printInvoice() {
    if (items.length === 0) {
        alert("⚠️ Please add at least one item before printing");
        return;
    }
    window.print();
    finalizeInvoice();
}

document.getElementById("downloadPdf").addEventListener("click", () => {
    if (items.length === 0) {
        alert("⚠️ Please add at least one item before downloading");
        return;
    }
    
    const button = document.getElementById("downloadPdf");
    button.textContent = "⏳ Generating PDF...";
    button.disabled = true;
    
    html2pdf().set({
        margin: 10,
        filename: `Invoice_${document.getElementById("invoiceNo").innerText}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(document.getElementById("invoice")).save()
      .then(() => {
          button.textContent = "📥 Download PDF";
          button.disabled = false;
          finalizeInvoice();
      });
});

function clearItemInputs() {
    document.getElementById("itemName").value = "";
    document.getElementById("qty").value = "";
    document.getElementById("price").value = "";
    document.getElementById("itemName").focus();
}

// Add Enter key support for item inputs
document.getElementById("itemName").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("qty").focus();
});
document.getElementById("qty").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("price").focus();
});
document.getElementById("price").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addItem();
});
