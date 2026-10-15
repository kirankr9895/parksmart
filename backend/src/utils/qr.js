import QRCode from 'qrcode';

/**
 * Generate a base64 Data URL for a QR Code
 * @param {string} payload 
 * @returns {Promise<string>} Data URL (image/png)
 */
export async function generateQRCodeDataURL(payload) {
  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
      color: {
        dark: '#0f172a', // Navy dark
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

/**
 * Generate a cryptographically unique verification payload
 */
export function buildQRToken(bookingRef, reservationId, userId) {
  return `PARKSMART|${bookingRef}|${reservationId}|${userId}`;
}
