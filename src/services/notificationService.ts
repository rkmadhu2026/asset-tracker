
export const sendEmailNotification = async (subject: string, message: string) => {
  // In a real application, this would call a backend API that sends emails via SendGrid, Mailgun, etc.
  console.log(`Sending email to network-team@acme.com: ${subject} - ${message}`);
  // Mocking the API call
  return new Promise((resolve) => setTimeout(resolve, 500));
};
