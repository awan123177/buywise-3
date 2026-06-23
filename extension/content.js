// Basic UI injection to detect price and show BuyWise Banner
console.log("BuyWise Extension Loaded on:", window.location.hostname);

function extractProductInfo() {
  let title = "";
  let price = "";
  
  if (window.location.hostname.includes("amazon.in")) {
    title = document.getElementById("productTitle")?.innerText?.trim() || "";
    price = document.querySelector(".a-price-whole")?.innerText?.trim() || "";
  } else if (window.location.hostname.includes("flipkart.com")) {
    title = document.querySelector(".B_NuCI")?.innerText?.trim() || document.querySelector(".VU-TZE")?.innerText?.trim() || "";
    price = document.querySelector("._30jeq3._16Jk6d")?.innerText?.trim() || document.querySelector(".Nx9bqj.CxhGGd")?.innerText?.trim() || "";
  }

  return { title, price };
}

function injectBanner(info) {
  if (!info.title || !info.price) return;

  const banner = document.createElement("div");
  banner.style.position = "fixed";
  banner.style.top = "10px";
  banner.style.right = "10px";
  banner.style.backgroundColor = "#111";
  banner.style.color = "#fff";
  banner.style.padding = "16px";
  banner.style.borderRadius = "12px";
  banner.style.zIndex = "999999";
  banner.style.boxShadow = "0 10px 25px rgba(0,0,0,0.5)";
  banner.style.border = "1px solid rgba(255,59,48,0.3)";
  banner.style.fontFamily = "sans-serif";
  banner.style.maxWidth = "300px";

  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <h3 style="margin: 0; font-size: 14px; font-weight: 900; color: #FF3B30; letter-spacing: 1px; text-transform: uppercase;">BuyWise Alert</h3>
      <button id="bw-close" style="background: none; border: none; color: #aaa; cursor: pointer;">✕</button>
    </div>
    <p style="margin: 0 0 12px 0; font-size: 12px; color: #ccc;">Checking prices for: <strong style="color: #fff;">${info.title.substring(0, 30)}...</strong></p>
    <a href="http://localhost:3000/?q=${encodeURIComponent(info.title)}" target="_blank" style="display: block; text-align: center; background: #FF3B30; color: #fff; text-decoration: none; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Compare on BuyWise</a>
  `;

  document.body.appendChild(banner);

  document.getElementById("bw-close").addEventListener("click", () => {
    banner.remove();
  });
}

// Run after a short delay to allow page load
setTimeout(() => {
  const info = extractProductInfo();
  injectBanner(info);
}, 2500);
