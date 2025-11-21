// app.js

// ★あなたのAPI Key
const XUMM_API_KEY = 'bedbb175-1ab7-4fc8-a321-08d00ad4a1a5';

// ★あなたのアドレス（自分宛て送金用）
const SHOP_WALLET = "r4t7MbqVYAPDN9nshQ8MyswsfHjCZrVwbJ"; 

let xumm = null;
if (typeof Xumm !== 'undefined') {
    xumm = new Xumm(XUMM_API_KEY);
    console.log("Xaman SDK initialized");
}

const state = {
  connected: false,
  account: null,
  inventory: { camera_basic: 0, lens_comment: 0, film_shots: 0 },
  history: []
};

const products = [
  { id: "camera_basic", name: "📸 Basic Camera NFT", desc: "Selfie to Earn 必須アイテム", price: 5 },
  { id: "lens_comment", name: "🔍 Social Lens", desc: "コメント機能解放", price: 2 },
  { id: "film_10", name: "🎞 Film Pack", desc: "フィルム10枚", price: 1 },
];

const connectBtn = document.getElementById("connectBtn");
const logoutBtn = document.getElementById("logoutBtn");
const statusEl = document.getElementById("status");
const accountEl = document.getElementById("account");
const productListEl = document.getElementById("productList");
const historyListEl = document.getElementById("historyList");
const dashboardEl = document.getElementById("dashboard");

document.addEventListener("DOMContentLoaded", () => {
    renderProducts();
    renderDashboard();
    checkLogin();
});

async function checkLogin() {
    if(!xumm) return;
    try {
        const account = await xumm.user.account;
        if (account) onLoginSuccess(account);
    } catch(e) { console.log("Not logged in"); }
}

if (connectBtn) {
    connectBtn.addEventListener("click", async () => {
        if(!xumm) return alert("SDKエラー");
        try {
            const result = await xumm.authorize();
            if (result && result.me && result.me.account) {
                onLoginSuccess(result.me.account);
            }
        } catch (e) { console.error(e); }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        if(xumm) await xumm.logout();
        state.connected = false;
        state.account = null;
        renderUI_LoggedOut();
    });
}

function onLoginSuccess(account) {
    state.connected = true;
    state.account = account;
    statusEl.textContent = "ステータス: 接続済み (Testnet) ✅";
    statusEl.style.color = "#2ecc71";
    accountEl.textContent = `アドレス: ${account}`;
    connectBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    renderDashboard();
}

function renderUI_LoggedOut() {
    statusEl.textContent = "ステータス: 未接続";
    statusEl.style.color = "#f5f5f5";
    accountEl.textContent = "アドレス: （未接続）";
    connectBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    renderDashboard();
}

function renderProducts() {
    if (!productListEl) return;
    productListEl.innerHTML = "";
    products.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="product-header">
                <span class="product-name">${p.name}</span>
                <span class="product-price">${p.price} XRP</span>
            </div>
            <p class="product-desc">${p.desc}</p>
            <button class="btn-buy" onclick="handleRealBuy('${p.id}')">
                🛒 購入する (署名)
            </button>
        `;
        productListEl.appendChild(div);
    });
}

// --- ★ここが診断機能付きの購入処理 ---
window.handleRealBuy = async function(productId) {
    if (!state.connected) return alert("まずはウォレットを接続してください！");

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if(!confirm(`${product.name} を購入しますか？`)) return;

    statusEl.textContent = "通信中... ⏳";

    try {
        // 送金データ
        const payload = {
            TransactionType: "Payment",
            Destination: SHOP_WALLET, // 自分宛て
            Amount: (product.price * 1000000).toString(),
            DestinationTag: 2025 // ★これが「自分宛て」を通すための鍵！
        };

        console.log("送信データ:", payload);

        // Xamanに送信
        const created = await xumm.payload.create(payload);
        
        // ★ここがポイント：作成できたかチェック
        if (!created) {
            alert("エラー：注文書の作成に失敗しました（理由はコンソールを見てください）");
            return;
        }

        console.log("作成成功:", created);

        // 正常なら署名画面を開く
        xumm.xapp.openSignRequest(created);

        const subscription = await xumm.payload.subscribe(created, (event) => {
            if (typeof event.data.signed !== 'undefined') return event.data;
        });

        if (subscription.created.signed) {
            statusEl.textContent = "決済完了！🎉";
            alert("✅ 成功しました！");
            
            if (productId === 'camera_basic') state.inventory.camera_basic++;
            if (productId === 'lens_comment') state.inventory.lens_comment++;
            if (productId === 'film_10') state.inventory.film_shots += 10;

            addHistory(product.name, product.price, subscription.payload.txid);
            renderDashboard();
        } else {
            statusEl.textContent = "キャンセルされました";
        }

    } catch (e) {
        console.error("通信エラー詳細:", e);
        // ★エラーの内容を画面に出す
        alert("【通信エラー】\nXamanがリクエストを拒否しました。\n\n原因の可能性:\n・APIキーが無効\n・アドレスが間違っている\n\nコンソールの赤文字を確認してください！");
        statusEl.textContent = "エラー発生 ❌";
    }
};

function addHistory(name, price, txHash) {
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
        <div class="history-header">
            <span style="font-weight:bold;">${name}</span>
            <span class="history-time">${timeStr}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span class="badge badge-success">決済成功</span>
            <span>-${price} XRP</span>
        </div>
        <div style="font-size:0.7rem; color:#555; margin-top:4px;">
            TX: ${txHash.substring(0, 10)}...
        </div>
    `;
    if (historyListEl) historyListEl.prepend(div);
}

function renderDashboard() {
  if (!dashboardEl) return;
  const inv = state.inventory;
  dashboardEl.innerHTML = `
    <div class="dash-block"><h3>📷 カメラNFT</h3><div class="dash-value">${inv.camera_basic}</div></div>
    <div class="dash-block"><h3>🔎 レンズ機能</h3><div class="dash-value">${inv.lens_comment}</div></div>
    <div class="dash-block"><h3>🎞 フィルム残</h3><div class="dash-value">${inv.film_shots}</div></div>
  `;
}
