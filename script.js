function calculateTrade() {

    let balance = parseFloat(document.getElementById("balance").value);
    let riskPercent = parseFloat(document.getElementById("riskPercent").value);
    let atr = parseFloat(document.getElementById("atr").value);
    let high = parseFloat(document.getElementById("high").value);
    let low = parseFloat(document.getElementById("low").value);
    let trend = document.getElementById("trend").value;

    let range = high - low;

    if (range < atr) {
        document.getElementById("result").innerHTML =
            "❌ Skip Trade: Mother bar smaller than ATR.";
        return;
    }

    let riskAmount = balance * (riskPercent / 100);
    let stopDistance = range;

    let positionSize = riskAmount / stopDistance;

    let direction = trend === "yes" ? "BUY" : "SELL";

    let entry = trend === "yes" ? high + 0.0002 : low - 0.0002;
    let stop = trend === "yes" ? low - 0.0002 : high + 0.0002;

    document.getElementById("result").innerHTML = `
        ✅ Valid Setup<br><br>
        Direction: ${direction}<br>
        Entry: ${entry.toFixed(5)}<br>
        Stop Loss: ${stop.toFixed(5)}<br>
        Risk Amount: $${riskAmount.toFixed(2)}<br>
        Position Size (Lots): ${positionSize.toFixed(2)}
    `;
}
