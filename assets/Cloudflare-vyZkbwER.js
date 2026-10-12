import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/deploy/Cloudflare.html","title":"Cloudflare","lang":"zh-CN","frontmatter":{"article":false,"title":"Cloudflare","description":"释放Cloudflare的强大功能！本指南教你加速网站访问，并提供页面优化的实用技巧，如设置缓存和使用Zaraz。更有进阶的Workers反向代理教程，助你全面掌控网站部署与性能。","icon":"fa6-brands:cloudflare","order":5}}`),a={name:`Cloudflare.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<p>官方文档：<a href="https://developers.cloudflare.com/" target="_blank" rel="noopener noreferrer">Cloudflare Docs</a></p><p>Cloudflare 云端代理后，能帮加速国内访问国外网站的速度。比如，notion 的个人博客用 Cloudflare 代理，原本速度很慢，使用 Cloudflare 后加速明显。但 Cloudflare 免费计划不支持单独子域名托管，需要完整域名托管。</p><h2 id="页面优化" tabindex="-1"><a class="header-anchor" href="#页面优化"><span>页面优化</span></a></h2><ul><li>Cache Rules：指定应缓存哪些资源以及缓存多长时间。</li><li>Zaraz：将第三方工具和服务卸载到云，提高网站的速度和安全性。比如 Google Analytics 4 或第三方代码。注意，如果部署在非代理状态的 Pages 上，Zaraz 可能无法运行，因此我改用 Google Tag Manager。</li><li>Pages: Pages 已经部署到 CDN 节点，不要开启代理模式，容易降低速度。但如果你想 Cache Rules 缓存策略生效，就必须开启代理状态。</li></ul><h2 id="反向代理" tabindex="-1"><a class="header-anchor" href="#反向代理"><span>反向代理</span></a></h2><p>Cloudflare Workers 反向代理不适合 google 和 cloudflare cdn 网站，其他网站大都可以。</p><h3 id="镜像整个网站" tabindex="-1"><a class="header-anchor" href="#镜像整个网站"><span>镜像整个网站</span></a></h3><pre><code class="language-javascript">// 替换成你想镜像的站点
const upstream = &quot;www.youtube.com&quot;;

// 如果那个站点有专门的移动适配站点，否则保持和上面一致
const upstream_mobile = &quot;www.youtube.com&quot;;

// 你希望禁止哪些国家访问
const blocked_region = [&quot;RU&quot;];

// 禁止自访问
const blocked_ip_address = [&quot;0.0.0.0&quot;, &quot;127.0.0.1&quot;];

// 替换成你想镜像的站点
const replace_dict = {
  $upstream: &quot;$custom_domain&quot;,
  &quot;//www.youtube.com&quot;: &quot;&quot;,
};

//以下内容都不用动
addEventListener(&quot;fetch&quot;, (event) =&gt; {
  event.respondWith(fetchAndApply(event.request));
});

async function fetchAndApply(request) {
  const region = request.headers.get(&quot;cf-ipcountry&quot;).toUpperCase();
  const ip_address = request.headers.get(&quot;cf-connecting-ip&quot;);
  const user_agent = request.headers.get(&quot;user-agent&quot;);

  let response = null;
  let url = new URL(request.url);
  let url_host = url.host;

  if (url.protocol == &quot;http:&quot;) {
    url.protocol = &quot;https:&quot;;
    response = Response.redirect(url.href);
    return response;
  }

  if (await device_status(user_agent)) {
    upstream_domain = upstream;
  } else {
    upstream_domain = upstream_mobile;
  }

  url.host = upstream_domain;

  if (blocked_region.includes(region)) {
    response = new Response(
      &quot;Access denied: WorkersProxy is not available in your region yet.&quot;,
      {
        status: 403,
      },
    );
  } else if (blocked_ip_address.includes(ip_address)) {
    response = new Response(
      &quot;Access denied: Your IP address is blocked by WorkersProxy.&quot;,
      {
        status: 403,
      },
    );
  } else {
    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);

    new_request_headers.set(&quot;Host&quot;, upstream_domain);
    new_request_headers.set(&quot;Referer&quot;, url.href);

    let original_response = await fetch(url.href, {
      method: method,
      headers: new_request_headers,
    });

    let original_response_clone = original_response.clone();
    let original_text = null;
    let response_headers = original_response.headers;
    let new_response_headers = new Headers(response_headers);
    let status = original_response.status;

    new_response_headers.set(&quot;access-control-allow-origin&quot;, &quot;*&quot;);
    new_response_headers.set(&quot;access-control-allow-credentials&quot;, true);
    new_response_headers.delete(&quot;content-security-policy&quot;);
    new_response_headers.delete(&quot;content-security-policy-report-only&quot;);
    new_response_headers.delete(&quot;clear-site-data&quot;);

    const content_type = new_response_headers.get(&quot;content-type&quot;);
    if (content_type.includes(&quot;text/html&quot;) &amp;&amp; content_type.includes(&quot;UTF-8&quot;)) {
      original_text = await replace_response_text(
        original_response_clone,
        upstream_domain,
        url_host,
      );
    } else {
      original_text = original_response_clone.body;
    }

    response = new Response(original_text, {
      status,
      headers: new_response_headers,
    });
  }
  return response;
}

