const { getAppBaseUrl } = require("../utils/app-url");

const APP_BASE_URL = getAppBaseUrl();

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createTransport() {
  if (!process.env.SMTP_HOST) return null;
  const nodemailer = require("nodemailer");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") !== "false",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

async function sendMail({ to, subject, html, text }) {
  const transport = createTransport();
  const from = process.env.MAIL_FROM || "徒步中国 <no-reply@hikingchina.com>";

  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("邮件服务尚未配置");
    }
    console.log(`[MAIL:DEV] to=${to} subject=${subject}`);
    return { preview: true };
  }

  return transport.sendMail({ from, to, subject, html, text });
}

function buildActionEmail({ title, intro, actionLabel, actionUrl, footer }) {
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeFooter = escapeHtml(footer || "如果不是你本人操作，请忽略这封邮件。");
  return `
    <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#1f2933;max-width:560px;margin:0 auto;padding:32px 24px">
      <p style="font-size:12px;letter-spacing:.12em;color:#2f6f55;text-transform:uppercase">徒步中国 · Trail China</p>
      <h1 style="font-size:22px;margin:18px 0 10px">${safeTitle}</h1>
      <p style="color:#52606d">${safeIntro}</p>
      <p style="margin:28px 0">
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#2f6f55;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${safeActionLabel}</a>
      </p>
      <p style="font-size:12px;color:#7b8794">${safeFooter}</p>
      <p style="font-size:12px;color:#7b8794;word-break:break-all">${escapeHtml(actionUrl)}</p>
    </div>
  `;
}

function verificationEmail(token) {
  const actionUrl = `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    subject: "验证你的徒步中国邮箱",
    html: buildActionEmail({
      title: "验证邮箱",
      intro: "完成邮箱验证后，即可发布帖子、评论和报名活动。",
      actionLabel: "验证邮箱",
      actionUrl,
      footer: "验证链接 24 小时内有效，且只能使用一次。",
    }),
  };
}

function passwordResetEmail(token) {
  const actionUrl = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    subject: "重置你的徒步中国密码",
    html: buildActionEmail({
      title: "重置密码",
      intro: "我们收到了你的密码重置请求。点击下方按钮设置新密码。",
      actionLabel: "设置新密码",
      actionUrl,
      footer: "重置链接 30 分钟内有效，且只能使用一次。",
    }),
  };
}

module.exports = { sendMail, verificationEmail, passwordResetEmail };
