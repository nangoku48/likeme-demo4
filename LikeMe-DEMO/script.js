// ★あなたのAPI Key
const XUMM_API_KEY = 'bedbb175-1ab7-4fc8-a321-08d00ad4a1a5';

let xumm = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App Initializing...");

    // 1. SDK初期化
    try {
        if (typeof Xumm !== 'undefined') {
            xumm = new Xumm(XUMM_API_KEY);
            console.log("Xaman SDK Loaded");
        } else {
            alert("エラー：Xaman SDKが読み込まれていません");
            return;
        }
    } catch (e) {
        console.error(e);
    }

    // 2. 画面の表示切り替え
    const params = new URLSearchParams(window.location.search);
    const account = params.get("account");
    updateUI(account);

    // --- ボタンの動作 ---

    // 【接続ボタン】
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            // ★ここがポイント：クリックしたらまず「反応したよ！」とコンソールに出す
            console.log("👆 接続ボタンが押されました！");
            
            try {
                // ★念のため、裏に残っている古いログイン情報を消す
                await xumm.logout();
                console.log("🧹 古いセッションをクリアしました");

                // ★それからQRコードを呼び出す
                console.log("🚀 QRコードを呼び出します...");
                const result = await xumm.authorize();
                
                if (result && result.me && result.me.account) {
                    console.log("✅ ログイン成功！");
                    window.location.href = `index.html?account=${result.me.account}`;
                }
            } catch (e) {
                console.error("エラー発生:", e);
                alert("ポップアップがブロックされている可能性があります。\n画面右上のURLバーを確認してください！");
            }
        });
    }

    // 【ログアウトボタン】
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log("👋 ログアウトボタンが押されました");
            await xumm.logout();
            window.location.href = window.location.pathname;
        });
    }
});

// 表示切り替え関数
function updateUI(account) {
    const addressEl = document.getElementById("connectedAddress");
    const connectBtn = document.getElementById('connectBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const demoLinks = document.querySelectorAll("#demoLink, #moreLink");

    if (account) {
        // ログイン中
        if(addressEl) {
            addressEl.textContent = account.substring(0, 4) + "..." + account.substring(account.length - 4);
            addressEl.style.color = "#ff4757";
            addressEl.style.fontWeight = "bold";
        }
        if(connectBtn) connectBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'inline-block';

        demoLinks.forEach(link => {
            if (!link.href.includes('account=')) {
                link.href += `?account=${account}`;
            }
        });

    } else {
        // 未ログイン
        if(addressEl) {
            addressEl.textContent = "未接続";
            addressEl.style.color = "inherit";
        }
        if(connectBtn) connectBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'none';
    }
}