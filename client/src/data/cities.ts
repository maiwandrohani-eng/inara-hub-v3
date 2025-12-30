// Major cities by country code (ISO 3166-1 alpha-3)
export interface City {
  name: string;
  countryCode: string;
  code?: string; // Optional city code
}

export const citiesByCountry: Record<string, City[]> = {
  AFG: [
    { name: 'Kabul', countryCode: 'AFG', code: 'KBL' },
    { name: 'Herat', countryCode: 'AFG', code: 'HER' },
    { name: 'Kandahar', countryCode: 'AFG', code: 'KDH' },
    { name: 'Mazar-i-Sharif', countryCode: 'AFG', code: 'MZR' },
    { name: 'Jalalabad', countryCode: 'AFG', code: 'JLB' },
  ],
  IRQ: [
    { name: 'Baghdad', countryCode: 'IRQ', code: 'BDG' },
    { name: 'Erbil', countryCode: 'IRQ', code: 'ERB' },
    { name: 'Basra', countryCode: 'IRQ', code: 'BSR' },
    { name: 'Mosul', countryCode: 'IRQ', code: 'MSL' },
    { name: 'Kirkuk', countryCode: 'IRQ', code: 'KRK' },
  ],
  SYR: [
    { name: 'Damascus', countryCode: 'SYR', code: 'DMS' },
    { name: 'Aleppo', countryCode: 'SYR', code: 'ALP' },
    { name: 'Homs', countryCode: 'SYR', code: 'HMS' },
    { name: 'Latakia', countryCode: 'SYR', code: 'LTK' },
  ],
  JOR: [
    { name: 'Amman', countryCode: 'JOR', code: 'AMM' },
    { name: 'Irbid', countryCode: 'JOR', code: 'IRB' },
    { name: 'Zarqa', countryCode: 'JOR', code: 'ZRQ' },
  ],
  LBN: [
    { name: 'Beirut', countryCode: 'LBN', code: 'BEY' },
    { name: 'Tripoli', countryCode: 'LBN', code: 'TRP' },
    { name: 'Sidon', countryCode: 'LBN', code: 'SDN' },
  ],
  TUR: [
    { name: 'Istanbul', countryCode: 'TUR', code: 'IST' },
    { name: 'Ankara', countryCode: 'TUR', code: 'ANK' },
    { name: 'Izmir', countryCode: 'TUR', code: 'IZM' },
    { name: 'Gaziantep', countryCode: 'TUR', code: 'GAZ' },
    { name: 'Antalya', countryCode: 'TUR', code: 'ANT' },
  ],
  USA: [
    { name: 'New York', countryCode: 'USA', code: 'NYC' },
    { name: 'Los Angeles', countryCode: 'USA', code: 'LAX' },
    { name: 'Chicago', countryCode: 'USA', code: 'CHI' },
    { name: 'Houston', countryCode: 'USA', code: 'HOU' },
    { name: 'Phoenix', countryCode: 'USA', code: 'PHX' },
  ],
  GBR: [
    { name: 'London', countryCode: 'GBR', code: 'LON' },
    { name: 'Manchester', countryCode: 'GBR', code: 'MAN' },
    { name: 'Birmingham', countryCode: 'GBR', code: 'BIR' },
  ],
  FRA: [
    { name: 'Paris', countryCode: 'FRA', code: 'PAR' },
    { name: 'Lyon', countryCode: 'FRA', code: 'LYN' },
    { name: 'Marseille', countryCode: 'FRA', code: 'MRS' },
  ],
  DEU: [
    { name: 'Berlin', countryCode: 'DEU', code: 'BER' },
    { name: 'Munich', countryCode: 'DEU', code: 'MUN' },
    { name: 'Hamburg', countryCode: 'DEU', code: 'HAM' },
  ],
  CAN: [
    { name: 'Toronto', countryCode: 'CAN', code: 'TOR' },
    { name: 'Vancouver', countryCode: 'CAN', code: 'VAN' },
    { name: 'Montreal', countryCode: 'CAN', code: 'MTL' },
  ],
  AUS: [
    { name: 'Sydney', countryCode: 'AUS', code: 'SYD' },
    { name: 'Melbourne', countryCode: 'AUS', code: 'MEL' },
    { name: 'Brisbane', countryCode: 'AUS', code: 'BNE' },
  ],
  IND: [
    { name: 'Mumbai', countryCode: 'IND', code: 'BOM' },
    { name: 'Delhi', countryCode: 'IND', code: 'DEL' },
    { name: 'Bangalore', countryCode: 'IND', code: 'BLR' },
  ],
  CHN: [
    { name: 'Beijing', countryCode: 'CHN', code: 'PEK' },
    { name: 'Shanghai', countryCode: 'CHN', code: 'SHA' },
    { name: 'Guangzhou', countryCode: 'CHN', code: 'CAN' },
  ],
  PAK: [
    { name: 'Karachi', countryCode: 'PAK', code: 'KHI' },
    { name: 'Lahore', countryCode: 'PAK', code: 'LHE' },
    { name: 'Islamabad', countryCode: 'PAK', code: 'ISB' },
  ],
  EGY: [
    { name: 'Cairo', countryCode: 'EGY', code: 'CAI' },
    { name: 'Alexandria', countryCode: 'EGY', code: 'ALX' },
    { name: 'Giza', countryCode: 'EGY', code: 'GIZ' },
  ],
  SAU: [
    { name: 'Riyadh', countryCode: 'SAU', code: 'RUH' },
    { name: 'Jeddah', countryCode: 'SAU', code: 'JED' },
    { name: 'Mecca', countryCode: 'SAU', code: 'MEC' },
  ],
  KEN: [
    { name: 'Nairobi', countryCode: 'KEN', code: 'NBO' },
    { name: 'Mombasa', countryCode: 'KEN', code: 'MBA' },
  ],
  NGA: [
    { name: 'Lagos', countryCode: 'NGA', code: 'LOS' },
    { name: 'Abuja', countryCode: 'NGA', code: 'ABV' },
    { name: 'Kano', countryCode: 'NGA', code: 'KAN' },
  ],
  ZAF: [
    { name: 'Johannesburg', countryCode: 'ZAF', code: 'JNB' },
    { name: 'Cape Town', countryCode: 'ZAF', code: 'CPT' },
    { name: 'Durban', countryCode: 'ZAF', code: 'DUR' },
  ],
  BRA: [
    { name: 'São Paulo', countryCode: 'BRA', code: 'SAO' },
    { name: 'Rio de Janeiro', countryCode: 'BRA', code: 'RIO' },
    { name: 'Brasília', countryCode: 'BRA', code: 'BSB' },
  ],
  MEX: [
    { name: 'Mexico City', countryCode: 'MEX', code: 'MEX' },
    { name: 'Guadalajara', countryCode: 'MEX', code: 'GDL' },
  ],
  ARG: [
    { name: 'Buenos Aires', countryCode: 'ARG', code: 'BUE' },
    { name: 'Córdoba', countryCode: 'ARG', code: 'COR' },
  ],
};

// Get cities for a specific country
export function getCitiesByCountry(countryCode: string): City[] {
  return citiesByCountry[countryCode] || [];
}

// Get all cities
export function getAllCities(): City[] {
  return Object.values(citiesByCountry).flat();
}

