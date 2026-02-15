export class NumberFormatter {
  static formatCurrency(amount: number, symbol: string = '$'): string {
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  static formatPercent(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  static formatNumber(num: number, decimals: number = 0): string {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  static abbreviate(num: number): string {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  }

  static isValidNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
}
