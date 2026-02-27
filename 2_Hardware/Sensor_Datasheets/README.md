# Sensor Datasheets

## Required Datasheets

Download the following datasheets and add them to this folder:

### 1. ADS1115.pdf
**16-bit ADC Module**
- Manufacturer: Texas Instruments
- Download: https://www.ti.com/product/ADS1115
- Direct PDF: https://www.ti.com/lit/ds/symlink/ads1115.pdf

### 2. LM35.pdf
**Precision Temperature Sensor**
- Manufacturer: Texas Instruments
- Download: https://www.ti.com/product/LM35
- Direct PDF: https://www.ti.com/lit/ds/symlink/lm35.pdf

### 3. ACS712.pdf
**Hall Effect Current Sensor**
- Manufacturer: Allegro MicroSystems
- Download: https://www.allegromicro.com/en/products/sense/current-sensor-ics/zero-to-fifty-amp-integrated-conductor-sensor-ics/acs712
- Direct PDF: https://www.allegromicro.com/-/media/files/datasheets/acs712-datasheet.pdf

### 4. BMP280.pdf
**Digital Pressure Sensor**
- Manufacturer: Bosch Sensortec
- Download: https://www.bosch-sensortec.com/products/environmental-sensors/pressure-sensors/bmp280/
- Direct PDF: https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmp280-ds001.pdf

### 5. NEO-6M.pdf
**GPS Module**
- Manufacturer: u-blox
- Download: https://www.u-blox.com/en/product/neo-6-series
- Direct PDF: https://www.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_(GPS.G6-HW-09005).pdf

## How to Add

1. Download each PDF from the links above
2. Save them in this folder with the exact names listed
3. Commit and push:

```bash
git add 2_Hardware/Sensor_Datasheets/*.pdf
git commit -m "Add sensor datasheets"
git push origin main
```

## Checklist

- [ ] ADS1115.pdf
- [ ] LM35.pdf
- [ ] ACS712.pdf
- [ ] BMP280.pdf
- [ ] NEO-6M.pdf

## Alternative

If you cannot download the PDFs, you can create a text file listing the datasheet URLs:

```bash
echo "ADS1115: https://www.ti.com/lit/ds/symlink/ads1115.pdf" > Datasheet_Links.txt
echo "LM35: https://www.ti.com/lit/ds/symlink/lm35.pdf" >> Datasheet_Links.txt
echo "ACS712: https://www.allegromicro.com/-/media/files/datasheets/acs712-datasheet.pdf" >> Datasheet_Links.txt
echo "BMP280: https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmp280-ds001.pdf" >> Datasheet_Links.txt
echo "NEO-6M: https://www.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_(GPS.G6-HW-09005).pdf" >> Datasheet_Links.txt
```
