let profile = { brand: '', name: '', cuit: '', phone: '', email: '', logoData: '' };
let items = [];

window.onload = function() {
    loadProfile();
    addItem('Instalación de Térmica / Protector de Tensión', 1, 18000);
    updatePreview();
};

function openProfileModal() { 
    document.getElementById('profileModal').style.display = 'flex'; 
}

function closeProfileModal() { 
    document.getElementById('profileModal').style.display = 'none'; 
}

function saveProfile() {
    profile.brand = document.getElementById('profBrand').value;
    profile.name = document.getElementById('profName').value;
    profile.cuit = document.getElementById('profCUIT').value;
    profile.phone = document.getElementById('profPhone').value;
    profile.email = document.getElementById('profEmail').value;

    const logoInput = document.getElementById('profileLogoInput');
    if (logoInput.files && logoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profile.logoData = e.target.result;
            localStorage.setItem('electrician_profile', JSON.stringify(profile));
            updatePreview();
            closeProfileModal();
        };
        reader.readAsDataURL(logoInput.files[0]);
    } else {
        localStorage.setItem('electrician_profile', JSON.stringify(profile));
        updatePreview();
        closeProfileModal();
    }
}

function loadProfile() {
    const saved = localStorage.getItem('electrician_profile');
    if (saved) {
        profile = JSON.parse(saved);
        document.getElementById('profBrand').value = profile.brand || '';
        document.getElementById('profName').value = profile.name || '';
        document.getElementById('profCUIT').value = profile.cuit || '';
        document.getElementById('profPhone').value = profile.phone || '';
        document.getElementById('profEmail').value = profile.email || '';
    }
}

function addItem(desc = '', qty = 1, price = 0) {
    items.push({ id: Date.now(), desc, qty, price });
    renderItemsInput();
    updatePreview();
}

function addShortcut(desc, qty, price) {
    addItem(desc, qty, price);
}

function removeItem(id) {
    items = items.filter(item => item.id !== id);
    renderItemsInput();
    updatePreview();
}

function renderItemsInput() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
            <input type="text" class="form-control" value="${item.desc}" placeholder="Descripción" oninput="items[${index}].desc = this.value; updatePreview();">
            <input type="number" class="form-control" value="${item.qty}" min="1" oninput="items[${index}].qty = Number(this.value); updatePreview();">
            <input type="number" class="form-control" value="${item.price}" min="0" oninput="items[${index}].price = Number(this.value); updatePreview();">
            <button class="btn btn-danger" onclick="removeItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
        `;
        container.appendChild(div);
    });
}

function updatePreview() {
    let infoHtml = `<span><strong>CUIT:</strong> ${profile.cuit || '-'}</span>`;
    infoHtml += `<span><strong>Tel:</strong> ${profile.phone || '-'}</span>`;
    infoHtml += `<span><strong>Email:</strong> ${profile.email || '-'}</span>`;
    
    const infoBar = document.getElementById('prevElectricianInfoBar');
    if (infoBar) {
        infoBar.innerHTML = infoHtml;
    }
    
    const prevLogo = document.getElementById('prevLogo');
    if (profile.logoData) {
        prevLogo.src = profile.logoData;
        prevLogo.style.display = 'block';
    } else {
        prevLogo.style.display = 'none';
    }

    document.getElementById('prevClientName').innerText = document.getElementById('clientName').value || 'Cliente Ejemplo';
    document.getElementById('prevClientPhone').innerText = document.getElementById('clientPhone').value || '-';
    document.getElementById('prevNotes').innerText = document.getElementById('budgetNotes').value || 'Sin observaciones adicionales.';

    const today = new Date();
    document.getElementById('prevDate').innerText = today.toLocaleDateString('es-AR');

    const validityDays = parseInt(document.getElementById('validity').value);
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + validityDays);
    document.getElementById('prevDueDate').innerText = dueDate.toLocaleDateString('es-AR') + ` (${validityDays === 1 ? '24hs' : validityDays + ' días'})`;

    const prevBody = document.getElementById('prevItems');
    prevBody.innerHTML = '';
    let total = 0;

    items.forEach(item => {
        const subtotal = item.qty * item.price;
        total += subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.desc || 'Ítem sin descripción'}</td>
            <td class="num">${item.qty}</td>
            <td class="num">$ ${item.price.toLocaleString('es-AR')}</td>
            <td class="num">$ ${subtotal.toLocaleString('es-AR')}</td>
        `;
        prevBody.appendChild(tr);
    });

    document.getElementById('prevTotal').innerText = '$ ' + total.toLocaleString('es-AR');
}

function sendWhatsApp() {
    const phone = document.getElementById('clientPhone').value.replace(/\D/g, '');
    const client = document.getElementById('clientName').value || 'Cliente';
    const total = document.getElementById('prevTotal').innerText;
    const dueDate = document.getElementById('prevDueDate').innerText;

    let msg = `Hola *${client}*, te adjunto el resumen de tu presupuesto:\n\n`;
    items.forEach(i => {
        if(i.desc) msg += `• ${i.desc} (x${i.qty}): $${(i.qty * i.price).toLocaleString('es-AR')}\n`;
    });
    msg += `\n*TOTAL:* ${total}\n`;
    msg += `*Validez del presupuesto:* Hasta el ${dueDate}\n\n`;
    msg += `Quedo a tu disposición por cualquier consulta.`;

    const url = phone ? 
        `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : 
        `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    window.open(url, '_blank');
}

function downloadPDF() {
    const element = document.getElementById('printableArea');
    const clientName = document.getElementById('clientName').value || 'Cliente';
    
    const options = {
        margin:       5,
        filename:     `Presupuesto_${clientName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Genera el PDF y lo abre en una pestaña nueva listo para guardar en el iPhone
    html2pdf().from(element).set(options).outputPdf('datauristring', function(pdfDataUri) {
        const win = window.open();
        win.document.write(`<iframe src="${pdfDataUri}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
    });
}
