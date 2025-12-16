// =========================================================================
// --- SCRIPT 1: LOCK SCREEN LOGIC VARS ---
// =========================================================================
const WEBHOOK_URL = "https://hook.us2.make.com/ilghmt5fjvq7q946ek6bwogu5kbl6vow"; 
const STORAGE_KEY = "user_access_token_v2"; 

// =========================================================================
// --- SCRIPT 2: JASTIP APP LOGIC VARS ---
// =========================================================================
const FRAME_ID = 'jastip-calculator-widget';
let currentShipping = 'handCarry';
let currentRounding = 0;
const modes = { profit: 'percent', handCarry: 'percent', other: 'percent' };
const basis = { profit: 'modal', handCarry: 'modal', other: 'modal' };
const rpMode = { profit: 'unit', other: 'unit', handCarry: 'unit' }; 

// =========================================================================
// --- DOM CONTENT LOADED & INIT ---
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    // --- LOCK SCREEN INIT ---
    if (localStorage.getItem(STORAGE_KEY) === "valid") unlockApp();

    // --- JASTIP APP INIT ---
    setupSync('profitMarginSlider', 'profitMargin');
    setupSync('hcRateSlider', 'hcRate');
    setupSync('otherRateSlider', 'otherRate');
    const ids = ['modalPriceSource', 'exchangeRate', 'profitMarginFixed', 'hcFixed', 'otherFixed', 'airPricePerKg', 'seaPricePerCBM', 'actualPriceInput', 'airWeight', 'seaWeight', 'airP', 'airL', 'airT', 'seaP', 'seaL', 'seaT', 'seaMinCBM', 'airMinWeight'];
    ids.forEach(id => { const el=document.getElementById(id); if(el) el.addEventListener('input', function(){formatInputNumber(this);}); });
    document.getElementById('calculateButton').addEventListener('click', calculateJastip);
    document.getElementById('saveImageBtn').addEventListener('click', saveToImage);
    
    // Resize Observer (PENTING untuk iframe)
    const observer = new ResizeObserver(() => triggerResizeSequence());
    const container = document.getElementById('jastip-app');
    if(container) observer.observe(container);
    document.addEventListener('click', triggerResizeSequence);
});


// =========================================================================
// --- LOCK SCREEN FUNCTIONS ---
// =========================================================================
async function checkCredentials() {
    let phone = document.getElementById("phoneInput").value.trim();
    let email = document.getElementById("emailInput").value.trim();
    
    const btn = document.getElementById("btnSubmit");
    const actionArea = document.getElementById("actionArea");

    actionArea.style.display = "none";
    
    phone = phone.replace(/\D/g,'');

    if (phone.length < 9 || !email.includes("@")) {
        alert("Mohon isi Email dan Nomor HP dengan benar.");
        return;
    }

    if (phone.startsWith("0")) phone = "62" + phone.slice(1);
    else if (phone.startsWith("8")) phone = "62" + phone;

    btn.innerText = "Memverifikasi...";
    btn.disabled = true;

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                phone: phone, 
                email: email 
            }) 
        });

        const data = await response.json();

        if (data.status === "success") {
            localStorage.setItem(STORAGE_KEY, "valid");
            unlockApp();
        } else {
            throw new Error("Ditolak");
        }

    } catch (error) {
        console.log("Login Failed:", error);
        actionArea.style.display = "block";
        const card = document.querySelector('.login-card');
        card.style.transform = "translateX(5px)";
        setTimeout(() => card.style.transform = "translateX(0)", 100);
    } finally {
        btn.innerText = "Masuk Aplikasi";
        btn.disabled = false;
    }
}

function unlockApp() {
    document.getElementById("lock-app").style.display = "none";
    document.getElementById("main-app").style.display = "block";
    
    // Important: Recalculate height because elements are now visible
    triggerResizeSequence();
}

function logout() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
}

function handleEnter(e) {
    if (e.key === "Enter") checkCredentials();
}

// =========================================================================
// --- JASTIP APP FUNCTIONS ---
// =========================================================================

function getLogoutButton() {
    return document.querySelector('.jastip-logout-button');
}

function getAccurateHeight() {
    const container = document.getElementById('jastip-app'); 
    if(container) return container.offsetHeight + 60; // Extra padding for logout button area
    return document.body.scrollHeight + 30;
}
function sendHeight() {
    const h = getAccurateHeight();
    window.parent.postMessage({ height: h, frameId: FRAME_ID }, '*');
}
function triggerResizeSequence() {
    sendHeight();
    setTimeout(sendHeight, 20); setTimeout(sendHeight, 50); setTimeout(sendHeight, 100); setTimeout(sendHeight, 300); setTimeout(sendHeight, 500); 
}

