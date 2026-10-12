import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/code/AutoHotkey.html","title":"AutoHotkey","lang":"zh-CN","frontmatter":{"article":false,"title":"AutoHotkey","description":"想让Windows操作更高效？本文从基础语法到热键设置，详解AutoHotkey核心应用。提供丰富实战脚本样例，助你轻松实现程序速启、弹窗控制等自动化操作，大幅提升工作效率。","icon":"fa6-brands:autoprefixer","order":4}}`),a={name:`AutoHotkey.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<p>AutoHotkey（简称 <a href="https://www.autohotkey.com/" target="_blank" rel="noopener noreferrer">AHK</a>）是一个运行于 Windows 平台的开源热键脚本语言，主要用于提升操作效率和实现各种自动化功能。其语法简洁，学习门槛较低，适合快速上手。初学者可以借助脚本录制工具开始实践。我个人通过 AHK 实现了热键启动程序、定时判断条件、修改键盘按键映射等自动化操作，推荐学习制作你的专属自动化脚本。</p><blockquote><p>本文示例均为 AutoHotkey <strong>v1</strong> 语法；v2 已改为函数式写法、与 v1 差异较大，运行前请注意区分版本。</p></blockquote><ul><li><a href="https://wyagd001.github.io/v1/docs" target="_blank" rel="noopener noreferrer">AutoHotkey 中文说明</a>：<a href="https://wyagd001.github.io/v1/docs/KeyList.htm" target="_blank" rel="noopener noreferrer">按键 Key 名列表</a>，<a href="https://wyagd001.github.io/v1/docs/Variables.htm#BuiltIn" target="_blank" rel="noopener noreferrer">AHK 环境变量</a>。</li><li>脚本录制/功能编辑：<a href="https://www.macrocreator.com/download/" target="_blank" rel="noopener noreferrer">Pulover&#39;s Macro Creator</a>，<a href="https://github.com/papple23g/ahkcompiler" target="_blank" rel="noopener noreferrer">AutoHotkey 語法產生器 (線上網站)</a>。</li></ul><table><thead><tr><th>符号</th><th>含义与用途</th></tr></thead><tbody><tr><td>#</td><td>Win 键</td></tr><tr><td>!</td><td>Alt 键</td></tr><tr><td>^</td><td>Ctrl 键</td></tr><tr><td>+</td><td>Shift 键</td></tr><tr><td>\`</td><td>转义字符，参考<a href="https://wyagd001.github.io/v1/docs/misc/EscapeChar.htm" target="_blank" rel="noopener noreferrer">转义序列</a></td></tr><tr><td>;</td><td>代表注释内容，不影响函数</td></tr><tr><td>::</td><td>(两个英文冒号)，代表分隔</td></tr></tbody></table><p><strong>注意事项</strong>：</p><ul><li>不区分大小写：如 <code>run</code> 和 <code>RUN</code> 等价。</li><li>非热键情况，添加 <code>return</code>，脚本全部停止。</li><li>注意脚本作用域：区分是<strong>全局热键</strong>还是限定在某窗口/程序中。</li><li>使用管理员权限运行脚本时，所有操作也将以管理员身份执行，即使只是使用普通 <code>run</code> 命令。</li><li>AutoHotkey v1 脚本默认使用 ANSI 编码（除非你保存为 <strong>UTF-8-BOM</strong> 编码）.</li></ul><h2 id="常用方法" tabindex="-1"><a class="header-anchor" href="#常用方法"><span>常用方法</span></a></h2><h3 id="托盘图标" tabindex="-1"><a class="header-anchor" href="#托盘图标"><span>托盘图标</span></a></h3><p>自定义图标可使用 ico 或 png，不支持 svg 格式。</p><p>托盘图标设置命令为 <code>Menu, Tray, Icon, %A_WorkingDir%\\dock_panel.png</code>。<code>%A_WorkingDir%</code> 代表脚本所在目录。</p><p>如果是设置 exe 程序图标，则使用 <a href="https://github.com/AutoHotkey/Ahk2Exe/releases" target="_blank" rel="noopener noreferrer">Ahk2Exe</a> 工具手动转换。</p><h3 id="执行-powershell" tabindex="-1"><a class="header-anchor" href="#执行-powershell"><span>执行 PowerShell</span></a></h3><p>系统级别的操作可以通过 <a href="https://learn.microsoft.com/zh-cn/powershell/scripting/learn/ps101/01-getting-started" target="_blank" rel="noopener noreferrer">PowerShell</a> 来实现。</p><pre><code class="language-bash"># Run, powershell.exe -NoExit -Command &amp;{命令}, 目录
Run, powershell.exe -NoExit -Command &amp;{npm version patch}, D:\\Backup
</code></pre><h2 id="问题" tabindex="-1"><a class="header-anchor" href="#问题"><span>问题</span></a></h2><h3 id="激发热键后按键未释放" tabindex="-1"><a class="header-anchor" href="#激发热键后按键未释放"><span>激发热键后按键未释放</span></a></h3><p><code>Send, ^!+w</code> 指代热键 <code>Ctrl+Alt+Shift+W</code>，有时辅助热键未正确释放，会导致激发热键后输入有问题。</p><p>函数结尾加一行 <code>Send, {Ctrl up}{Alt up}{Shift up}</code> 即可解决该问题。</p><h3 id="隐藏在托盘程序无法监测" tabindex="-1"><a class="header-anchor" href="#隐藏在托盘程序无法监测"><span>隐藏在托盘程序无法监测</span></a></h3><p><code>WinExist</code> 只能查看前台程序，对于后台或托盘程序，可以用 Process 命令来检查是否存在指定程序的 PID。</p><pre><code class="language-bash">; 晚上8点停止录屏，并精简视频
if (A_Hour == 20 &amp;&amp; Stop_Record ==0){ ;如果小时等于20点
    Stop_Record:=1 ;设置停止录屏变量为1
    Process, Exist, bdcam.exe ;监测隐藏程序
    NewPID := ErrorLevel  ; 由于 ErrorLevel 会经常发生改变, 所以要立即保存这个值.
    if NewPID { ;如果存在录屏工具，则继续
        Send, ^+!{F8} ;晚上8点后，停止录屏
        Sleep, 1000 ;等待5分钟
        ;重命名文件
        FileMove, D:\\Backup\\Libraries\\Desktop\\%A_YYYY%-%A_MM%-%A_DD% *-*-*-*.mp4, D:\\Backup\\Libraries\\Desktop\\%A_YYYY%-%A_MM%-%A_DD%.mp4
        Sleep, 1000
        ;桌面打开终端，执行 dvr-scan 命令
        Run, PowerShell.exe -NoExit -Command &amp;{dvr-scan -i %A_YYYY%-%A_MM%-%A_DD%.mp4 -o %A_YYYY%-%A_MM%-%A_DD%_Scanned.avi}, D:\\Backup\\Libraries\\Desktop
    }
}
</code></pre><h3 id="命令中的按键未执行" tabindex="-1"><a class="header-anchor" href="#命令中的按键未执行"><span>命令中的按键未执行</span></a></h3><p>如果 AutoHotkey 脚本中模拟了按键，窗口中却并未执行，则尝试用管理员权限执行脚本。</p><p>低权限的窗口/进程不能发送消息到高权限窗口。比如 Quicker 窗口的权限高，普通启动的 AutoHotkey 脚本无法对 Quicker 输入模拟键，需要管理员权限。</p><h3 id="管理员权限运行脚本" tabindex="-1"><a class="header-anchor" href="#管理员权限运行脚本"><span>管理员权限运行脚本</span></a></h3><p>对于可执行文件，命令 <code>Run *RunAs</code> 相当于右键菜单的「以管理员权限运行」命令。</p><p>右键单击脚本的快捷方式，选择「属性」&gt;「高级」，勾选「用管理员身份运行」，只能用于手动开启，开机启动会忽略带管理器的启动项。</p><p>如果<strong>管理员密码为空</strong>，则参考 <a href="http://www.ujiaoshou.com/xtjc/155215500.html" target="_blank" rel="noopener noreferrer">Win10 添加开机启动项管理员权限运行如何设置</a>，在系统的任务计划程序添加管理员自启动。如果想避免启动报错，建议将启动触发器从「开机」改成「登录」，增加延迟 1 分钟，勾选「最高管理员权限」。设置后，脚本中的打开命令都将使用管理员权限执行。</p><p>如果<strong>管理员有设密码</strong>，则可使用下列命令，用管理员权限打开脚本。</p><pre><code class="language-bash">RunAs, Administrator, PassWD
Run, %A_ScriptDir%\\1.ahk
RunAs  ; 恢复为普通权限
</code></pre><h2 id="常用函数" tabindex="-1"><a class="header-anchor" href="#常用函数"><span>常用函数</span></a></h2><h3 id="命令-run-msgbox-send" tabindex="-1"><a class="header-anchor" href="#命令-run-msgbox-send"><span>命令：run, msgbox, send</span></a></h3><pre><code class="language-bash">;run 运行程序或者文档或其他
!n::run notepad ;便捷呼出程序，「notepad」是「运行」对话框中的命令之一，所以不用完整路径
Run, %A_WorkingDir%\\xx.lnk ;启用当前目录中的文件
Run, chrome.exe https://newzone.top/ ;指定浏览器打开链接。
Run, %A_ProgramFiles%\\Some Application\\App.exe, %A_ProgramFiles%\\Some Application ;有些程序需要在它们自己的目录下运行。
Run, &quot;%A_ProgramFiles%\\Google\\Chrome\\Application\\chrome_proxy.exe --profile-directory=Default --app-id=xxxxxxxx&quot; ;打开 Chrome 浏览器的内部应用，修改 app-id 即可

