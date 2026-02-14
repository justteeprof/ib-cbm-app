// Replace with your Twelve Data API key
const API_KEY = "b1bf302451ad4b6b8f1d2831df1548f4";

async function runIBCBM() {
    const pair = document.getElementById("pair").value.toUpperCase();
    const capital = parseFloat(document.getElementById("capital").value);
    const riskPercent = parseFloat(document.getElementById("riskPercent").value);

    if (!pair || !capital) {
        document.getElementById("output").innerHTML = "⚠️ Enter both pair & capital.";
        return;
    }

    document.getElementById("output").innerHTML = "⏳ Fetching data...";

    // Format Forex pair: EURUSD -> EUR/USD
    const formattedPair = pair.slice(0,3) + "/" + pair.slice(3);
    const url = `https://api.twelvedata.com/time_series?symbol=${formattedPair}&interval=1day&outputsize=100&apikey=${API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "error") {
            document.getElementById("output").innerHTML = "⚠️ API error: " + data.message;
            return;
        }

        const candles = data.values.reverse(); // earliest first
        const highs = candles.map(c => parseFloat(c.high));
        const lows = candles.map(c => parseFloat(c.low));
        const closes = candles.map(c => parseFloat(c.close));

        // Check inside bar: current candle vs 2 candles before
        const motherHigh = highs[closes.length - 3];
        const motherLow = lows[closes.length - 3];
        const insideHigh = highs[closes.length - 2];
        const insideLow = lows[closes.length - 2];

        const isInsideBar = (insideHigh < motherHigh && insideLow > motherLow);

        // ATR(14)
        const atr = calcATR(highs, lows, closes, 14);

        // Trend (last candle close vs 200 EMA)
        const ema200 = calcEMA(closes, 200);
        const lastClose = closes[closes.length -1];
        const trend = lastClose > ema200 ? "UP" : "DOWN";

        let outputHTML = `<h3>${pair} Inside Bar Analysis</h3>`;
        outputHTML += `ATR(14): ${atr.toFixed(5)}<br>`;
        outputHTML += `Mother Bar: High ${motherHigh}, Low ${motherLow}<br>`;
        outputHTML += `Trend: ${trend}<br>`;

        if (!isInsideBar) {
            outputHTML += "❌ No Inside Bar detected in previous 2 candles.";
            document.getElementById("output").innerHTML = outputHTML;
            return;
        }

        if ((motherHigh - motherLow) < atr) {
            outputHTML += "⚠️ Mother bar range < ATR → skip trade.";
            document.getElementById("output").innerHTML = outputHTML;
            return;
        }

        // Trade Generation
        const buyEntry = motherHigh + 0.0002;
        const sellEntry = motherLow - 0.0002;
        const buyStopLoss = sellEntry;
        const sellStopLoss = buyEntry;

        const riskAmount = capital * (riskPercent/100);
        const stopDistance = Math.abs(buyEntry - buyStopLoss); // same for sell
        const positionSize = riskAmount / stopDistance;

        outputHTML += `✅ Valid Inside Bar Trade Setup!<br><br>`;
        outputHTML += `<strong>BUY STOP</strong> at ${buyEntry.toFixed(5)} | Stop Loss: ${buyStopLoss.toFixed(5)}<br>`;
        outputHTML += `<strong>SELL STOP</strong> at ${sellEntry.toFixed(5)} | Stop Loss: ${sellStopLoss.toFixed(5)}<br>`;
        outputHTML += `Risk Amount: $${riskAmount.toFixed(2)} (${riskPercent}%)<br>`;
        outputHTML += `Position Size: ${positionSize.toFixed(2)} lots`;

        document.getElementById("output").innerHTML = outputHTML;

    } catch (err) {
        document.getElementById("output").innerHTML = "⚠️ Fetch error: " + err.message;
    }
}

/* ===== HELPER FUNCTIONS ===== */

function calcATR(high, low, close, period) {
    let trs = [];
    for (let i = 1; i < high.length; i++) {
        const tr1 = high[i] - low[i];
        const tr2 = Math.abs(high[i] - close[i -1]);
        const tr3 = Math.abs(low[i] - close[i -1]);
        trs.push(Math.max(tr1,tr2,tr3));
    }
    return trs.slice(0,period).reduce((a,b)=>a+b,0)/period;
}

function calcEMA(values, length) {
    const k = 2/(length+1);
    let emaArray = [values[0]];
    for (let i = 1; i < values.length; i++) {
        emaArray.push(values[i]*k + emaArray[i-1]*(1-k));
    }
    return emaArray[emaArray.length -1];
}
=> a + b, 0) / period;
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


