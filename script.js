const API_KEY = "b1bf302451ad4b6b8f1d2831df1548f4";
let chart; // global for Chart.js

async function runIBCBM() {
    const pair = document.getElementById("pair").value.toUpperCase();
    const capital = parseFloat(document.getElementById("capital").value);
    const riskPercent = parseFloat(document.getElementById("riskPercent").value);

    if (!pair || !capital) {
        document.getElementById("output").innerHTML = "⚠️ Enter both pair & capital.";
        return;
    }

    document.getElementById("output").innerHTML = "⏳ Fetching data...";

    const formattedPair = pair.slice(0,3) + "/" + pair.slice(3);
    const url = `https://api.twelvedata.com/time_series?symbol=${formattedPair}&interval=1day&outputsize=100&apikey=${API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "error") {
            document.getElementById("output").innerHTML = "⚠️ API error: " + data.message;
            return;
        }

        const candles = data.values.reverse();
        const highs = candles.map(c=>parseFloat(c.high));
        const lows = candles.map(c=>parseFloat(c.low));
        const opens = candles.map(c=>parseFloat(c.open));
        const closes = candles.map(c=>parseFloat(c.close));
        const dates = candles.map(c=>c.datetime);

        // ATR
        const atr = calcATR(highs, lows, closes, 14);

        // Mother Bar & Inside Bar
        const motherHigh = highs[closes.length-3];
        const motherLow = lows[closes.length-3];
        const insideHigh = highs[closes.length-2];
        const insideLow = lows[closes.length-2];
        const isInsideBar = (insideHigh < motherHigh && insideLow > motherLow);

        // Trend
        const ema200 = calcEMA(closes, 200);
        const lastClose = closes[closes.length-1];
        const trend = lastClose > ema200 ? "UP" : "DOWN";

        // Trade calculations
        const buyEntry = motherHigh + 0.0002;
        const sellEntry = motherLow - 0.0002;
        const buyStopLoss = sellEntry;
        const sellStopLoss = buyEntry;
        const riskAmount = capital * (riskPercent/100);
        const stopDistance = Math.abs(buyEntry - buyStopLoss);
        const positionSize = riskAmount / stopDistance;

        // Output text
        let outputHTML = `<h3>${pair} Inside Bar Setup</h3>`;
        outputHTML += `ATR(14): ${atr.toFixed(5)}<br>`;
        outputHTML += `Mother Bar: High ${motherHigh}, Low ${motherLow}<br>`;
        outputHTML += `Trend: ${trend}<br>`;
        if(!isInsideBar){
            outputHTML += "❌ No valid Inside Bar pattern in previous 2 candles.";
        } else {
            outputHTML += `✅ Valid Trade Setup!<br>`;
            outputHTML += `<strong>BUY STOP:</strong> ${buyEntry.toFixed(5)} | SL: ${buyStopLoss.toFixed(5)}<br>`;
            outputHTML += `<strong>SELL STOP:</strong> ${sellEntry.toFixed(5)} | SL: ${sellStopLoss.toFixed(5)}<br>`;
            outputHTML += `Risk Amount: $${riskAmount.toFixed(2)} | Position Size: ${positionSize.toFixed(2)} lots`;
        }
        document.getElementById("output").innerHTML = outputHTML;

        // Prepare chart data
        const chartData = dates.map((date, i)=>({
            x: date,
            o: opens[i],
            h: highs[i],
            l: lows[i],
            c: closes[i]
        }));

        // Destroy previous chart if exists
        if(chart) chart.destroy();

        chart = new Chart(document.getElementById('candlestickChart'), {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: `${pair} Daily`,
                    data: chartData,
                    borderColor: '#00f5ff'
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { 
                        ticks: { color:'#00ffcc' }
                    },
                    y: {
                        ticks: { color:'#00ffcc' }
                    }
                }
            }
        });

        // Draw ATR + Trade levels on chart
        if(isInsideBar){
            const ctx = chart.ctx;
            ctx.save();
            ctx.strokeStyle = 'green';
            ctx.beginPath();
            ctx.moveTo(0, chart.scales.y.getPixelForValue(buyEntry));
            ctx.lineTo(chart.width, chart.scales.y.getPixelForValue(buyEntry));
            ctx.stroke();

            ctx.strokeStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(0, chart.scales.y.getPixelForValue(sellEntry));
            ctx.lineTo(chart.width, chart.scales.y.getPixelForValue(sellEntry));
            ctx.stroke();
            ctx.restore();
        }

    } catch(err){
        document.getElementById("output").innerHTML = "⚠️ Fetch error: " + err.message;
    }
}

/* ===== HELPER FUNCTIONS ===== */
function calcATR(high, low, close, period){
    let trs = [];
    for(let i=1;i<high.length;i++){
        const tr1 = high[i]-low[i];
        const tr2 = Math.abs(high[i]-close[i-1]);
        const tr3 = Math.abs(low[i]-close[i-1]);
        trs.push(Math.max(tr1,tr2,tr3));
    }
    return trs.slice(0,period).reduce((a,b)=>a+b,0)/period;
}

function calcEMA(values,length){
    const k = 2/(length+1);
    let ema=[values[0]];
    for(let i=1;i<values.length;i++){
        ema.push(values[i]*k + ema[i-1]*(1-k));
    }
    return ema[ema.length-1];
}