function formatCurrency(n) { return (isNaN(n)||n===null)?'Rp 0':new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(Math.round(n)); }
function formatNumber(n) { return (isNaN(n)||n===null)?'0':new Intl.NumberFormat('id-ID',{minimumFractionDigits:0}).format(Math.round(n)); }
function formatDecimal(n, d=2) { return (isNaN(n)||n===null)?'0':n.toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:d}); }

function getRawValue(id) { 
    const el=document.getElementById(id); 
    if(!el || !el.value) return 0;
    let cleanVal = el.value.replace(/\./g,'').replace(/,/g,'.');
    return parseFloat(cleanVal) || 0; 
}

function formatInputNumber(el) { 
    let valStr = el.value.replace(/\./g,''); 
    if(!valStr) { el.value = ''; return; }
    
    if(valStr.indexOf(',') !== -1) {
        const parts = valStr.split(',');
        if (parts.length > 2) valStr = parts[0] + ',' + parts[1];
        const integerPart = parseFloat(parts[0]);
        if(!isNaN(integerPart)) {
            el.value = new Intl.NumberFormat('id-ID').format(integerPart) + ',' + parts[1];
        }
        return; 
    }

    const num = parseFloat(valStr.replace(',','.'));
    if(!isNaN(num)) {
         el.value = new Intl.NumberFormat('id-ID').format(num);
    }
}

function setupSync(sId, iId) { const s=document.getElementById(sId), i=document.getElementById(iId); if(s&&i){ s.addEventListener('input',()=>{i.value=s.value;}); i.addEventListener('input',()=>{let v=parseFloat(i.value); if(v>s.max)v=s.max; if(v<s.min)v=s.min; s.value=v;}); } }

function toggleCheckbox(id, targetGroupId) { 
    const cb = document.getElementById(id);
    cb.classList.toggle('checked');
    if (targetGroupId) {
        const group = document.getElementById(targetGroupId);
        if (cb.classList.contains('checked')) { group.classList.remove('hidden'); group.style.display = 'block'; } 
        else { group.classList.add('hidden'); group.style.display = 'none'; }
    }
    triggerResizeSequence(); 
}

function selectShipping(method) {
    currentShipping = method;
    document.querySelectorAll('.shipping-option').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.method-container').forEach(el => el.classList.remove('active'));
    const btn = document.querySelector(`.shipping-option[data-value="${method}"]`);
    if(btn) btn.classList.add('active');
    document.getElementById({ 'handCarry': 'methodHandCarry', 'airFreight': 'methodAirFreight', 'seaFreight': 'methodSeaFreight' }[method]).classList.add('active');
    document.getElementById('shippingDetailBox').style.display = 'none';
    triggerResizeSequence();
}

function setMode(type, mode) {
    modes[type] = mode;
    let wrapId = type === 'profit' ? 'profitMarginSlider' : type === 'handCarry' ? 'hcRateSlider' : 'otherRateSlider';
    let parent = document.querySelector(`#${wrapId}`).closest('.input-group');
    parent.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    let p = document.getElementById(type === 'profit' ? 'profit-percent-wrapper' : type === 'handCarry' ? 'hc-percent-wrapper' : 'other-percent-wrapper');
    let f = document.getElementById(type === 'profit' ? 'profit-fixed-wrapper' : type === 'handCarry' ? 'hc-fixed-wrapper' : 'other-fixed-wrapper');
    let bOpts = document.getElementById(type === 'profit' ? 'profitBasisOptions' : type === 'handCarry' ? 'hcBasisOptions' : 'otherBasisOptions');
    
    let profitDivider = document.getElementById('profit-rp-divider');
    let otherDivider = document.getElementById('other-rp-divider');
    let hcDivider = document.getElementById('hc-rp-divider');

    if(mode === 'percent') { 
        p.style.display = 'flex'; f.style.display = 'none'; 
        if(bOpts) bOpts.style.display = 'block'; 
        
        if(type === 'profit') {
            document.getElementById('profitRpOptions').classList.remove('show');
            if(profitDivider) profitDivider.style.display = 'none';
        }
        if(type === 'other') {
            document.getElementById('otherRpOptions').classList.remove('show');
            if(otherDivider) otherDivider.style.display = 'none';
        }
        if(type === 'handCarry') {
            document.getElementById('handCarryRpOptions').classList.remove('show');
            if(hcDivider) hcDivider.style.display = 'none';
        }
    } else { 
        p.style.display = 'none'; f.style.display = 'flex'; 
        if(bOpts) bOpts.style.display = 'none'; 
        
        if(type === 'profit') {
            document.getElementById('profitRpOptions').classList.add('show');
            if(profitDivider) profitDivider.style.display = 'block';
        }
        if(type === 'other') {
            document.getElementById('otherRpOptions').classList.add('show');
            if(otherDivider) otherDivider.style.display = 'block';
        }
        if(type === 'handCarry') {
            document.getElementById('handCarryRpOptions').classList.add('show');
            if(hcDivider) hcDivider.style.display = 'block';
        }
    }
    triggerResizeSequence();
}

