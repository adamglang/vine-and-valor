export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";

const TO_EMAIL = "info@vineandvalorsolutions.com";

export const POST: APIRoute = async ({ request, redirect }) => {
  const resendKey = import.meta.env.RESEND_API_KEY;
  if (!resendKey) {
    return new Response("Server configuration error", { status: 500 });
  }

  const resend = new Resend(resendKey);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const firstName = formData.get("f-name")?.toString().trim() || "";
  const lastName = formData.get("l-name")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const message = formData.get("message")?.toString().trim() || "";

  if (!firstName || !email || !message) {
    return new Response("Missing required fields", { status: 400 });
  }

  const honeypot = formData.get("_honey")?.toString() || "";
  if (honeypot) {
    return redirect("/?form=contact-success", 303);
  }

  const { error } = await resend.emails.send({
    from: "Vine & Valor Website <noreply@vineandvalorsolutions.com>",
    to: TO_EMAIL,
    replyTo: email,
    subject: `New contact form submission from ${firstName} ${lastName}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">First Name</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(firstName)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Last Name</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(lastName)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(message).replace(/\n/g, "<br>")}</td></tr>
      </table>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return new Response("Failed to send message. Please try again.", {
      status: 500,
    });
  }

  return redirect("/?form=contact-success", 303);
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
