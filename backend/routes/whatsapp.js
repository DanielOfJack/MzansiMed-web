// NEW FILE FOR PHONE NUMBER FIX

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { getPatientById } = require('./patients');

// POST /api/whatsapp/send
router.post('/send', async (req, res) => {
  const { patientId, templateName, languageCode } = req.body;

  // Lookup patient phone number securely in backend
  const patient = await getPatientById(patientId);
  if (!patient || !patient.cellNumber) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  // Prepare WhatsApp API payload
  const payload = {
    messaging_product: "whatsapp",
    to: patient.cellNumber,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode }
    }
  };

  // Send to WhatsApp API (token should be stored securely in backend)
  const response = await fetch('https://graph.facebook.com/v22.0/<your_whatsapp_number>/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  res.json(result);
});

module.exports = router;