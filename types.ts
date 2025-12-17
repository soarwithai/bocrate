export interface ExchangeRate {
  code: string;
  name: string;
  price: string; // Keep as string to preserve formatting/precision from source
}

export interface ExchangeData {
  updateTime: string;
  rates: ExchangeRate[];
  sourceUrls?: string[];
}

export interface AppError {
  message: string;
}