;Msgbox：显示带两个按钮的对话框 (是 和 否) 对话框中可加内容
Msgbox，你好吗？ ;显示「你好吗？」的对话框
;Send：在当前窗口输入文本内容
send how are you？ ;在当前窗口输入 how are you？
</code></pre><h3 id="局部变量-ifwinactive" tabindex="-1"><a class="header-anchor" href="#局部变量-ifwinactive"><span>局部变量：IFwinactive</span></a></h3><p>注意：同样<strong>不区分大小写</strong>。比如 ifwinactive 等等。</p><pre><code class="language-bash">;#IFwinactive（指定窗口）（热键或热字串）
#IFwinactive 新建文本文档.txt - 记事本 ; 在*新建文本文档.txt - 记事本*这个指定窗口下，窗口标题的前半段符合即可
#q:: ;按下 win 键和 q 键
run Notepad ;激活打开记事本这个动作
return
</code></pre><h2 id="热键、热字串" tabindex="-1"><a class="header-anchor" href="#热键、热字串"><span>热键、热字串</span></a></h2><h3 id="热键-按键-1-按键-2" tabindex="-1"><a class="header-anchor" href="#热键-按键-1-按键-2"><span>热键：(按键 1)(按键 2)</span></a></h3><p>当按下特定的按键，或者按键顺序，或者按键组合时，激活某个或者某系列动作。</p><pre><code class="language-bash">#q:: ;按下 win 键和 q 键时激活运行记事本这个动作。
run Notepad ;run 为 AHK 中一个命令，相当于 C 语言中的关键字或者说是函数。还有 msgbox 等等。
return ;return 为返回值，在存在多个热键时需使用，不然热键中会起冲突。