async function replace_response_text(response, upstream_domain, host_name) {
  let text = await response.text();

  var i, j;
  for (i in replace_dict) {
    j = replace_dict[i];
    if (i == &quot;$upstream&quot;) {
      i = upstream_domain;
    } else if (i == &quot;$custom_domain&quot;) {
      i = host_name;
    }

    if (j == &quot;$upstream&quot;) {
      j = upstream_domain;
    } else if (j == &quot;$custom_domain&quot;) {
      j = host_name;
    }

    let re = new RegExp(i, &quot;g&quot;);
    text = text.replace(re, j);
  }
  return text;
}

async function device_status(user_agent_info) {
  var agents = [
    &quot;Android&quot;,
    &quot;iPhone&quot;,
    &quot;SymbianOS&quot;,
    &quot;Windows Phone&quot;,
    &quot;iPad&quot;,
    &quot;iPod&quot;,
  ];
  var flag = true;
  for (var v = 0; v &lt; agents.length; v++) {
    if (user_agent_info.indexOf(agents[v]) &gt; 0) {
      flag = false;
      break;
    }
  }
  return flag;
}
</code></pre><h3 id="镜像网站指定目录" tabindex="-1"><a class="header-anchor" href="#镜像网站指定目录"><span>镜像网站指定目录</span></a></h3><pre><code class="language-javascript">// 你要镜像的网站。
const upstream = &quot;objectstorage.ap-seoul-1.oraclecloud.com&quot;;

// 镜像网站的目录，比如你想镜像某个网站的二级目录则填写二级目录的目录名，镜像 google 用不到，默认即可。
const upstream_path = &quot;/test/&quot;;

// 镜像站是否有手机访问专用网址，没有则填一样的。
const upstream_mobile = &quot;objectstorage.ap-seoul-1.oraclecloud.com&quot;;

// 屏蔽国家和地区。
const blocked_region = [&quot;&quot;];

// 屏蔽 IP 地址。
const blocked_ip_address = [&quot;0.0.0.0&quot;, &quot;127.0.0.1&quot;];

// 镜像站是否开启 HTTPS.
const https = true;

// 文本替换。填你要镜像的网站
const replace_dict = {
  $upstream: &quot;$custom_domain&quot;,
  &quot;//objectstorage.ap-seoul-1.oraclecloud.com&quot;: &quot;&quot;,
};

// 以下保持默认，不要动
addEventListener(&quot;fetch&quot;, (event) =&gt; {
  event.respondWith(fetchAndApply(event.request));
});

