#!/usr/bin/env node
/**
 * 私密页批量加密脚本
 *
 * 对每一组「明文备份 → 站点页面」，做三件事：
 *   1. 读取本机明文（D:\AI\learndata\私密页备份\...）
 *   2. Markdown 转 HTML，再用 PBKDF2-SHA256(600000) + AES-256-GCM 加密
 *   3. 把密文写回页面文件 SecretGate 组件的 cipher 属性
 *
 * 线上页面和 GitHub 仓库里自始至终只有密文，密码不落在任何文件里。
 * 所有私密页共用一个密码，这样「记住密码」在任何一页输入一次即可全站通用。
 *
 * 密码来源：
 *   1. 环境变量 SECRET_PWD（自动化调用）；
 *   2. 交互式隐藏输入（双击 .bat 时）。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import readline from "node:readline";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");          // D:\AI\learndata\LearnData-main
const BACKUP_ROOT = path.resolve(ROOT, "..", "私密页备份");
const ITERATIONS = 600000;

/** 清单：[明文备份相对路径, 页面相对路径] */
const MANIFEST = [
  ["如何帮助客户上传文件.md", "src/huawei/如何帮助客户上传文件.md"],
  ["问题流程/01-添加策略流程.md", "src/huawei/问题流程/01-添加策略流程.md"],
  ["问题流程/02-开通VPN访问端口策略.md", "src/huawei/问题流程/02-开通VPN访问端口策略.md"],
  ["问题流程/03-添加策略后网络不通排查.md", "src/huawei/问题流程/03-添加策略后网络不通排查.md"],
  ["问题流程/04-VPN登录失败排查.md", "src/huawei/问题流程/04-VPN登录失败排查.md"],
  ["问题流程/05-IP封堵与解封.md", "src/huawei/问题流程/05-IP封堵与解封.md"],
  ["问题流程/06-物理机网卡断联排查.md", "src/huawei/问题流程/06-物理机网卡断联排查.md"],
  ["问题流程/07-系统加固镜像问题处理.md", "src/huawei/问题流程/07-系统加固镜像问题处理.md"],
];

// ---------- Markdown → HTML ----------
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

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // 代码围栏 ```lang ... ```
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      flushPara();
      flushList();
      const lang = fence[1];
      const buf = [];
      idx++;
      while (idx < lines.length && !/^\s*```\s*$/.test(lines[idx])) {
        buf.push(lines[idx]);
        idx++;
      }
      out.push(
        `<pre><code${lang ? ` class="language-${lang}"` : ""}>${escapeHtml(buf.join("\n"))}</code></pre>`,
      );
      continue;
    }

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
    process.stdout.write("请输入查看密码（所有私密页共用一个，输入时不显示）：");
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
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question("", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

function encryptHtml(html, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([
    cipher.update(Buffer.from(html, "utf8")),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return Buffer.from(
    JSON.stringify({
      s: salt.toString("base64"),
      i: iv.toString("base64"),
      c: ct.toString("base64"),
    }),
    "utf8",
  ).toString("base64");
}

// ---------- 主流程 ----------
const password = String(await askPassword()).trim();
if (!password) {
  console.error("密码为空，已取消。");
  process.exit(1);
}

const missing = [];
for (const [bk] of MANIFEST) {
  if (!existsSync(path.join(BACKUP_ROOT, bk))) missing.push(bk);
}
if (missing.length) {
  console.error("以下明文备份不存在，已停止：\n  " + missing.join("\n  "));
  process.exit(1);
}

let okCount = 0;
for (const [bkRel, pageRel] of MANIFEST) {
  const backup = path.join(BACKUP_ROOT, bkRel);
  const pagePath = path.join(ROOT, pageRel);

  const raw = readFileSync(backup, "utf8");
  const md = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!md) {
    console.error(`跳过（备份里没有正文）：${bkRel}`);
    continue;
  }

  const html = mdToHtml(md);
  const blob = encryptHtml(html, password);

  let page = readFileSync(pagePath, "utf8");
  if (!page.includes('cipher="')) {
    console.error(`跳过（页面里找不到 cipher 属性）：${pageRel}`);
    continue;
  }
  page = page.replace(/cipher="[^"]*"/, `cipher="${blob}"`);
  writeFileSync(pagePath, page, "utf8");

  okCount++;
  console.log(`已加密 ${bkRel} → ${pageRel}（正文 ${md.length} 字符）`);
}

console.log("");
console.log(`完成，共加密 ${okCount} 个页面。`);
console.log("请牢记本次输入的密码（密码不保存在任何文件里）。");
console.log("下一步：双击 D:\\AI\\learndata\\发布上线.bat 发布，1~3 分钟后线上生效。");