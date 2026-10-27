import base64
import os
from html import escape
from urllib.parse import quote
import sib_api_v3_sdk
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.environ["BREVO_API_KEY"]
EMAIL_FROM = os.environ["EMAIL_FROM"]
BRAND_NAME = os.getenv("BRAND_NAME", "ClientDesk")

FRONTEND_URI = (
    os.getenv("FRONTEND_REDIRECT_URI")
    or os.getenv("FRONTEND_URI")
    or "http://localhost:5173"
).rstrip("/")

EMAIL_VERIFY_EXPIRE_MINUTES = int(
    os.getenv("EMAIL_VERIFY_EXPIRE_MINUTES", "60")
)

WORDMARK = ("Client", "Desk")
TAGLINE = "Your clients, deals and payments in one place"
DEMO_NOTE = "ClientDesk is a portfolio project built for demonstration."

# Brand colors
INDIGO_600 = "#4F46E5"
INDIGO_700 = "#4338CA"
INDIGO_100 = "#E0E7FF"
INDIGO_50 = "#EEF2FF"
INK = "#0F172A"
BODY = "#334155"
MUTED = "#64748B"
LINE = "#E2E8F0"
BG = "#F1F5F9"
SURFACE = "#F8FAFC"

FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


def send_email(
    to: str,
    subject: str,
    text: str,
    html: str | None = None,
    attachments: list[dict] | None = None,
) -> None:
    """Send a transactional email through Brevo."""

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = BREVO_API_KEY

    # Supports either:
    # ClientDesk <verified@example.com>
    # verified@example.com
    if "<" in EMAIL_FROM and ">" in EMAIL_FROM:
        sender_name, sender_email = EMAIL_FROM.rsplit("<", 1)
        sender_name = sender_name.strip().strip('"')
        sender_email = sender_email.rstrip(">").strip()
    else:
        sender_name = BRAND_NAME
        sender_email = EMAIL_FROM.strip()

    # The Python SDK uses snake_case names (text_content, html_content),
    # not the camelCase names shown in Brevo's REST documentation.
    params = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": to}],
        "subject": subject,
        "text_content": text,
    }

    if html:
        params["html_content"] = html

    if attachments:
        params["attachment"] = [
            {
                "name": item["filename"],
                "content": base64.b64encode(bytes(item["content"])).decode("ascii"),
            }
            for item in attachments
        ]

    api_client = sib_api_v3_sdk.ApiClient(configuration)
    api = sib_api_v3_sdk.TransactionalEmailsApi(api_client)
    api.send_transac_email(sib_api_v3_sdk.SendSmtpEmail(**params))
    response = api.send_transac_email(sib_api_v3_sdk.SendSmtpEmail(**params))
    print(f"Brevo accepted email: from={sender_email} to={to} message_id={response.message_id}")


def _features_block(features: list[tuple[str, str]]) -> str:
    rows = "".join(
        f"""
        <tr>
          <td width="4" bgcolor="{INDIGO_600}"
              style="width:4px;font-size:0;line-height:0;">
            &nbsp;
          </td>
          <td style="padding:12px 16px;font-family:{FONT};
                     background:{SURFACE};">
            <p style="margin:0;font-size:15px;line-height:22px;
                      font-weight:600;color:{INK};">
              {escape(title)}
            </p>
            <p style="margin:2px 0 0;font-size:14px;line-height:21px;
                      color:{MUTED};">
              {escape(desc)}
            </p>
          </td>
        </tr>
        <tr>
          <td colspan="2"
              style="height:8px;font-size:0;line-height:0;">
            &nbsp;
          </td>
        </tr>
        """
        for title, desc in features
    )

    return f"""
    <tr>
      <td style="padding:8px 40px 28px;">
        <p style="margin:0 0 12px;font-family:{FONT};font-size:14px;
                  font-weight:600;color:{INK};">
          What's waiting for you
        </p>
        <table role="presentation" width="100%"
               cellpadding="0" cellspacing="0" border="0">
          {rows}
        </table>
      </td>
    </tr>
    """


def render_email(
    *,
    preheader: str,
    heading: str,
    paragraphs: list[str],
    notice: str,
    button_text: str,
    button_url: str,
    footnote: str,
    features: list[tuple[str, str]] | None = None,
) -> str:
    """Build responsive, table-based HTML for email clients."""

    url = escape(button_url, quote=True)

    body = "".join(
        f"""
        <p style="margin:0 0 16px;font-size:16px;line-height:26px;
                  color:{BODY};">
          {escape(paragraph)}
        </p>
        """
        for paragraph in paragraphs
    )

    features_html = _features_block(features) if features else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>{escape(heading)}</title>