function toggleBasis(type, sel) {
    const key = type === 'hc' ? 'handCarry' : type;
    basis[key] = sel;
    const mId = type === 'profit' ? 'profitCheckModal' : (type === 'hc' ? 'hcCheckModal' : 'otherCheckModal');
    const jId = type === 'profit' ? 'profitCheckJual' : (type === 'hc' ? 'hcCheckJual' : 'otherCheckJual');
    if (sel === 'modal') { document.getElementById(mId).classList.add('checked'); document.getElementById(jId).classList.remove('checked'); } 
    else { document.getElementById(mId).classList.remove('checked'); document.getElementById(jId).classList.add('checked'); }
    triggerResizeSequence();
}

function toggleRpOption(type, sel) {
    rpMode[type] = sel;
    const uCheck = document.getElementById(type + 'RpUnitCheck');
    const tCheck = document.getElementById(type + 'RpTotalCheck');
    if(sel === 'unit') { uCheck.classList.add('checked'); tCheck.classList.remove('checked'); }
    else { uCheck.classList.remove('checked'); tCheck.classList.add('checked'); }
}

function selectRounding(val) {
    currentRounding = val;
    document.querySelectorAll('.rounding-option').forEach(el => el.classList.remove('active'));
    document.querySelector(`.rounding-option[data-val="${val}"]`).classList.add('active');
}

function roundUp05(num) { return Math.ceil(num * 2) / 2; }

function saveToImage() {
    const btn = document.getElementById('saveImageBtn');
    const logoutBtn = getLogoutButton(); // Ambil tombol logout
    const card = document.getElementById('resultCard');
    
    // 1. Sembunyikan tombol Save dan Logout
    btn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none'; 
    
    const prodName = document.getElementById('productNameInput').value.trim().replace(/\s+/g, '_');
    const now = new Date();
    const timestamp = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    let fileName = 'Jastip-' + timestamp + '.png';
    if(prodName) fileName = 'Jastip-' + prodName + '-' + timestamp + '.png';
    
    html2canvas(card, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // 2. Tampilkan kembali tombol Save dan Logout
        btn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'flex';
    }).catch(err => {
        alert('Gagal menyimpan gambar.');
        
        // 3. Tampilkan kembali jika terjadi error
        btn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'flex';
    });
}

