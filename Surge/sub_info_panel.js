/*
 * 由@mieqq编写
 * 原脚本地址：https://raw.githubusercontent.com/mieqq/mieqq/master/sub_info_panel.js
 * 由@Tom229修改
 * 更新日期：2024.10.01
 

示例↓↓↓ 
----------------------------------------

[Script]
Sub_info = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/mieqq/mieqq/master/sub_info_panel.js,script-update-interval=0,argument=url=[URL encode 后的机场节点链接]&reset_day=1&title=Nexitally&icon=externaldrive.fill.badge.icloud&color=#007aff

[Panel]
Sub_info = script-name=Sub_info,update-interval=600

----------------------------------------

先将带有流量信息的节点订阅链接encode，用encode后的链接替换"url="后面的[机场节点链接]

（实在不会可以用这个捷径生成panel和脚本，https://www.icloud.com/shortcuts/3f24df391d594a73abd04ebdccd92584）

可选参数 &reset_day，后面的数字替换成流量每月重置的日期，如1号就写1，8号就写8。如"&reset_day=8",不加该参数不显示流量重置信息。

可选参数 &expire，机场链接不带expire信息的，可以手动传入expire参数，如"&expire=2022-02-01",注意一定要按照yyyy-MM-dd的格式。不希望显示到期信息也可以添加&expire=false取消显示。

可选参数"title=xxx" 可以自定义标题。

可选参数"icon=xxx" 可以自定义图标，内容为任意有效的 SF Symbol Name，如 bolt.horizontal.circle.fill，详细可以下载app https://apps.apple.com/cn/app/sf-symbols-browser/id1491161336

可选参数"color=xxx" 当使用 icon 字段时，可传入 color 字段控制图标颜色，字段内容为颜色的 HEX 编码。如：color=#007aff
----------------------------------------
*/
let args = getArgs();

(async () => {
  let info = await getDataInfo(args.url);
  if (!info) $done();
  let resetDayLeft = getRemainingDays(parseInt(args["reset_day"]));
  let used = info.download + info.upload;
  let total = info.total;
  let remaining = bytesToSize(total - used);
 
  let expire = args.expire || info.expire;
  let expireDaysText = ""; // 新增：存储剩余天数文本

  // ========== 新增逻辑：计算剩余天数 ==========
  if (expire && expire !== "false") {
    let expireTime = parseExpire(expire);
    if (!isNaN(expireTime)) {
      const now = new Date().getTime();
      const diff = expireTime - now;
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 0) {
        expireDaysText = `（剩余 ${daysLeft} 天）`;
      } else if (daysLeft === 0) {
        expireDaysText = `（今日到期）`;
      } else {
        expireDaysText = `（已过期 ${Math.abs(daysLeft)} 天）`;
      }
    }
  }

  // ========== 时间显示部分 ==========
  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  let period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  hour = hour > 9 ? hour : "0" + hour;
  minutes = minutes > 9 ? minutes : "0" + minutes;

  let content = [
    `用量: ${bytesToSize(used)} / ${bytesToSize(total)}（${toPercent(used,total)}）`
  ];

  if (expire && expire !== "false") {
    content.push(
      `到期: ${formatTime(expire)}${expireDaysText}`, // 添加剩余天数
      `更新: ${hour}:${minutes} ${period}`
    );
  }

  $done({
    title: `机场: ${args.title} -> 剩余: ${remaining}`,
    content: content.join("\n"),
    icon: args.icon || "airplane.circle",
    "icon-color": args.color || "#007aff",
  });
})();

// ========== 新增函数：智能解析时间 ==========
function parseExpire(expire) {
  // 处理纯数字（时间戳）
  if (/^\d+$/.test(expire)) {
    const timestamp = parseInt(expire);
    // 自动判断秒级/毫秒级时间戳（1e12 = 2001-09-09 开始）
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
  }
  
  // 处理日期字符串（如 2024-10-01）
  const date = new Date(expire);
  return isNaN(date) ? null : date.getTime();
}
