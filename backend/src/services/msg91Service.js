const axios = require('axios');
require('dotenv').config();

/**
 * Sends an OTP via MSG91 (Reuses the already approved WhatsApp Template)
 * @param {string} to - The recipient's mobile number
 * @param {string} otp - The 6-digit OTP code
 */
const sendWhatsAppOTP = async (to, otp) => {
    console.log(`📡 [MSG91]: Sending OTP Using Template: otp_verification_stardust`);
    
    // We reuse our new template function since it's already configured 
    // for the user's specific account structure.
    return await sendWhatsAppTemplate(to, 'otp_verification_stardust', {
        otp: otp
    });
};

/**
 * Sends a WhatsApp message using a PRE-APPROVED TEMPLATE via MSG91 (Bulk Outbound API)
 * @param {string} to - Recipient mobile number
 * @param {string} templateName - The name of the approved template
 * @param {Object} variables - Dictionary of variable values (will be mapped to body_1, body_2, etc.)
 */
const sendWhatsAppTemplate = async (to, templateName, variables) => {
    if (!process.env.MSG91_AUTH_KEY) {
        console.warn('⚠️ MSG91 API KEYS NOT CONFIGURED. MOCKING TEMPLATE:', templateName);
        return { message: 'mock_sent' };
    }

    let cleanNumber = to.replace(/\D/g, '');

    try {
        let bodyComponents = {};

        // EXACT Mappings based on Template Specifications
        if (templateName === 'stardust_succession_notice') {
            bodyComponents = {
                "body_verification_url": { "type": "text", "value": variables.verification_url, "parameter_name": "verification_url" },
                "body_owner_name": { "type": "text", "value": variables.owner_name, "parameter_name": "owner_name" },
                "body_nominee_name": { "type": "text", "value": variables.nominee_name, "parameter_name": "nominee_name" }
            };
        } else if (templateName === 'stardust_security_pulse_v2') {
            bodyComponents = {
                "body_owner_name": { "type": "text", "value": variables.owner_name, "parameter_name": "owner_name" },
                "body_app_url": { "type": "text", "value": variables.app_url, "parameter_name": "app_url" }
            };
        } else if (templateName === 'succession_guide_final_v1') {
            bodyComponents = {
                "body_owner_name": { "type": "text", "value": variables.owner_name, "parameter_name": "owner_name" }
            };
        } else if (templateName === 'succession_code_auth_stardust' || templateName === 'otp_verification_stardust') {
            const code = variables.otp || variables.security_code || variables.body_1 || "000000";
            bodyComponents = {
                "body_1": { 
                    "type": "text", 
                    "value": code,
                    "parameter_name": "otp" 
                },
                "button_1": { 
                    "subtype": "url", 
                    "type": "text", 
                    "value": code
                }
            };
        } else {
            // Generic Fallback
            Object.entries(variables).forEach(([key, val], index) => {
                bodyComponents[`body_${index + 1}`] = {
                    type: 'text',
                    value: String(val)
                };
            });
        }

        const payload = {
            integrated_number: process.env.MSG91_WHATSAPP_NUMBER || "917204342233",
            content_type: "template",
            payload: {
                messaging_product: "whatsapp",
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: "en",
                        policy: "deterministic"
                    },
                    namespace: process.env.MSG91_WHATSAPP_NAMESPACE || "b05d09f6_1d90_4a1b_8d0a_d5d650046fb0",
                    to_and_components: [
                        {
                            to: [cleanNumber],
                            components: bodyComponents
                        }
                    ]
                }
            }
        };

        const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', payload, {
            headers: {
                'authkey': process.env.MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ [MSG91 WHATSAPP BULK] Sent Template: ${templateName} to ${cleanNumber}`);
        return response.data;
    } catch (err) {
        console.error('❌ [MSG91 WHATSAPP BULK ERROR]:', err.response?.data || err.message);
        return { error: err.message };
    }
};

module.exports = { sendWhatsAppOTP, sendWhatsAppTemplate };