q&amp;n:: ;按下 q 和 n，自定义按键：(按键 1)&amp;(按键 2)&amp;...&amp;(按键 n)，用来连接任何两个或多个按键组合成一个新的按键。
run notepad ;激活打开记事本这个动作。
return
</code></pre><h3 id="热字串-被替换内容-替换内容" tabindex="-1"><a class="header-anchor" href="#热字串-被替换内容-替换内容"><span>热字串：(被替换内容)::(替换内容)</span></a></h3><p>扩展或者说自动替换文本，当然也可以映射任何脚本动作。</p><p>自动替换：</p><pre><code class="language-bash">::hay::how are you? ;当输入 hay 时自动替换为 how are you？
::nh::你好 ;当输入 nh 时自动替换为你好
::/mail::gmail@gmail.com ;键入/mail 后，再加空格、或 tab、或回车，就可以触发缩写
::/fk::轩先生这会子肯定在忙，请骚后。thx。祝君：天天开心，日日欣悦。
</code></pre><p>热字串映射脚本：</p><pre><code class="language-bash">::np::
run Notepad ;当输入 np 加空格时激活运行记事本这个动作。
return
::nh::
send 你好。 ;在当前窗口输入你好。
return
::h:: 欢迎光临！ ;只要输入 h，然后回车/TAB/空格就自动把 h 替换为欢迎光临！
:*:w::欢迎你再次光临！     ;自动替换，不需要输入空格来触发替换
::hehe::                 ;替换支持换行文字，需要用括号？
(
老兄！
好久不见！
)
</code></pre><p>键入热字串后，再加<strong>空格</strong>、或 <strong>tab</strong>、或<strong>回车</strong>，就可以触发缩写。</p><h2 id="ahk-使用样例" tabindex="-1"><a class="header-anchor" href="#ahk-使用样例"><span>AHK 使用样例</span></a></h2><h3 id="神速激活-打开-隐藏程序" tabindex="-1"><a class="header-anchor" href="#神速激活-打开-隐藏程序"><span>神速激活/打开/隐藏程序</span></a></h3><p><code>Win+C</code>激活 Chrome 状态切换：Chrome 没打开时 --&gt; 打开；打开没激活状态时候 --&gt; 激活；打开处在激活状态时候 --&gt; 隐藏。^[<a href="https://segmentfault.com/a/1190000004611125" target="_blank" rel="noopener noreferrer">Win 下最爱效率利器:AutoHotKey</a>]</p><pre><code class="language-bash">#c::
IfWinNotExist ahk_class Chrome_WidgetWin_1
{
    Run &quot;C:\\\\Users\\\\Administrator\\\\AppData\\\\Local\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe&quot;
    WinActivate
}
Else IfWinNotActive ahk_class Chrome_WidgetWin_1
{
    WinActivate
}
Else
{
    WinMinimize
}
Return
</code></pre><h3 id="一键运行-关闭脚本的循环" tabindex="-1"><a class="header-anchor" href="#一键运行-关闭脚本的循环"><span>一键运行/关闭脚本的循环</span></a></h3><p>按 F2 一键运行/关闭脚本的循环，空格可暂停/继续脚本。</p><pre><code class="language-bash">#maxThreadsPerHotkey, 2 ;让热键能同时有运行/关闭作用，否则键击会被忽略
;setKeyDelay, 50, 50 ;键击默认休眠
;setMouseDelay, 50 ;键击默认休眠
stop:=0

