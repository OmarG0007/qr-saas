export function getApprovalEmail(restaurantName: string) {
  return {
    subject: `Your restaurant "${restaurantName}" has been approved!`,
    text: `Congratulations! Your restaurant "${restaurantName}" has been approved. You can now access your dashboard and start managing your menu.`,
    html: `
      <h1>Congratulations!</h1>
      <p>Your restaurant <strong>${restaurantName}</strong> has been approved.</p>
      <p>You can now access your dashboard and start managing your menu.</p>
      <a href="${process.env.WASP_WEB_CLIENT_URL}/home-redirect">Go to Dashboard</a>
    `,
  };
}

export function getRejectionEmail(restaurantName: string, reason: string) {
  return {
    subject: `Update regarding your restaurant application: ${restaurantName}`,
    text: `Unfortunately, your application for "${restaurantName}" was not approved for the following reason: ${reason}. You can update your details and re-submit if applicable.`,
    html: `
      <h1>Application Update</h1>
      <p>Unfortunately, your application for <strong>${restaurantName}</strong> was not approved.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You can update your details and re-submit if applicable.</p>
      <a href="${process.env.WASP_WEB_CLIENT_URL}/home-redirect">View Details</a>
    `,
  };
}
