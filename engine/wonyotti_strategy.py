import sys
import json
import pandas as pd
import numpy as np

# Configuration
CONFIG = {
    "RSI_PERIOD": 14,
    "VOLUME_MA_PERIOD": 20,
    "Z_SCORE_THRESHOLD": 2.0,
    "FACTOR_WEIGHTS": {
        "vpd": 0.4,       # Volume-Price Divergence
        "rsi": 0.3,       # Momentum Reversal
        "z_score": 0.3    # Mean Reversion
    }
}

def load_data(raw_data):
    """Load JSON stock data into Pandas DataFrame."""
    try:
        df = pd.DataFrame(raw_data['candles'])
        # Ensure correct types
        cols = ['open', 'high', 'low', 'close', 'volume']
        for col in cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        return df
    except Exception as e:
        # If 'candles' key is missing, try loading as list
        try:
           df = pd.DataFrame(raw_data)
           return df
        except:
             print(json.dumps({"error": f"Data loading failed: {str(e)}"}))
             sys.exit(1)

def calculate_rsi(series, period=14):
    """Calculate Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

    # Avoid division by zero
    loss = loss.where(loss != 0, 0.0001)

    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_factors(df):
    """Calculate Alpha Factors based on Wonyotti Strategy."""
    # 1. Volume-Price Divergence (VPD)
    # High volume with small price movement = Potential Reversal
    df['volume_ma'] = df['volume'].rolling(window=CONFIG["VOLUME_MA_PERIOD"]).mean()
    df['price_change_pct'] = df['close'].pct_change()
    
    # VPD = (Volume / Vol_MA) / (|Price_Change| + epsilon)
    # High VPD indicates "Effort vs Result" anomaly
    epsilon = 1e-6
    # Avoid division by zero
    df['volume_ma'] = df['volume_ma'].where(df['volume_ma'] != 0, 1)

    df['vpd_factor'] = (df['volume'] / df['volume_ma']) / (df['price_change_pct'].abs() + epsilon)

    # 2. Momentum Reversal (RSI)
    df['rsi'] = calculate_rsi(df['close'], int(CONFIG["RSI_PERIOD"]))

    # 3. Z-Score Mean Reversion
    # Price deviation from 20-day MA
    ma_20 = df['close'].rolling(window=20).mean()
    std_20 = df['close'].rolling(window=20).std()
    
    # Avoid division by zero
    std_20 = std_20.where(std_20 != 0, 0.0001)

    df['z_score'] = (df['close'] - ma_20) / std_20

    return df

def generate_signal(df):
    """Generate final trading signal based on latest data point."""
    latest = df.iloc[-1]
    
    # Safely get values, handling potential NaNs
    def safe_get(key, default=0.0):
        val = latest.get(key)
        return float(val) if pd.notna(val) else default

    results = {
        "timestamp": str(latest.name) if isinstance(latest.name, (str, (pd.Timestamp))) else "Latest",
        "close_price": float(latest['close']),
        "factors": {
            "vpd": safe_get('vpd_factor', 0),
            "rsi": safe_get('rsi', 50),
            "z_score": safe_get('z_score', 0)
        },
        "score": 50,
        "action": "HOLD",
        "reason": "Analysis Completed"
    }

    # Signal Logic
    # 1. Panic Sell (Buy Signal): RSI < 30 AND High Volume (VPD > 2.0)
    if results['factors']['rsi'] < 30 and results['factors']['vpd'] > 2.0:
        results['score'] = 90
        results['action'] = "STRONG_BUY"
        results['reason'] = "패닉 셀링 포착 (RSI 과매도 + 거래량 급증)"
    
    # 2. Mean Reversion Buy: Z-Score < -2.0 (Oversold)
    elif results['factors']['z_score'] < -float(CONFIG["Z_SCORE_THRESHOLD"]):
        results['score'] = 75
        results['action'] = "BUY"
        results['reason'] = "가격 괴리 (20일 이평선 대비 과매도)"

    # 3. Momentum Sell: RSI > 70
    elif results['factors']['rsi'] > 70:
        results['score'] = 20
        results['action'] = "SELL"
        results['reason'] = "과매수 구간 진입 (RSI > 70)"

    # 4. Mean Reversion Sell: Z-Score > 2.0
    elif results['factors']['z_score'] > float(CONFIG["Z_SCORE_THRESHOLD"]):
        results['score'] = 30
        results['action'] = "SELL"
        results['reason'] = "가격 괴리 (20일 이평선 대비 과열)"

    else:
        results['score'] = 50
        results['action'] = "HOLD"
        results['reason'] = "관망 (특이 시그널 없음)"

    return results

if __name__ == "__main__":
    try:
        # Read JSON input from stdin (Node.js bridge)
        # For testing, we can pipe a file: type data.json | python engine/wonyotti_strategy.py
        input_data = sys.stdin.read()
        
        if not input_data:
            # Generate mock data if no input (for quick test)
            dates = pd.date_range(end=pd.Timestamp.now(), periods=100)
            mock_data = {
                "candles": [
                    {
                        "date": str(d),
                        "open": 100 + i,
                        "high": 105 + i,
                        "low": 95 + i,
                        "close": 102 + i,
                        "volume": 1000 + (i * 10)
                    } for i, d in enumerate(dates)
                ]
            }
            # Simulate a panic sell at the end
            mock_data["candles"][-1]["close"] = 80 # huge drop
            mock_data["candles"][-1]["volume"] = 50000 # huge volume
            
            raw_data = mock_data
        else:
            raw_data = json.loads(input_data)
        
        df = load_data(raw_data)
        
        # Need at least 20 periods for MA calculation
        if len(df) < 20:
             print(json.dumps({
                 "action": "SKIP", 
                 "reason": f"Insufficient data points ({len(df)} < 20)"
             }))
             sys.exit(0)

        df_analyzed = calculate_factors(df)
        signal = generate_signal(df_analyzed)

        print(json.dumps(signal, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": f"Script execution failed: {str(e)}"}))
        sys.exit(1)
