// Professional Email Templates for ViaLifeCoach Support System

export class EmailTemplates {
  
  // Admin Reply Template (Professional)
  static adminReply(customerName, customerEmail, adminMessage, ticketSubject, ticketDate) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">ViaLifeCoach</div>
          <div style="font-size: 16px; opacity: 0.9;">Professional Life Coaching Services</div>
        </div>

        <!-- Main Content -->
        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin-bottom: 20px;">Response to Your Support Request</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            Dear <strong>${customerName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
            Thank you for contacting ViaLifeCoach Support! We have received your support request and our team has responded to your inquiry.
          </p>

          <!-- Admin Response Box -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-left: 5px solid #3b82f6; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
              📬 Our Response:
            </h3>
            <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0; white-space: pre-wrap;">${adminMessage}</p>
          </div>

          <!-- Ticket Details -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 15px; font-size: 16px;">
              📋 Ticket Details:
            </h4>
            <div style="font-size: 14px; color: #78350f; line-height: 1.6;">
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticketSubject}</p>
              <p style="margin: 5px 0;"><strong>Created:</strong> ${ticketDate}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">In Progress</span></p>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #166534; margin-top: 0; margin-bottom: 15px; font-size: 16px;">
              🚀 Next Steps:
            </h4>
            <ul style="font-size: 14px; color: #166534; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Please review our response above</li>
              <li>Reply to this email if you need further assistance</li>
              <li>Log in to your account to view the full conversation</li>
              <li>We're here to help you succeed!</li>
            </ul>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-top: 25px;">
            We're committed to providing you with the best support experience. If you have any questions or need additional assistance, please don't hesitate to reach out.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 0;">
            Best regards,<br>
            <strong>ViaLifeCoach Support Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px 0;">
            <a href="https://vialifecoach.org" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Visit Our Website</a> | 
            <a href="mailto:support@vialifecoach.org" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Contact Support</a>
          </p>
          <p style="margin: 0; font-size: 12px;">
            This email was sent to ${customerEmail}. If you believe this was sent in error, please contact us.
          </p>
        </div>
      </div>
    `;

    const text = `
ViaLifeCoach - Response to Your Support Request

Dear ${customerName},

Thank you for contacting ViaLifeCoach Support! We have received your support request and our team has responded.

📬 OUR RESPONSE:
${adminMessage}

📋 TICKET DETAILS:
Subject: ${ticketSubject}
Created: ${ticketDate}
Status: In Progress

🚀 NEXT STEPS:
• Please review our response above
• Reply to this email if you need further assistance
• Log in to your account to view the full conversation
• We're here to help you succeed!

We're committed to providing you with the best support experience. If you have any questions or need additional assistance, please don't hesitate to reach out.

Best regards,
ViaLifeCoach Support Team

---
Visit Our Website: https://vialifecoach.org
Contact Support: support@vialifecoach.org
This email was sent to ${customerEmail}
`;

    return { html, text };
  }

  // New Ticket Confirmation Template
  static newTicketConfirmation(customerName, customerEmail, ticketSubject, ticketId) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">✅ Ticket Submitted</div>
          <div style="font-size: 16px; opacity: 0.9;">ViaLifeCoach Support System</div>
        </div>

        <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #059669; margin-bottom: 20px;">Support Ticket Received</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            Dear <strong>${customerName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
            Thank you for contacting ViaLifeCoach Support! We have successfully received your support request and our team will review it shortly.
          </p>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #166534; margin-top: 0; margin-bottom: 15px; font-size: 16px;">
              📋 Ticket Information:
            </h4>
            <div style="font-size: 14px; color: #166534; line-height: 1.6;">
              <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticketSubject}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="background-color: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Open</span></p>
              <p style="margin: 5px 0;"><strong>Response Time:</strong> Within 24 hours</p>
            </div>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Our support team will review your request and respond within 24 hours. You'll receive an email notification when we have a response for you.
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 0;">
            Best regards,<br>
            <strong>ViaLifeCoach Support Team</strong>
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">
            <a href="https://vialifecoach.org" style="color: #059669; text-decoration: none; font-weight: 600;">ViaLifeCoach</a>
          </p>
        </div>
      </div>
    `;

    const text = `
ViaLifeCoach - Support Ticket Received ✅

Dear ${customerName},

Thank you for contacting ViaLifeCoach Support! We have successfully received your support request and our team will review it shortly.

📋 TICKET INFORMATION:
Ticket ID: #${ticketId}
Subject: ${ticketSubject}
Status: Open
Response Time: Within 24 hours

Our support team will review your request and respond within 24 hours. You'll receive an email notification when we have a response for you.

Best regards,
ViaLifeCoach Support Team

---
ViaLifeCoach: https://vialifecoach.org
`;

    return { html, text };
  }

  // Quick Response Templates
  static getQuickResponses() {
    return {
      acknowledgement: "Thank you for reaching out to us. We have received your message and will get back to you shortly.",
      escalation: "Your ticket has been escalated to our senior support team for specialized attention. We'll respond within 24 hours.",
      resolved: "We believe we have resolved your issue. Please let us know if you need any further assistance.",
      information: "Thank you for your inquiry. Here's the information you requested...",
      follow_up: "We're following up on your previous request. Is there anything else we can help you with?"
    };
  }
}