;F2一键运行/关闭脚本的循环
$f2::
    stop:=!stop
    while (stop=1)
    {
        ;激活 excel 窗口「工作簿」获取数值，然后激活 chrome 窗口执行命令，完成后进入循环。
        WinActivate, 工作簿
        Sleep, 333
        Send, {Down}
        Sleep, 100
        Send, {Control Down}{c}{Control Up}
        Sleep, 100
        WinActivate, 捧场 - Google Chrome
        Sleep, 333
        Send, {Control Down}{v}{Control Up}
        Sleep, 100
        Send, {Enter}
        Sleep, 100
    }
return
;如果需要暂停，可在脚本后加这段代码，按 空格键 就暂停，再按空格键继续运行。
;space::pause
</code></pre><h3 id="监测进程是否运行" tabindex="-1"><a class="header-anchor" href="#监测进程是否运行"><span>监测进程是否运行</span></a></h3><p>监测应用是否有运行，如果没运行则执行启动热键。</p><pre><code class="language-bash">Process, Exist, PicGo.exe
NewPID := ErrorLevel  ; 由于 ErrorLevel 会经常发生改变，所以要立即保存值。
if not NewPID
{
    run C:\\\\Program Files\\\\PicGo\\\\PicGo.exe
    sleep 3000
    Send, {Shift Down}{Control Down}{p}{Control Up}{Shift Up}
} else {
    Send, {Shift Down}{Control Down}{p}{Control Up}{Shift Up}
}
return
</code></pre><h3 id="输入法状态影响字符输出" tabindex="-1"><a class="header-anchor" href="#输入法状态影响字符输出"><span>输入法状态影响字符输出</span></a></h3><p>在脚本中，调用函数<code>SendText()</code>输出文字，不受输入法状态。</p><pre><code class="language-bash">;;;;;;;新版独立小程序，可以避免输入法状态影响中文或英文字符的热键输出;;;;;;;
;来源链接：&lt;https://segmentfault.com/a/1190000017029464&gt;
SendText(var_string){
    local
    SendInput {text}%var_string%
    return
}
</code></pre><h3 id="大写键改为-enter" tabindex="-1"><a class="header-anchor" href="#大写键改为-enter"><span>大写键改为 Enter</span></a></h3><pre><code class="language-bash">;replace CapsLock to LeftEnter; CapsLock = Alt CapsLock
$CapsLock::Enter
LAlt &amp; Capslock::SetCapsLockState, % GetKeyState(&quot;CapsLock&quot;, &quot;T&quot;) ? &quot;Off&quot; : &quot;On&quot;
!u::Send ^c !{tab} ^v
</code></pre>`,62)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};