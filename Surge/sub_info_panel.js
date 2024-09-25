/*
Surge配置参考注释,感谢@congcong.

示例↓↓↓ 
----------------------------------------

[Script]
Sub_info = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/tom229/Airport-conf/refs/heads/main/Surge/sub_info_panel.js,script-update-interval=0,argument=url=[URL encode 后的机场节点链接]&reset_day=1&title=[机场名]&icon=bonjour&color=#007aff

[Panel]
Sub_info = script-name=Sub_info,update-interval=600

----------------------------------------

# 原作者未知，复制自深巷有喵的GitHub
# 更新日期：2023.03.19
# 版本：3.4
# 本模块无法直接远程使用，需将内容复制到本地模块进行修改方可使用，见教程：https://surge.ga/09/1996/
# 先将带有流量信息的节点订阅链接encode，用encode后的链接替换"url="后面的[encode后的机场节点链接]encode链接： https://www.urlencoder.org
# 可选参数 &reset_day，后面的数字替换成流量每月重置的日期，如1号就写1，8号就写8。如"&reset_day=8",不加该参数不显示流量重置信息。
# 可选参数 &expire，机场链接不带expire信息的，可以手动传入expire参数，如"&expire=2022-02-01",注意一定要按照yyyy-MM-dd的格式。不希望显示到期信息也可以添加&expire=false取消显示。
# 可选参数"title=xxx" 可以自定义标题。
# 可选参数"icon=xxx" 可以自定义图标，内容为任意有效的 SF Symbol Name，如 bolt.horizontal.circle.fill，详细可以下载app https://apps.apple.com/cn/app/sf-symbols-browser/id1491161336
# 可选参数"color=xxx" 当使用 icon 字段时，可传入 color 字段控制图标颜色，字段内容为颜色的 HEX 编码。如：color=#007aff
----------------------------------------
有些服务端不支持head访问，可以添加参数&method=get
*/


(async () => {
  let args = getArgs();
  let info = await getDataInfo(args.url);
  if (!info) $done();
  let resetDayLeft = getRmainingDays(parseInt(args["reset_day"]));

  let used = info.download + info.upload;
  let total = info.total;
  let expire = args.expire || info.expire;
  let content = [`已用：${toPercent(used, total)} \t|  剩余：${toMultiply(total, used)}`];

  if (resetDayLeft || expire) {
    if (resetDayLeft && expire && expire !== "false") {
      if (/^[\d.]+$/.test(expire)) expire *= 1000;
      content.push(`重置：${resetDayLeft}天 \t|  ${formatTime(expire)}`);
    } else if (resetDayLeft && !expire) {
      content.push(`重置：${resetDayLeft}天`);
    } else if (!resetDayLeft && expire) {
      if (/^[\d.]+$/.test(expire)) expire *= 1000;
      content.push(`到期：${formatTime(expire)}`);
    }
  }

  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  hour = hour > 9 ? hour : "0" + hour;
  minutes = minutes > 9 ? minutes : "0" + minutes;

  $done({
    title: `${args.title} | ${bytesToSize(total)} | ${hour}:${minutes}`,
    content: content.join("\n"),
    icon: args.icon || "airplane.circle",
    "icon-color": args.color || "#007aff",
  });
})();

function getArgs() {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) =>
    $httpClient.get(request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }
      if (resp.status !== 200) {
        reject(resp.status);
        return;
      }
      let header = Object.keys(resp.headers).find((key) => key.toLowerCase() === "subscription-userinfo");
      if (header) {
        resolve(resp.headers[header]);
        return;
      }
      reject("链接响应头不带有流量信息");
    })
  );
}

async function getDataInfo(url) {
  const [err, data] = await getUserInfo(url)
    .then((data) => [null, data])
    .catch((err) => [err, null]);
  if (err) {
    console.log(err);
    return;
  }

  return Object.fromEntries(
    data
      .match(/\w+=[\d.eE+]+/g)
      .map((item) => item.split("="))
      .map(([k, v]) => [k, Number(v)])
  );
}

function getRmainingDays(resetDay, expireTimestamp) {
  let now = new Date();  // 当前时间
  let today = now.getDate();  // 今天的日期
  let currentMonth = now.getMonth();  // 当前月份
  let currentYear = now.getFullYear();  // 当前年份
  
  // 构建当月的重置日时间对象
  let resetDateThisMonth = new Date(currentYear, currentMonth, resetDay);
  
  // 如果当前日期已经超过本月的重置日，则计算下个月的重置日期
  if (today > resetDay) {
    // 构建下个月的重置日时间对象
    let nextMonth = (currentMonth + 1) % 12;
    let nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    resetDateThisMonth = new Date(nextYear, nextMonth, resetDay);
  }

  // 如果有到期日(expireTimestamp)，优先计算到期日的剩余天数
  if (expireTimestamp) {
    let expireDate = new Date(expireTimestamp * 1000);  // 到期日时间戳是秒，需要乘以1000转换为毫秒
    let expireDaysLeft = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

    // 如果到期日比重置日早，返回到期日的剩余天数
    if (expireDaysLeft < Math.ceil((resetDateThisMonth - now) / (1000 * 60 * 60 * 24))) {
      return expireDaysLeft;
    }
  }

  // 计算当前时间和重置日之间的时间差（以毫秒为单位），然后转换为天数
  let daysRemaining = Math.ceil((resetDateThisMonth - now) / (1000 * 60 * 60 * 24));  // 将毫秒转换为天数

  return daysRemaining;
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  let k = 1024;
  sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function bytesToSizeNumber(bytes) {
  if (bytes === 0) return "0";
  let k = 1024;
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2);
}

function toPercent(num, total) {
  return (Math.round((num / total) * 10000) / 100).toFixed(1) + "%";
}


function toMultiply(total, num) {
  let totalDecimalLen, numDecimalLen, maxLen, multiple;
  try {
    totalDecimalLen = total.toString().split(".").length;
  } catch (e) {
    totalDecimalLen = 0;
  }
  try {
    numDecimalLen = num.toString().split(".").length;
  } catch (e) {
    numDecimalLen = 0;
  }
  maxLen = Math.max(totalDecimalLen, numDecimalLen);
  multiple = Math.pow(10, maxLen);
  const numberSize = ((total * multiple - num * multiple) / multiple).toFixed(maxLen);
  return bytesToSize(numberSize);
}

function formatTime(time) {
  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  return "到期：" + year + "." + month + "." + day + " ";
}
