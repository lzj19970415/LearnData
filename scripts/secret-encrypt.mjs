#!/usr/bin/env node
/**
 * 私密页加密脚本
 *
 * 读取 ..\..\私密页备份\如何帮助客户上传文件.md（明文原件，只在本机），
 * 用 PBKDF2-SHA256(600000) + AES-256-GCM 加密成密文，
 * 写入 src/huawei/如何帮助客户上传文件.md 的 cipher 属性。
 *
 * 线上页面与 GitHub 仓库里自始至终只有密文，密码不落在任何文件里。
 *
 * 密码来源：
 *   1. 环境变量 SECRET_PWD（供自动化调用）；
 *   2. 交互式隐藏输入（直接双击 重新加密私密页.bat 时）。
 */
import { readFileSync, writeFileSync } from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import readline from "node:readline";

const here = path.dirname(fileURLToPath(import.meta.url));
const BACKUP = path.resolve(here, "../../私密页备份/如何帮助客户上传文件.md");
const PAGE = path.resolve(here, "../src/huawei/如何帮助客户上传文件.md");
const ITERATIONS = 600000;

// ---------- 极简 Markdown → HTML（够用即可，复杂格式找智能体） ----------
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s) {
  let t = escapeHtml(s);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  t = t.replace(
    /&lt;(https?:\/\/[^\s&]+)&gt;/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return t;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let list = null; // null | "ul" | "ol"
  let para = [];

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join("<br />"))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara();
      flushList();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
      continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      flushPara();
      if (list !== "ul") {
        flushList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if ((m = line.match(/^\s*\d+[.、)]\s*(.*)$/))) {
      flushPara();
      if (list !== "ol") {
        flushList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if ((m = line.match(/^\s*>\s?(.*)$/))) {
      flushPara();
      flushList();
      out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return out.join("\n");
}

// ---------- 隐藏式密码输入 ----------
function askPassword() {
  return new Promise((resolve) => {
    if (process.env.SECRET_PWD) {
      resolve(process.env.SECRET_PWD);
      return;
    }
    process.stdout.write("请输入查看密码（输入时不显示）：");
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.setEncoding("utf8");
      process.stdin.resume();
      let buf = "";
      const onData = (ch) => {
        if (ch === "\r" || ch === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(buf);
        } else if (ch === "\u0003") {
          process.stdout.write("\n已取消。\n");
          process.exit(1);
        } else if (ch === "\u007f" || ch === "\b") {
          buf = buf.slice(0, -1);
        } else if (ch >= " ") {
          buf += ch;
        }
      };
      process.stdin.on("data", onData);
    } else {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

// ---------- 主流程 ----------
const password = String(await askPassword()).trim();
if (!password) {
  console.error("密码为空，已取消。");
  process.exit(1);
}

const raw = readFileSync(BACKUP, "utf8");
// 去掉备份文件顶部的说明注释，只保留正文
const md = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
if (!md) {
  console.error("明文备份里没有正文，请先编辑：" + BACKUP);
  process.exit(1);
}
const html = mdToHtml(md);

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const ct = Buffer.concat([
  cipher.update(Buffer.from(html, "utf8")),
  cipher.final(),
  cipher.getAuthTag(),
]);

const blob = Buffer.from(
  JSON.stringify({
    s: salt.toString("base64"),
    i: iv.toString("base64"),
    c: ct.toString("base64"),
  }),
  "utf8",
).toString("base64");

let page = readFileSync(PAGE, "utf8");
if (!page.includes('cipher="')) {
  console.error("页面里找不到 cipher 属性：" + PAGE);
  process.exit(1);
}
page = page.replace(/cipher="[^"]*"/, `cipher="${blob}"`);
writeFileSync(PAGE, page, "utf8");

console.log("");
console.log("加密完成，已更新页面：" + PAGE);
console.log("请牢记本次输入的密码（密码不保存在任何文件里）。");
console.log("下一步：双击 D:\\AI\\learndata\\发布上线.bat 发布，1~3 分钟后线上生效。");
