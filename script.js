// Replace with your Twelve Data API key
const API_KEY = "YOUR_TWELVE_DATA_KEY";

async function runAnalysis() {
    let pair = document.getElementById("pair").value.toUpperCase();
    let capital = parseFloat(document.getElementById("capital").value);
    let riskPercent = parseFloat(document.getElementById("riskPercent").value);

    if (!pair || !capital) {
        document.getElementById("output").innerHTML = "⚠️ Enter both pair & capital.";
        return;
    }

    document.getElementById("output").innerHTML = "⏳ Fetching data...";

    // Fetch daily candles
    let url = `https://api.twelvedata.com/time_series?symbol=${pair}&interval=1day&outputsize=100&apikey=${API_KEY}`;

    let res = await fetch(url);
    let data = await res.json();

    if (data.status === "error") {
        document.getElementById("output").innerHTML = "⚠️ Data error: " + data.message;
        return;
    }

    let candles = data.values;

    // Convert to numeric arrays
    let highs = candles.map(c => parseFloat(c.high)).reverse();
    let lows = candles.map(c => parseFloat(c.low)).reverse();
    let closes = candles.map(c => parseFloat(c.close)).reverse();

    // ATR(14)
    let atr = calcATR(highs, lows, closes, 14);

    // Last two candles
    let motherHigh = highs[closes.length - 2];
    let motherLow = lows[closes.length - 2];
    let lastClose = closes[closes.length - 1];

    // 200 EMA
    let ema200 = calcEMA(closes, 200);

    // Inside bar check
    let insideBar = (closes[closes.length - 1] < motherHigh &&
                     closes[closes.length - 1] > motherLow);

    // Trend direction
    let trend = lastClose > ema200 ? "UP" : "DOWN";

    // Output preparation
    let resultHTML = `<h3>Result for ${pair}</h3>`;
    resultHTML += `ATR(14): ${atr.toFixed(5)}<br>`;
    resultHTML += `Mother Bar: High ${motherHigh}, Low ${motherLow}<br>`;
    resultHTML += `Trend: ${trend}<br>`;

    if (!insideBar) {
        resultHTML += `❌ No valid Inside Bar pattern today.`;
        document.getElementById("output").innerHTML = resultHTML;
        return;
    }

    if ((motherHigh - motherLow) < atr) {
        resultHTML += `⚠️ Mother bar range < ATR → skip trade.`;
        document.getElementById("output").innerHTML = resultHTML;
        return;
    }

    // Trade direction based on trend
    let entry, stop, direction;
    if (trend === "UP") {
        direction = "BUY";
        entry = motherHigh + 0.0002;
        stop = motherLow - 0.0002;
    } else {
        direction = "SELL";
        entry = motherLow - 0.0002;
        stop = motherHigh + 0.0002;
    }

    // Risk & position size
    let stopDistance = Math.abs(entry - stop);
    let riskAmount = capital * (riskPercent / 100);
    let positionSize = riskAmount / stopDistance;

    resultHTML += `✅ Valid trade setup!<br>`;
    resultHTML += `Direction: ${direction}<br>`;
    resultHTML += `Entry: ${entry.toFixed(5)}<br>`;
    resultHTML += `Stop Loss: ${stop.toFixed(5)}<br>`;
    resultHTML += `Risk: $${riskAmount.toFixed(2)} (${riskPercent}%)<br>`;
    resultHTML += `Position Size: ${positionSize.toFixed(2)} lots<br>`;

    document.getElementById("output").innerHTML = resultHTML;
}

/* ===== HELPER FUNCTIONS ===== */

function calcATR(high, low, close, period) {
    let trs = [];
    let atr = 0;

    for (let i = 1; i < high.length; i++) {
        let tr1 = high[i] - low[i];
        let tr2 = Math.abs(high[i] - close[i - 1]);
        let tr3 = Math.abs(low[i] - close[i - 1]);

        trs.push(Math.max(tr1, tr2, tr3));
    }

    atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    return atr;
}

function calcEMA(values, length) {
    let k = 2 / (length + 1);
    let emaArray = [values[0]];

    for (let i = 1; i < values.length; i++) {
        emaArray.push(values[i] * k + emaArray[i - 1] * (1 - k));
    }
    return emaArray[emaArray.length - 1];
}