</head>
<body style="margin:0;padding:0;background:{BG};">

  <div style="display:none;max-height:0;overflow:hidden;opacity:0;
              color:{BG};">
    {escape(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0"
         cellspacing="0" border="0" bgcolor="{BG}"
         style="background:{BG};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="100%" cellpadding="0"
               cellspacing="0" border="0"
               style="max-width:580px;background:#FFFFFF;
                      border:1px solid {LINE};border-radius:12px;
                      overflow:hidden;">

          <tr>
            <td height="6" bgcolor="{INDIGO_600}"
                style="height:6px;font-size:0;line-height:0;">
              &nbsp;
            </td>
          </tr>

          <tr>
            <td align="center"
                style="padding:32px 32px 4px;font-family:{FONT};
                       font-size:24px;font-weight:700;
                       letter-spacing:-0.5px;color:{INK};">
              {escape(WORDMARK[0])}<span style="color:{INDIGO_600};">{escape(WORDMARK[1])}</span>
            </td>
          </tr>

          <tr>
            <td align="center"
                style="padding:0 32px 28px;font-family:{FONT};
                       font-size:13px;color:{MUTED};">
              {escape(TAGLINE)}
            </td>
          </tr>

          <tr>
            <td align="center" bgcolor="{INDIGO_600}"
                style="background:{INDIGO_600};padding:48px 40px;">
              <h1 style="margin:0;font-family:{FONT};font-size:30px;
                         line-height:38px;font-weight:700;
                         letter-spacing:-0.5px;color:#FFFFFF;">
                {escape(heading)}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 8px;font-family:{FONT};">
              {body}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:12px 40px 32px;">
              <table role="presentation" cellpadding="0"
                     cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="{INDIGO_600}"
                      style="border-radius:8px;">
                    <a href="{url}" target="_blank"
                       style="display:inline-block;padding:16px 44px;
                              font-family:{FONT};font-size:16px;
                              font-weight:600;color:#FFFFFF;
                              text-decoration:none;border-radius:8px;
                              background:{INDIGO_600};
                              border:1px solid {INDIGO_700};">
                      {escape(button_text)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {features_html}

          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0"
                     cellspacing="0" border="0"
                     style="background:{INDIGO_50};
                            border:1px solid {INDIGO_100};
                            border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;font-family:{FONT};
                             font-size:14px;line-height:21px;color:{INK};">
                    {escape(notice)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 32px;font-family:{FONT};">
              <p style="margin:0;font-size:13px;line-height:20px;
                        color:{MUTED};">
                Button not working? Copy and paste this link into
                your browser:
                <a href="{url}"
                   style="color:{INDIGO_600};word-break:break-all;">
                  {url}
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td bgcolor="{SURFACE}"
                style="background:{SURFACE};border-top:1px solid {LINE};
                       padding:24px 40px 28px;font-family:{FONT};">
              <p style="margin:0 0 8px;font-size:12px;line-height:18px;
                        color:{MUTED};">
                {escape(footnote)}
              </p>
              <p style="margin:0;font-size:12px;line-height:18px;
                        color:{MUTED};">
                {escape(DEMO_NOTE)}
              </p>
            </td>
          </tr>

        </table>

        <p style="margin:20px 0 0;font-family:{FONT};font-size:12px;
                  color:{MUTED};">
          &copy; {escape(BRAND_NAME)}
        </p>

      </td>
    </tr>
  </table>
</body>
</html>"""


def send_signup_email(to: str, raw_token: str) -> None:
    """Send the account email-verification link."""

    link = (
        f"{FRONTEND_URI}/register/complete"
        f"?token={quote(raw_token, safe='')}"
    )
    minutes = EMAIL_VERIFY_EXPIRE_MINUTES

    features = [
        ("Contacts", "Keep every client's details and notes in one place."),
        ("Deals", "Track each opportunity from first contact to closed."),
        (
            "Transactions and reports",
            "Record payments and see your revenue by month.",
        ),
    ]

    html = render_email(
        preheader=(
            f"Confirm your email to finish creating your "
            f"{BRAND_NAME} account."
        ),
        heading="Confirm your email address",
        paragraphs=[
            f"Thank you for signing up for {BRAND_NAME}. "
            "Confirm your email address to finish creating your "
            "account and start organizing your clients."
        ],
        notice=(
            f"This link is valid for {minutes} minutes "
            "and can only be used once."
        ),
        button_text="Confirm my email",
        button_url=link,
        footnote=(
            "If you didn't request this, you can safely ignore "
            "this email. No account will be created."
        ),
        features=features,
    )

    feature_text = "\n".join(
        f"- {title}: {desc}" for title, desc in features
    )

    text = (
        f"Confirm your email address for {BRAND_NAME}\n\n"
        f"Thank you for signing up for {BRAND_NAME}. "
        "Confirm your email address to finish creating your account:\n\n"
        f"{link}\n\n"
        f"This link is valid for {minutes} minutes and can only "
        "be used once.\n\n"
        f"What's waiting for you:\n{feature_text}\n\n"
        "If you didn't request this, you can safely ignore this email. "
        "No account will be created.\n\n"
        f"{DEMO_NOTE}"
    )

    send_email(
        to=to,
        subject=f"Confirm your email for {BRAND_NAME}",
        text=text,
        html=html,
    )


def send_report_email(
    to: str,
    pdf: bytes,
    filename: str,
    range_label: str,
    user_name: str,
) -> None:
    """Send a sales report email with its PDF attachment."""

    html = render_email(
        preheader=(
            f"Your {BRAND_NAME} sales report "
            f"({range_label}) is attached."
        ),
        heading="Your sales report",
        paragraphs=[
            f"{user_name} shared the {BRAND_NAME} sales report "
            f"for {range_label.lower()} with you. "
            "The PDF is attached to this email."
        ],
        notice=(
            "The report covers offers by stage, paid revenue "
            "and the top contacts."
        ),
        button_text=f"Open {BRAND_NAME}",
        button_url=FRONTEND_URI,
        footnote=(
            f"You received this email because someone shared "
            f"a {BRAND_NAME} report with you."
        ),
    )

    text = (
        f"{user_name} shared the {BRAND_NAME} sales report "
        f"for {range_label.lower()} with you.\n"
        "The PDF is attached to this email.\n\n"
        f"{DEMO_NOTE}"
    )

    send_email(
        to=to,
        subject=f"{BRAND_NAME} sales report: {range_label}",
        text=text,
        html=html,
        attachments=[
            {
                "filename": filename,
                "content": pdf,
            }
        ],
    )