async function fetchAndApply(request) {
  const region = request.headers.get(&quot;cf-ipcountry&quot;).toUpperCase();
  const ip_address = request.headers.get(&quot;cf-connecting-ip&quot;);
  const user_agent =
    &quot;Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36&quot;;

  let response = null;
  let url = new URL(request.url);
  let url_hostname = url.hostname;

  if (https == true) {
    url.protocol = &quot;https:&quot;;
  } else {
    url.protocol = &quot;http:&quot;;
  }

  if (await device_status(user_agent)) {
    var upstream_domain = upstream;
  } else {
    var upstream_domain = upstream_mobile;
  }

  url.host = upstream_domain;
  if (url.pathname == &quot;/&quot;) {
    url.pathname = upstream_path;
  } else {
    url.pathname = upstream_path + url.pathname;
  }

  if (blocked_region.includes(region)) {
    response = new Response(
      &quot;Access denied: WorkersProxy is not available in your region yet.&quot;,
      {
        status: 403,
      },
    );
  } else if (blocked_ip_address.includes(ip_address)) {
    response = new Response(
      &quot;Access denied: Your IP address is blocked by WorkersProxy.&quot;,
      {
        status: 403,
      },
    );
  } else {
    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);

    new_request_headers.set(&quot;Host&quot;, url.hostname);
    new_request_headers.set(&quot;Referer&quot;, url.hostname);

    let original_response = await fetch(url.href, {
      method: method,
      headers: new_request_headers,
    });

    let original_response_clone = original_response.clone();
    let original_text = null;
    let response_headers = original_response.headers;
    let new_response_headers = new Headers(response_headers);
    let status = original_response.status;

    new_response_headers.set(&quot;access-control-allow-origin&quot;, &quot;*&quot;);
    new_response_headers.set(&quot;access-control-allow-credentials&quot;, true);
    new_response_headers.delete(&quot;content-security-policy&quot;);
    new_response_headers.delete(&quot;content-security-policy-report-only&quot;);
    new_response_headers.delete(&quot;clear-site-data&quot;);

    const content_type = new_response_headers.get(&quot;content-type&quot;);
    if (content_type.includes(&quot;text/html&quot;) &amp;&amp; content_type.includes(&quot;UTF-8&quot;)) {
      original_text = await replace_response_text(
        original_response_clone,
        upstream_domain,
        url_hostname,
      );
    } else {
      original_text = original_response_clone.body;
    }

    response = new Response(original_text, {
      status,
      headers: new_response_headers,
    });
  }
  return response;
}

async function replace_response_text(response, upstream_domain, host_name) {
  let text = await response.text();

  var i, j;
  for (i in replace_dict) {
    j = replace_dict[i];
    if (i == &quot;$upstream&quot;) {
      i = upstream_domain;
    } else if (i == &quot;$custom_domain&quot;) {
      i = host_name;
    }

    if (j == &quot;$upstream&quot;) {
      j = upstream_domain;
    } else if (j == &quot;$custom_domain&quot;) {
      j = host_name;
    }

    let re = new RegExp(i, &quot;g&quot;);
    text = text.replace(re, j);
  }
  return text;
}

async function device_status(user_agent_info) {
  var agents = [
    &quot;Android&quot;,
    &quot;iPhone&quot;,
    &quot;SymbianOS&quot;,
    &quot;Windows Phone&quot;,
    &quot;iPad&quot;,
    &quot;iPod&quot;,
  ];
  var flag = true;
  for (var v = 0; v &lt; agents.length; v++) {
    if (user_agent_info.indexOf(agents[v]) &gt; 0) {
      flag = false;
      break;
    }
  }
  return flag;
}
</code></pre><h3 id="镜像网站带密码访问" tabindex="-1"><a class="header-anchor" href="#镜像网站带密码访问"><span>镜像网站带密码访问</span></a></h3><pre><code class="language-javascript">// 替换成你想镜像的站点
const upstream = &quot;google.com&quot;;

// 如果那个站点有专门的移动适配站点，否则保持和上面一致
const upstream_mobile = &quot;m.google.com&quot;;

// 密码访问

const openAuth = false;
const username = &quot;username&quot;;
const password = &quot;password&quot;;

// 你希望禁止哪些国家访问
const blocked_region = [&quot;RU&quot;];

// 禁止自访问
const blocked_ip_address = [&quot;0.0.0.0&quot;, &quot;127.0.0.1&quot;];

// 替换成你想镜像的站点
const replace_dict = {
  $upstream: &quot;$custom_domain&quot;,
  &quot;//google.com&quot;: &quot;&quot;,
};

function unauthorized() {
  return new Response(&quot;Unauthorized&quot;, {
    headers: {
      &quot;WWW-Authenticate&quot;: &#39;Basic realm=&quot;goindex&quot;&#39;,
      &quot;Access-Control-Allow-Origin&quot;: &quot;*&quot;,
    },
    status: 401,
  });
}

function parseBasicAuth(auth) {
  try {
    return atob(auth.split(&quot; &quot;).pop()).split(&quot;:&quot;);
  } catch (e) {
    return [];
  }
}

function doBasicAuth(request) {
  const auth = request.headers.get(&quot;Authorization&quot;);

  if (!auth || !/^Basic [A-Za-z0-9._~+/-]+=*$/i.test(auth)) {
    return false;
  }

  const [user, pass] = parseBasicAuth(auth);
  return user === username &amp;&amp; pass === password;
}

