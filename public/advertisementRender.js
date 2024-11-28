document.addEventListener("DOMContentLoaded", async () => {
  const leftAdContainer = document.getElementById("ad-left");
  const rightAdContainer = document.getElementById("ad-right");
  const bottomAdContainer = document.getElementById("ad-bottom");

  try {
    console.log("Fetching advertisements...");
    const response = await fetch("/advertisement");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Received non-JSON response");
    }

    const ads = await response.json();
    console.log("Fetched ads:", ads); // 確認返回的資料

    if (Array.isArray(ads) && ads.length >= 3) {
      leftAdContainer.innerHTML = formatAd(ads[0]);
      rightAdContainer.innerHTML = formatAd(ads[1]);
      bottomAdContainer.innerHTML = formatAd(ads[2]);
    } else {
      console.warn("Not enough advertisements fetched.");
      showError(leftAdContainer, "No ads available");
      showError(rightAdContainer, "No ads available");
      showError(bottomAdContainer, "No ads available");
    }
  } catch (error) {
    console.error("Error fetching advertisements:", error.message);
    showError(leftAdContainer, "Error loading ad");
    showError(rightAdContainer, "Error loading ad");
    showError(bottomAdContainer, "Error loading ad");
  }
});

function formatAd(ad) {
  return `
    <div class="ad">
      <h3>Product: ${ad.product_id}</h3>
      <p>SellerID: ${ad.seller_id}</p>
      <p>Price: ${ad.price}</p>
    </div>
  `;
}

function showError(container, message) {
  container.innerHTML = `
    <div class="ad-error">
      <p>${message}</p>
    </div>
  `;
}
