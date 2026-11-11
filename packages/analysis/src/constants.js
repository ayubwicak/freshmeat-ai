export const COMMODITIES = [
  { value: 'Sapi (Beef Sirloin/Tenderloin)', label: 'Daging Sapi (Beef)' },
  { value: 'Ayam Broiler (Poultry)', label: 'Daging Ayam Broiler (Poultry)' },
  { value: 'Ikan Laut / Fillet (Seafood)', label: 'Ikan / Fillet (Seafood)' },
  { value: 'Kambing / Domba (Mutton)', label: 'Daging Kambing / Domba' },
]

export const SURFACES = [
  { value: 'normal', label: 'Kenyal & Lembap Normal' },
  { value: 'wet', label: 'Sangat Berair / Rembes' },
  { value: 'slimy', label: 'Berlendir Lengket' },
]

export const AROMAS = [
  { value: 'fresh', label: 'Segar Khas Daging' },
  { value: 'neutral', label: 'Mulai Anyir / Asam Tipis' },
  { value: 'ammonia', label: 'Menyengat / Amonia (H2S)' },
]

export const INITIAL_FORM = {
  commodity: COMMODITIES[0].value,
  temp: 3,
  hours: 1,
  surface: 'normal',
  aroma: 'fresh',
}

export const PRESETS = [
  {
    key: 'fresh_beef',
    label: '1. Sapi Segar (Grade A)',
    caption: '3 °C · 1 jam',
    tone: 'emerald',
    icon: 'CheckCircle2',
    form: { ...INITIAL_FORM },
  },
  {
    key: 'subfresh_chicken',
    label: '2. Ayam Mulai Menurun (Grade B)',
    caption: '27 °C · 5,5 jam',
    tone: 'amber',
    icon: 'AlertTriangle',
    form: {
      commodity: COMMODITIES[1].value,
      temp: 27,
      hours: 5.5,
      surface: 'normal',
      aroma: 'neutral',
    },
  },
  {
    key: 'gelonggongan',
    label: '3. Indikasi Daging Gelonggongan',
    caption: '26 °C · permukaan basah',
    tone: 'sky',
    icon: 'Droplet',
    form: {
      commodity: COMMODITIES[0].value,
      temp: 26,
      hours: 3,
      surface: 'wet',
      aroma: 'neutral',
    },
  },
  {
    key: 'spoiled_meat',
    label: '4. Daging Busuk / Reject',
    caption: '30 °C · 14 jam',
    tone: 'rose',
    icon: 'AlertTriangle',
    form: {
      commodity: COMMODITIES[0].value,
      temp: 30,
      hours: 14,
      surface: 'slimy',
      aroma: 'ammonia',
    },
  },
]

export const TEMP_ZONES = [
  { max: 0, label: 'Beku / Freezer' },
  { max: 10, label: 'Chiller' },
  { max: 24, label: 'Sejuk' },
  { max: Infinity, label: 'Suhu Ruang (Zona Kritis)' },
]

export function temperatureZone(temp) {
  return TEMP_ZONES.find((zone) => temp <= zone.max)?.label ?? 'Suhu Ruang'
}