async function fetchAndApply(request) {
  if (request.method === &quot;OPTIONS&quot;)
    // allow preflight request
    return new Response(&quot;&quot;, {
      status: 200,
      headers: {
        &quot;Access-Control-Allow-Origin&quot;: &quot;*&quot;,
        &quot;Access-Control-Allow-Headers&quot;: &quot;*&quot;,
        &quot;Access-Control-Allow-Methods&quot;: &quot;GET, POST, PUT, HEAD, OPTIONS&quot;,
      },
    });

  if (openAuth &amp;&amp; !doBasicAuth(request)) {
    return unauthorized();
  }
  const region = request.headers.get(&quot;cf-ipcountry&quot;).toUpperCase();
  const ip_address = request.headers.get(&quot;cf-connecting-ip&quot;);
  const user_agent = request.headers.get(&quot;user-agent&quot;);

  let response = null;
  let url = new URL(request.url);
  let url_host = url.host;

  if (url.protocol == &quot;http:&quot;) {
    url.protocol = &quot;https:&quot;;
    response = Response.redirect(url.href);
    return response;
  }

  if (await device_status(user_agent)) {
    upstream_domain = upstream;
  } else {
    upstream_domain = upstream_mobile;
  }

  url.host = upstream_domain;

  if (blocked_region.includes(region)) {
    response = new Response(
      &quot;Access denied: WorkersProxy is not available in your region yet.&quot;,
      {
        status: 403,
      },
    );
  } else if (blocked_ip_address.includes(ip_address)) {
    response = new Response(
      &quot;Access denied: Your IP address is blocked by WorkersProxy.&quot;,
      {
        status: 403,
      },
    );
  } else {
    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);

    new_request_headers.set(&quot;Host&quot;, upstream_domain);
    new_request_headers.set(&quot;Referer&quot;, url.href);

    let original_response = await fetch(url.href, {
      method: method,
      headers: new_request_headers,
    });

    let original_response_clone = original_response.clone();
    let original_text = null;
    let response_headers = original_response.headers;
    let new_response_headers = new Headers(response_headers);
    let status = original_response.status;

    new_response_headers.set(&quot;access-control-allow-origin&quot;, &quot;*&quot;);
    new_response_headers.set(&quot;access-control-allow-credentials&quot;, true);
    new_response_headers.delete(&quot;content-security-policy&quot;);
    new_response_headers.delete(&quot;content-security-policy-report-only&quot;);
    new_response_headers.delete(&quot;clear-site-data&quot;);

    const content_type = new_response_headers.get(&quot;content-type&quot;);
    if (content_type.includes(&quot;text/html&quot;) &amp;&amp; content_type.includes(&quot;UTF-8&quot;)) {
      original_text = await replace_response_text(
        original_response_clone,
        upstream_domain,
        url_host,
      );
    } else {
      original_text = original_response_clone.body;
    }

    response = new Response(original_text, {
      status,
      headers: new_response_headers,
    });
  }
  return response;
}

addEventListener(&quot;fetch&quot;, (event) =&gt; {
  event.respondWith(
    fetchAndApply(event.request).catch((err) =&gt; {
      console.error(err);
      new Response(JSON.stringify(err.stack), {
        status: 500,
        headers: {
          &quot;Content-Type&quot;: &quot;application/json&quot;,
        },
      });
    }),
  );
});

async function replace_response_text(response, upstream_domain, host_name) {
  let text = await response.text();

  var i, j;
  for (i in replace_dict) {
    j = replace_dict[i];
    if (i == &quot;$upstream&quot;) {
      i = upstream_domain;
    } else if (i == &quot;$custom_domain&quot;) {
      i = host_name;
    }

    if (j == &quot;$upstream&quot;) {
      j = upstream_domain;
    } else if (j == &quot;$custom_domain&quot;) {
      j = host_name;
    }

    let re = new RegExp(i, &quot;g&quot;);
    text = text.replace(re, j);
  }
  return text;
}

async function device_status(user_agent_info) {
  var agents = [
    &quot;Android&quot;,
    &quot;iPhone&quot;,
    &quot;SymbianOS&quot;,
    &quot;Windows Phone&quot;,
    &quot;iPad&quot;,
    &quot;iPod&quot;,
  ];
  var flag = true;
  for (var v = 0; v &lt; agents.length; v++) {
    if (user_agent_info.indexOf(agents[v]) &gt; 0) {
      flag = false;
      break;
    }
  }
  return flag;
}
</code></pre>`,12)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};