function calculateJastip() {
    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('modalInfoBox').style.display = 'block';
    document.getElementById('saveImageBtn').style.display = 'flex';
    
    // Pastikan tombol logout juga terlihat setelah kalkulasi berhasil
    const logoutBtn = getLogoutButton();
    if (logoutBtn) logoutBtn.style.display = 'flex';
    
    const now = new Date();
    const timeStr = String(now.getDate()).padStart(2,'0') + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + now.getFullYear() + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
    document.getElementById('generatedTimestamp').textContent = 'Generated at: ' + timeStr;
    document.getElementById('generatedTimestamp').style.display = 'block';
    
    const prodName = document.getElementById('productNameInput').value;
    const prodOut = document.getElementById('productNameOutput');
    if(prodName) { prodOut.textContent = prodName; prodOut.style.display = 'block'; }
    else { prodOut.style.display = 'none'; }
    
    const qty = parseInt(document.getElementById('productQty').value) || 1;
    const modalUnit = getRawValue('modalPriceSource');
    let rate = getRawValue('exchangeRate');
    if (rate === 0) rate = 1; 
    
    const modalTotalSource = modalUnit * qty;
    const modalTotalIDR = modalTotalSource * rate;
    
    document.getElementById('modalSourceOutput').textContent = formatNumber(modalUnit);
    document.getElementById('kursOutput').textContent = formatCurrency(rate);
    
    if (qty > 1) {
         document.getElementById('modalCalcFormula').textContent = `${qty} Pcs x ${formatNumber(modalUnit)} x ${formatCurrency(rate)}`;
    } else {
         document.getElementById('modalCalcFormula').textContent = `${formatNumber(modalUnit)} x ${formatCurrency(rate)}`;
    }
    
    document.getElementById('modalCalcResult').textContent = formatCurrency(modalTotalIDR);
    
    const rowQtyModal = document.getElementById('rowQtyModal');
    if (qty > 1) {
        document.getElementById('valQtyModal').textContent = `${qty} Pcs`;
        rowQtyModal.style.display = 'flex';
    } else {
        rowQtyModal.style.display = 'none';
    }

    const detailBox = document.getElementById('shippingDetailBox');
    
    const rowVol = document.getElementById('rowVolume');
    const containerVolMulti = document.getElementById('containerVolMulti');
    const rowWeight = document.getElementById('rowWeight');
    const containerWeightMulti = document.getElementById('containerWeightMulti');
    const rowRoundedWeight = document.getElementById('rowRoundedWeight'); 
    
    const labelRate = document.getElementById('labelRate');
    const valRate = document.getElementById('valRate');
    const formulaVolume = document.getElementById('formulaVolume');
    const resultVolume = document.getElementById('resultVolume');
    const formulaTotal = document.getElementById('formulaTotal');
    const resultTotal = document.getElementById('resultTotal');
    
    rowVol.style.display = 'none';
    containerVolMulti.style.display = 'none';
    rowWeight.style.display = 'none';
    containerWeightMulti.style.display = 'none';
    rowRoundedWeight.style.display = 'none';

    let sellingPrice=0, profitAmount=0, shippingAmount=0, otherAmount=0, shipBaseAmount=0;
    
    if (currentShipping === 'handCarry') {
        detailBox.style.display = 'none';
        if (modes.handCarry === 'fixed') {
            const rawHC = getRawValue('hcFixed');
            shipBaseAmount = rpMode.handCarry === 'unit' ? rawHC * qty : rawHC;
        }
    } 
    else if (currentShipping === 'airFreight') {
        detailBox.style.display = 'block';
        const pricePerKg = getRawValue('airPricePerKg');
        const weightUnit = getRawValue('airWeight'); 
        const weightTotal = weightUnit * qty;
        
        const p = getRawValue('airP'); const l = getRawValue('airL'); const t = getRawValue('airT');
        const volWeightUnit = (p*l*t)/6000;
        const volWeightTotal = volWeightUnit * qty;
        
        const useHighest = document.getElementById('airCalcCheckbox').classList.contains('checked');
        const useRounding = document.getElementById('airRoundCheckbox').classList.contains('checked');
        const minWeight = getRawValue('airMinWeight');

        if(useHighest) {
            if(qty > 1) {
                containerVolMulti.style.display = 'block';
                document.getElementById('valVolUnit').textContent = `${formatDecimal(volWeightUnit,2)} Kg`;
                document.getElementById('labelVolTotal').textContent = `Total Volume (${qty} Pcs)`;
                document.getElementById('valVolTotal').textContent = `${formatDecimal(volWeightTotal,2)} Kg`;
            } else {
                if(volWeightTotal > 0) {
                    rowVol.style.display = 'block';
                    formulaVolume.textContent = `${p} x ${l} x ${t} / 6000`;
                    resultVolume.textContent = `${formatDecimal(volWeightTotal,2)} Kg`;
                }
            }
        } 

        if(qty > 1) {
            containerWeightMulti.style.display = 'block';
            document.getElementById('valWeightUnit').textContent = `${formatDecimal(weightUnit,2)} Kg`;
            document.getElementById('labelWeightTotal').textContent = `Total Berat (${qty} Pcs)`;
            document.getElementById('valWeightTotal').textContent = `${formatDecimal(weightTotal,2)} Kg`;
        } else {
            rowWeight.style.display = 'flex';
            document.getElementById('valWeight').textContent = `${formatDecimal(weightTotal,2)} Kg`;
        }

        let chargeableWeight = weightTotal;
        if(useHighest && volWeightTotal>weightTotal) chargeableWeight=volWeightTotal;
        else if(weightTotal===0 && volWeightTotal>0) chargeableWeight=volWeightTotal;
        
        if(minWeight > 0 && chargeableWeight < minWeight) chargeableWeight = minWeight;

        if(useRounding) {
            chargeableWeight = roundUp05(chargeableWeight);
            rowRoundedWeight.style.display = 'flex';
            document.getElementById('valRoundedWeight').textContent = `${formatDecimal(chargeableWeight, 2)} Kg`;
        }
        
        shipBaseAmount = chargeableWeight * pricePerKg;
        
        labelRate.textContent = "Biaya Per Kg";
        valRate.textContent = formatCurrency(pricePerKg);
        formulaTotal.textContent = `${formatDecimal(chargeableWeight,2)} Kg x ${formatCurrency(pricePerKg)}`;
        resultTotal.textContent = `${formatCurrency(shipBaseAmount)}`;
    } 
    else if (currentShipping === 'seaFreight') {
        detailBox.style.display = 'block';
        const pricePerCBM = getRawValue('seaPricePerCBM');
        const weightUnit = getRawValue('seaWeight');
        const weightTotal = weightUnit * qty;
        
        const p = getRawValue('seaP'); const l = getRawValue('seaL'); const t = getRawValue('seaT');
        const volumeCBMUnit = (p*l*t)/1000000;
        const volumeCBMTotal = volumeCBMUnit * qty;
        const weightEquivalentCBM = weightTotal/1000;
        
        const useHighest = document.getElementById('seaCalcCheckbox').classList.contains('checked');
        const minCBM = getRawValue('seaMinCBM');
        
        if (useHighest) {
            if (qty > 1) {
                containerWeightMulti.style.display = 'block';
                document.getElementById('valWeightUnit').textContent = `${formatDecimal(weightUnit,2)} Kg`;
                document.getElementById('labelWeightTotal').textContent = `Total Berat (${qty} Pcs)`;
                document.getElementById('valWeightTotal').textContent = `${formatDecimal(weightTotal,2)} Kg`;
            } else {
                if(weightTotal > 0) {
                    rowWeight.style.display = 'flex';
                    document.getElementById('valWeight').textContent = `${formatDecimal(weightTotal,2)} Kg`;
                }
            }
        }

        if (qty > 1) {
            containerVolMulti.style.display = 'block';
            document.getElementById('valVolUnit').textContent = `${formatDecimal(volumeCBMUnit,4)} CBM`;
            document.getElementById('labelVolTotal').textContent = `Total Volume (${qty} Pcs)`;
            document.getElementById('valVolTotal').textContent = `${formatDecimal(volumeCBMTotal,4)} CBM`;
        } else {
            rowVol.style.display = 'block';
            formulaVolume.textContent = `${p} x ${l} x ${t}`;
            resultVolume.textContent = `${formatDecimal(volumeCBMTotal,4)} CBM`;
        }

        let chargeableCBM = volumeCBMTotal;
        if(useHighest && weightEquivalentCBM>volumeCBMTotal) chargeableCBM=weightEquivalentCBM;
        if(minCBM>0 && chargeableCBM<minCBM) chargeableCBM=minCBM;
        
        shipBaseAmount = chargeableCBM * pricePerCBM;
        labelRate.textContent = "Biaya Per CBM";
        valRate.textContent = formatCurrency(pricePerCBM);
        formulaTotal.textContent = `${formatDecimal(chargeableCBM,4)} CBM x ${formatCurrency(pricePerCBM)}`;
        resultTotal.textContent = `${formatCurrency(shipBaseAmount)}`;
    }
    
    if(modes.other==='fixed') {
        const rawOther = getRawValue('otherFixed');
        otherAmount = rpMode.other === 'unit' ? rawOther * qty : rawOther;
    } else {
        const oPct=parseFloat(document.getElementById('otherRate')?.value)||0;
        if(basis.other==='modal') otherAmount=modalTotalIDR*(oPct/100); 
    }

    const actualPrice = getRawValue('actualPriceInput');
    
    // --- LOGIC V2.1.12: PROFIT = HARGA JUAL FINAL - MODAL ---
    if (actualPrice > 0) {
        document.getElementById('sellingPriceLabel').textContent = "Harga Jual Aktual";
        sellingPrice = actualPrice; 
        
        if(currentShipping==='handCarry'&&modes.handCarry==='percent'){
             if(basis.handCarry==='modal') shippingAmount=modalTotalIDR*(parseFloat(document.getElementById('hcRate')?.value)/100);
             else shippingAmount=sellingPrice*(parseFloat(document.getElementById('hcRate')?.value)/100);
        } else if(currentShipping!=='handCarry') {
            shippingAmount = shipBaseAmount;
        } else {
            shippingAmount = shipBaseAmount; 
        }
        if(modes.other==='percent' && basis.other==='jual') otherAmount=sellingPrice*(parseFloat(document.getElementById('otherRate')?.value)/100);
        profitAmount = sellingPrice - modalTotalIDR - shippingAmount - otherAmount;
    
    } else {
        document.getElementById('sellingPriceLabel').textContent = "Harga Jual Minimal";
        let num = modalTotalIDR;
        let den = 1;
        let profitVal = 0;
        
        // Hitung Biaya Tetap (yg tidak tergantung Harga Jual)
        if(modes.profit==='fixed') {
            const rawProfit = getRawValue('profitMarginFixed');
            profitVal = rpMode.profit === 'unit' ? rawProfit * qty : rawProfit;
            num += profitVal;
        } else {
            const p = parseFloat(document.getElementById('profitMargin')?.value)||0; 
            if(basis.profit==='modal') num += modalTotalIDR*(p/100); 
            else den -= (p/100); 
        }
        
        if(currentShipping==='handCarry'&&modes.handCarry==='percent'){ 
            const h=parseFloat(document.getElementById('hcRate')?.value)||0; 
            if(basis.handCarry==='modal') num += modalTotalIDR*(h/100); 
            else den -= (h/100); 
        } else {
            num += shipBaseAmount; 
        }
        
        if(modes.other==='fixed') {
            num += otherAmount; 
        } else { 
            const o=parseFloat(document.getElementById('otherRate')?.value)||0; 
            if(basis.other==='modal') num += modalTotalIDR*(o/100); 
            else den -= (o/100); 
        }
        
        if(den<=0){ document.getElementById('minSellingPriceOutput').textContent="Error (%)"; return; }
        
        // Harga Jual Sebelum Pembulatan
        let rawSellingPrice = num / den;
        
        // Lakukan Pembulatan
        sellingPrice = rawSellingPrice;
        if(currentRounding > 0) {
            sellingPrice = Math.ceil(rawSellingPrice / currentRounding) * currentRounding;
        }
        
        // HITUNG ULANG KOMPONEN BIAYA BERDASARKAN HARGA JUAL FINAL (Untuk yg berbasis % Jual)
        
        let finalShipping = 0;
        if(currentShipping==='handCarry'&&modes.handCarry==='percent'){ 
            if(basis.handCarry==='jual') finalShipping = sellingPrice*(parseFloat(document.getElementById('hcRate')?.value)/100); 
            else finalShipping = modalTotalIDR*(parseFloat(document.getElementById('hcRate')?.value)/100); 
        } else {
            finalShipping = shipBaseAmount;
        }
        shippingAmount = finalShipping;

        let finalOther = 0;
        if(modes.other==='percent'){ 
            if(basis.other==='jual') finalOther = sellingPrice*(parseFloat(document.getElementById('otherRate')?.value)/100); 
            else finalOther = modalTotalIDR*(parseFloat(document.getElementById('otherRate')?.value)/100);
        } else {
            finalOther = otherAmount;
        }
        otherAmount = finalOther;

        // Profit Akhir = Harga Jual Final - (Semua Biaya)
        profitAmount = sellingPrice - modalTotalIDR - shippingAmount - otherAmount;
    }

    document.getElementById('minSellingPriceOutput').textContent = formatCurrency(sellingPrice);
    document.getElementById('modalIDROutput').textContent = formatCurrency(modalTotalIDR);
    document.getElementById('shippingCostOutput').textContent = formatCurrency(shippingAmount);
    document.getElementById('otherCostOutput').textContent = formatCurrency(otherAmount);
    document.getElementById('profitAmountOutput').textContent = formatCurrency(profitAmount);
    
    const calcBtn = document.getElementById('calculateButton');
    const saveBtn = document.getElementById('saveImageBtn');
    if (profitAmount < 0) {
        calcBtn.textContent = "ERROR! Total Profit Margin < 0";
        calcBtn.classList.add('error-state');
        saveBtn.style.display = 'none'; 
    } else {
        calcBtn.textContent = "Kalkulasi";
        calcBtn.classList.remove('error-state');
        saveBtn.style.display = 'flex'; 
    }
    triggerResizeSequence(); 
}
