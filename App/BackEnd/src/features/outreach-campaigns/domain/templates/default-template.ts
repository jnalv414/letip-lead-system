/**
 * Le Tip of Western Monmouth default outreach message template
 */
export interface MessageTemplateData {
  contactName: string;
  businessName: string;
  city: string;
}

export function getDefaultTemplate(data: MessageTemplateData): string {
  const { contactName, businessName, city } = data;

  return `Dear ${contactName},

I hope this message finds you well. I'm reaching out to introduce you to Le Tip of Western Monmouth, a premier business networking group serving ${city} and the surrounding Monmouth County area.

As a fellow local business owner, I believe ${businessName} would be a great fit for our community. Our members enjoy:

• Quality referrals from trusted business professionals
• Weekly networking meetings to build lasting relationships
• Exclusive membership (one business per category)
• Opportunities to grow your business through word-of-mouth

We meet weekly to exchange referrals and support each other's business growth. Many of our members have seen significant increases in their customer base through Le Tip connections.

Would you be interested in attending one of our meetings as a guest? I'd be happy to share more details about how Le Tip can benefit ${businessName}.

Looking forward to connecting!

Best regards,
Le Tip of Western Monmouth`;
}
