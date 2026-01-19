import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  token_hash: string;
  redirect_to: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload));

    // Supabase Auth Hook payload structure
    const email = payload.user?.email;
    const tokenHash = payload.email_data?.token_hash;
    const redirectTo = payload.email_data?.redirect_to || "https://xpunk.lovable.app";

    if (!email) {
      throw new Error("Email not found in payload");
    }

    // Build the reset link
    const resetLink = `${redirectTo}?token_hash=${tokenHash}&type=recovery`;

    // Send email using Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "XPUNK Support <onboarding@resend.dev>",
        to: [email],
        subject: "🔐 XPUNK - Redefinição de Senha",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 255, 255, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(0, 255, 255, 0.2);">
                        <h1 style="margin: 0; font-size: 36px; font-weight: bold; color: #00ffff; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5); letter-spacing: 4px;">
                          XPUNK
                        </h1>
                        <p style="margin: 10px 0 0; color: #ff00ff; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                          Support Team
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px; text-align: center;">
                          🔐 Redefinição de Senha
                        </h2>
                        
                        <p style="margin: 0 0 20px; color: #b0b0b0; font-size: 16px; line-height: 1.6; text-align: center;">
                          Recebemos uma solicitação para redefinir a senha da sua conta XPUNK.
                        </p>
                        
                        <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 16px; line-height: 1.6; text-align: center;">
                          Clique no botão abaixo para criar uma nova senha:
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="center">
                              <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%); color: #0a0a0a; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);">
                                Redefinir Senha
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                          Se você não solicitou essa redefinição, ignore este email. Sua senha permanecerá a mesma.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(0, 255, 255, 0.2);">
                        <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                          © 2024 XPUNK. Todos os direitos reservados.
                        </p>
                        <p style="margin: 10px 0 0; color: #444444; font-size: 11px; text-align: center;">
                          Este é um email automático. Por favor, não responda.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
