// github：【umena337/17kan】https://github.com/umena337/17kan
const urlParams = new URLSearchParams(window.location.search);
const user99 = urlParams.get('u');
let kakaka = false;   // 卡顿检测变量
let kakaka_real = false;   // 卡顿检测变量2
let let_dplayer_danmu = false; // dplayer的全体弹幕开关，电脑上ok，电脑全屏ok，手机不全屏ok，手机全屏看不到
let let_net_speed = false;  //前端video的buffered变化计算下载速度，电脑google浏览器准，其他不行
let let_guard = false;  // 【守护】
let let_guard_other = 20;  // 【守护】对方的时间，同步用 秒数

const dp = new DPlayer({
    container: document.getElementById('dplayer'),
    screenshot: true,  // 截图按钮，照相机图标，默认值：false
    hotkey: true,
    preload: 'auto',
    theme: '#009ad6',  // 主题色  青色#009ad6
    volume: 0.2,       // 初始音量
    lang: 'zh-cn',     // 语言选择
    playbackSpeed: [0.5, 1, 1.25, 1.5, 2, 4],  // 倍速的选项修改，要去掉一个才能加上1个
    mutex: true,  // 互斥，阻止多个播放器同时播放，当前播放器播放时暂停其他播放器
    video: {
        url: "/static/001.mp4",  //或'/static/001.mp4',  {{ url_for('static', filename='001.mp4') }}
        type: 'auto',
        headers: {'uuu': 'iii'}
    },
    //live: true,  直播不能拉进度条
    danmaku: {
        id: 'demo',
        api: '', // 禁用默认API
        maximum: 1000,
        bottom: '15%',    //弹幕距离播放器底部的距离，防止遮挡字幕，取值形如: '10px' '10%'
        unlimited: true,  //海量弹幕模式，即使重叠也展示全部弹幕，请注意播放器会记忆用户设置，用户手动设置后即失效
        speedRate: 0.5,     //弹幕速度倍率，越大速度越快【1】
    },
    subtitle: {  //外挂字幕，有字幕按钮，目前只支持 webvtt
        url: '', // 禁用默认API 'https://api.prprpr.me/dplayer/test.vtt',
        type: 'webvtt',
        fontSize: '25px',
        bottom: '10%',
    },
    contextmenu: [  //自定义右键菜单
        {
            text: '复制链接',
            click: () => { navigator.clipboard.writeText(window.location.href) }
        },
        {
            text: '右键显示加按钮',
            click: () => { navigator.clipboard.writeText(window.location.href) }
        }
    ],
    highlight: [  //自定义进度条提示点
        { time: 1800, text: '第30分钟' },
        { time: 3600, text: '第1小时' },
        { time: 5400, text: '第1.5小时' },
        { time: 7200, text: '第2小时' },
        { time: 9000, text: '第2.5小时' },
    ],
    airplay: true,   // 在Safari中开启AirPlay
});

// 定时上报，返回最新，显示数据
function report_status() {
    const position = dp.video.currentTime;  //秒数
    const state = dp.video.paused ? '暂停' : '播放';
    const speed = dp.video.playbackRate;
    fetch(`/report99?u=${user99}&position=${position}&state=${state}&speed=${speed}`)
        .then(response => response.json())
        .then(data => {
            let content = '';
            let con02 = '';  // 简略用
            for (const [user9, info9] of Object.entries(data)) {
                content += `<div>
                <span>【${user9}】</span>
                <span>进度：${info9.position_str}</span>
                <span>${info9.state}</span>
                <span>倍速：${info9.speed}</span>
                <span>更新时间：${info9.timestamp_str}</span>
                <span> ${info9.position_diff}</span>
                ${info9.is_self ? '' : `<button onclick="dp.video.currentTime=${info9.position}">同步</button>`}
                </div>`;
                // 简略版 不显示自己
                if (!info9.is_self) {   // 如果不是自己
                let_guard_other = info9.position  // 【守护】对方的时间，同步用 秒数
                con02 += `<div>${user9},${info9.position_diff}<button onclick="dp.video.currentTime=${info9.position}">同步</button></div>`;
                }
            }  // 循环每个用户
            document.getElementById('current-user').innerHTML = content;
            e02info.innerHTML = con02;    //【9.2】页面元素
        }).catch(console.error);
}
setInterval(report_status, 1000);  // 定时器每1秒循环 调试注释不然消息太多

// ---2.0---连接WebSocket
const socket2 = io();
// ---2.1---监听连接事件
socket2.on("connect", () => {
    console.log("已连接，Socket ID:", socket2.id);
    socket2.emit('link2', { user: user99 });  // 发websocket
});
// ---2.2---重写发送弹幕逻辑，消息发到服务端
dp.on('danmaku_send', (danmu3) => {
    const time3 = dp.video.currentTime;
    // 发收websocket
    socket2.emit('danmu2', {
        user: user99,
        text: danmu3.text,
        time: time3,
        color: danmu3.color,
        type: danmu3.type,
    });
});

// ---2.4---重写截图按钮逻辑，广播所有人进度screenshot
dp.on('screenshot', function () {
    socket2.emit('screenshot2', { user: user99 });  // 发websocket
});

// ---3.1---外置广播进度信息按钮
function broadcast_position() {
    socket2.emit('screenshot2', { user: user99 });  // 发websocket
}





// ---3.6---全体向我同步按钮  (到3.5)
function follow_m1_btn() {
    socket2.emit('position2', { user: user99, pos: 60 });  // 发websocket
}

// ---3.7---切换为外部视频链接按钮
function video_link_btn() {
    const t004 = document.getElementById('video_link1').value;
    dp.switchVideo({ url: t004 })
}


// 【4.1】循环 【守护】我快，我退。我慢，全体向我同步
function loop_guard() {
  if (let_guard) {   // 开启时触发
      const diff02 = dp.video.currentTime - let_guard_other   //【守护】变量let_guard_other对方的时间，同步用 秒数
      if (diff02 > 6) {
          fun_element_message("守护.我快了.自己回退", "#FF0000")   //红色#FF0000
          dp.video.currentTime = let_guard_other; }   // 我快，我退
      if (diff02 < -6) {
          socket2.emit('danmu2', { user: user99, text: '守护触发.我慢了全体向我同步', color: '#FF0000' });  // 发websocket
          follow_me_btn(); }  // 我慢，全体向我同步
  }
}
setInterval(loop_guard, 2000);  // 定时器每2秒循环



// 【5.1】全体播放按钮
function follow_play_btn() { socket2.emit('play2', { user: user99 }); }  // 发websocket
socket2.on('play_all', () => { dp.play(); });  // 接收到全体播放
// 【5.2】全体暂停按钮
function follow_pause_btn() { socket2.emit('pause2', { user: user99 }); } // 发websocket
socket2.on('pause_all', () => { dp.pause(); });  // 接收到全体暂停
// 【5.3】全体倍速按钮
function speed_btn(speed01) { socket2.emit('speed2', { user: user99, speed: speed01 }); } // 发websocket
socket2.on('speed_all', (speed02) => {
   if (dp.video.playbackRate !== speed02) {
       console.log("收到全体倍速", speed02);
       dp.video.playbackRate = speed02; }
});
// 【5.4】 全体向我同步按钮
function follow_me_btn() { socket2.emit('position2', { user: user99, pos: dp.video.currentTime }); }  // 发websocket
socket2.on('position_all', (pos2) => { dp.video.currentTime = pos2; });
// 【5.5】外置全体通知notice按钮
e_input_txt01 = document.getElementById('txt01')  //输入框01
e_input_txt01.addEventListener('keydown', (e) => { if (e.key === 'Enter') { notice_btn() } });  // 监听输入框的回车键发送
function notice_btn() {
    if (e_input_txt01.value) {  //防直接点按钮
        socket2.emit('notice2', {
            user: user99,
            text: e_input_txt01.value,
        });    // 发websocket
        e_input_txt01.value = '';   // 发完清空
    }
}
socket2.on('notice_all', (data) => {   //收websocket 显示notice
    console.log("收到notice", data);  //{t1是消息内容: 'gg:hello', t2: 3000, t3: 1}
    dp.notice(data.t1, data.t2, data.t3)
    fun_div_log(data.t1)  //页面上记录累加
});
// 【5.6】外置全体弹幕广播按钮
e_input_txt02 = document.getElementById('txt02')  //输入框02
e_input_txt02.addEventListener('keydown', (e) => { if (e.key === 'Enter') { danmu_btn() } });  // 监听输入框的回车键发送
function danmu_btn() {
    if (e_input_txt02.value) {  //防直接点按钮
        socket2.emit('danmu2', { user: user99, text: e_input_txt02.value });  // 发websocket
        e_input_txt02.value = '';   // 发完清空
    }
}
socket2.on('danmu_all', (data) => {  //收websocket 接收弹幕并显示
    console.log("收到弹幕all", data);
    // 【5.6.1】DPlayer的弹幕，缺点手机浏览器全屏不行。暂停看不到。 手机看会卡屏禁用
    if (let_dplayer_danmu) {   // dp弹幕开关
        dp.danmaku.draw({
            text: data.text,
            color: data.color || '#fff',
            type: data.type || '0',  // 种类 0是滚动 1是顶部 2是底部
        });
    }
    // 【5.6.2】自制元素弹幕
    fun_element_message(data.text, data.color)
    fun_div_log(data.text)  //页面上记录累加
});
// 【5.7】外置全体元素消息按钮
e_input_txt03 = document.getElementById('txt03')  //输入框03
e_input_txt03.addEventListener('keydown', (e) => { if (e.key === 'Enter') { notice_btn() } });  // 监听输入框的回车键发送
function element_msg_btn() {
    if (e_input_txt03.value) {  //防直接点按钮
        socket2.emit('element2', { user: user99, text: e_input_txt03.value });  // 发websocket
        e_input_txt03.value = '';   // 发完清空
    }
}
socket2.on('element_all', (data) => {  //收websocket 接收元素消息并显示
    console.log("收到element_all", data);
    fun_element_message(data.text, data.color)
    fun_div_log(data.text)  //页面上记录累加
});


// 【6.1】开关按钮，dp弹幕
document.getElementById('id_let_dplayer_danmu').textContent = `当前${let_dplayer_danmu}`;  //初始化
function btn_let_dplayer_danmu() {
    let_dplayer_danmu = !let_dplayer_danmu; // 切换布尔值
    document.getElementById('id_let_dplayer_danmu').textContent = `当前${let_dplayer_danmu}`; // 实时更新显示
}
// 【6.2】开关按钮，video buffered测速
document.getElementById('id_let_net_speed').textContent = `当前${let_net_speed}`;  //初始化
function btn_let_net_speed() {
    let_net_speed = !let_net_speed; // 切换布尔值
    document.getElementById('id_let_net_speed').textContent = `当前${let_net_speed}`; // 实时更新显示
    e01speed.textContent = ''   //不判断，都清空，有用后面会刷新
}
// 【6.3】按钮【守护】
document.getElementById('id_guard').textContent = `当前${let_guard}`;  //初始化
function btn_guard() {
    let_guard = !let_guard; // 切换布尔值
    document.getElementById('id_guard').textContent = `当前${let_guard}`; // 实时更新显示
    if (let_guard) {
        e03guard.style.color = '#97FFFF';   // 黄色#EEEE00  蓝色#97FFFF
    } else { e03guard.style.color = '#fff'; }  //白色#fff
}

// 【7.1】事件监听，loadedmetadata 视频元数据（如时长、分辨率等）加载完成后触发
let let_per_kb = 100;  //默认视频平均每秒100kb的数据
dp.on('loadedmetadata', () => {
document.getElementById('e505duration').textContent = convertSecondsToHMS(dp.video.duration); //取视频总时长，如8460.715774
document.getElementById('e506').textContent = dp.video.videoWidth;   //视频宽
document.getElementById('e507').textContent = dp.video.videoHeight;  //视频高
// 获取视频总字节数（需服务器允许 CORS）
fetch(dp.video.src, { method: 'HEAD', headers: {'Range2': 'bytes=0-'} })  //HEAD仅返回响应头（Headers），不返回 Body。  请求头Range bytes=0-
  .then(response => {
    if (response.ok) {
      totalBytes = parseInt(response.headers.get('Content-Length'), 10);   //如3166502912  字节(B)
      document.getElementById('e509size').textContent = formatBytes(totalBytes);  //换算单位函数，如2.95 GB
      let_per_kb = Math.floor(totalBytes / dp.video.duration / 1024)   //如365  单位kb/s
      document.getElementById('e510per').textContent = let_per_kb;

    }
  })
  .catch(error => console.error('获取视频大小失败:', error));
});

//【7.2】事件监听，<video>的progress事件跟踪媒体资源的加载进度（缓冲进度）加载视频时定期触发此事件
let let_last_progress_time = 0;   // 上次监听progress事件的最新缓存秒数
let let_last_check_time = Date.now(); // 上次检查时间
dp.video.addEventListener('progress', () => {
  // 【7.2.1】更新页面上已多缓存516.8秒
  const c01 = dp.video.currentTime
  const buffered02 = dp.video.buffered;
  if (buffered02.length <= 0) { return 0 }

  const b01 = buffered02.end(buffered02.length - 1) //当前缓存到秒
  const sec2 = b01-c01   // 比播放进度多缓存了几秒 如111.68916541616
  const sec3= sec2.toFixed(1)  // 保留1位小数
  document.getElementById('e508').textContent = sec3;
  if (let_net_speed) {
      // 【7.2.2】对比上次更更新，本次更新秒数的数据量，平均下载速度
      sec03 = b01 - let_last_progress_time  //这次progress多缓存了x秒
      data04 = sec03 * let_per_kb   //这次progress多缓存了kb
      //console.log('监听progress本次多缓存秒与kb', sec03, data04);  //如 5.61466699999994 2049.353454999978
      const now05 = Date.now();
      const time06 = (now05 - let_last_check_time) / 1000; // 转换为秒
      const per07 = data04 / time06
      //console.log('监听progress距离上次秒与平均速度', time06, per07); //如 4.516 451.99325620018146
      document.getElementById('e509per').textContent = per07.toFixed(1);  //如388.2
      e01speed.textContent = "缓存" + sec3 + "秒\n" + per07.toFixed(1) + " KB/s";   //【9.1】页面元素
      let_last_progress_time = b01  //缓存这次 上次监听progress事件的最新缓存秒数
      let_last_check_time = now05   //缓存这次 上次检查时间
  }
})
// 【7.3】监听：卡顿检测，使用浏览器API
dp.video.addEventListener('waiting', () => {
    console.log('浏览器检测到缓冲等待1');
    kakaka = true
    setTimeout(() => {   // 自己跳进度也会触发，1秒后还是没恢复再发
        console.log('浏览器缓冲等待一秒后', kakaka)
        if (kakaka) {  // 还是卡就真卡了   红色#FF0000
            socket2.emit('danmu2', { user: user99, text: '卡了', color: '#FF0000' });  // 发收websocket
            kakaka_real = true
        }
    }, 1500);     // 1秒后再查
});
// 【7.4】监听：卡顿恢复，使用浏览器API
dp.video.addEventListener('playing', () => {
    console.log('浏览器检测到恢复播放2');
    kakaka = false;
    if (kakaka_real) {
        socket2.emit('danmu2', { user: user99, text: '不卡啦', color: '#FF0000' });  // 发收websocket
        kakaka_real = false
    }
});
// 【7.5】监听：选择本地文件按钮
const const_input_local_video = document.getElementById('input_local_video');
const_input_local_video.addEventListener('change', function(e) {
    //出于浏览器安全策略的严格限制，无法通过硬编码文件路径（如 C:\Users\...\video.mp4）直接访问本地文件
    //安全提示：任何试图绕过浏览器安全机制的行为都可能被现代浏览器标记为恶意攻击！
    const file = e.target.files[0];
    console.log('e file', file)
    const videoURL = URL.createObjectURL(file);   // 生成临时访问URL,无法固定
    console.log("生成临时访问videoURL", videoURL) //如 blob:http://127.0.0.1:5000/67b5f67f-dc8f-46ee-9833-33ce1b13620a
    dp.switchVideo({url: videoURL})   // dplayer切换
});


// 【8.1】函数，将秒数转换为 时:分:秒  如"01:01:10"    (7.1用)
function convertSecondsToHMS(seconds) {
  seconds = Math.floor(seconds);  // 将总秒数直接舍去小数（取整）
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const pad = (num) => num.toString().padStart(2, '0');    // 补零函数：确保两位数格式
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}
//【8.2】函数，将字节(B)转为
function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) { return '0 B'; }
  if (bytes === 0) { return '0 B'; }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  // 保留两位小数并移除末尾的零
  const formattedValue = value.toFixed(2).replace(/\.?0+$/, '');
  return `${formattedValue} ${units[unitIndex]}`;
}
// 【8.3】函数，页面元素消息,替代弹幕
function fun_element_message(txt001, color002) {
  const notification1 = document.createElement('div');    // 创建新通知元素
  notification1.style.zIndex = '888';             // 确保弹幕在视频上方
  notification1.style.position = 'absolute';  // 绝对定位
  notification1.style.left = '20px';  // 距离左侧 10 像素，手机屏幕左上弧度
  notification1.style.top = `${Math.random() * 70}%`; // 随机垂直位置（0%-70%）
  notification1.style.color = color002;  // 文字颜色为白色#fff  橘色#FF8247
  notification1.style.whiteSpace = 'pre-wrap';     // 允许文字换行
  notification1.style.fontSize = '12px';  // 字体大小为12像素
  //notification1.textContent = `系统通知 (${new Date().toLocaleTimeString()})`;  //文字内容
  notification1.textContent = txt001;
  dp.container.appendChild(notification1);    // 添加通知到容器
  //setTimeout(() => { notification1.style.left = "40%"; }, 3000);  // 向右移动一下
  setTimeout(() => notification1.remove(), 7000);     // 5秒后自动移除
};
// 【8.4】函数 当前格式时间 输出2024-03-05 15:30:02（示例时间）
function times() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
// 【8.5】函数，往页面div里加一行数据
const div_msg = document.getElementById('id_div_msg_log');
function fun_div_log(msg001) {
 const new_div = document.createElement('div');
 new_div.textContent = times() + ' ' + msg001;
 div_msg.appendChild(new_div);  // 将新创建的元素添加到容器
}




// 【9.1】页面元素，速度kb/s  右边显示如 缓存30.5秒  253.3 kb/s
const e01speed = document.createElement('div');
e01speed.id = 'e01speed';  //方便后续通过 document.getElementById 直接操作该元素。
e01speed.style.position = 'absolute';  // 绝对定位
//e02info.style.left = '10px';  // 距离左侧 10 像素
e01speed.style.right = '10px';  // 距离右侧 10 像素
//e03danmu.style.top = '90px';   // 距离顶 90 像素
e01speed.style.bottom = '90px';   // 距离底部 90 像素
e01speed.style.color = '#00FF00';  // 文字颜色为白色#fff  绿色#00FF00  蓝色#0000FF
e01speed.style.whiteSpace = 'pre-wrap';  // 或 'pre' 让换行符 \n 生效
//e01speed.style.backgroundColor = 'rgba(0,0,0,0.7)';  // 半透明黑色背景  rgba(0,0,0,0)透明
e01speed.style.padding = '2px 8px';  // 内边距（上下2px，左右8px）
//e01speed.style.borderRadius = '4px';  // 圆角边框（4px半径）
e01speed.style.fontSize = '12px';  // 字体大小为12像素
e01speed.textContent = '';   // 初始值0.00KB/s
dp.container.appendChild(e01speed);  //将元素插入到父元素的末尾

// 【9.2】页面元素，全员信息
const e02info = document.createElement('div');
e02info.id = 'e02info';  //方便后续通过 document.getElementById 直接操作该元素。
e02info.style.position = 'absolute';  // 绝对定位
e02info.style.left = '10px';  // 距离左侧 10 像素
e02info.style.bottom = '90px';   // 距离底部 30 像素
e02info.style.color = '#00FF00';  // 文字颜色为白色#fff  蓝色#00FF00
e02info.style.padding = '2px 8px';  // 内边距（上下2px，左右8px）
e02info.style.fontSize = '12px';  // 字体大小为12像素
e02info.textContent = '全员信息';
dp.container.appendChild(e02info);  //将元素插入到父元素的末尾
// 【9.3】页面元素按钮，守护按钮【守护】
const e03guard = document.createElement('button');
e03guard.id = 'e02info';  //方便后续通过 document.getElementById 直接操作该元素。
e03guard.style.position = 'absolute';  // 绝对定位
e03guard.style.right = '10px';  // 距离右侧 10 像素
e03guard.style.top = '90px';   // 距离顶 90 像素
e03guard.style.backgroundColor = 'rgba(0,0,0,0)';  //透明
e03guard.style.color = '#fff';  // 文字颜色为白色#fff  蓝色#00FF00
e03guard.style.fontSize = '12px';  // 字体大小为12像素
e03guard.onclick = btn_guard  // 绑定点击方法
e03guard.textContent = '守护';
dp.container.appendChild(e03guard);  //将元素插入到父元素的末尾










// 【5.2】显示User Agent信息
//function showUserAgent() {
//    const userAgentElement = document.getElementById('userAgent');
//    userAgentElement.textContent = navigator.userAgent;
      //console.log("dp.video.buffered", dp.video.buffered);
      //console.log("length", dp.video.buffered.length);
//}
//setInterval(showUserAgent, 5000);  // 定时器每1秒循环



// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('title').textContent = "17kan【" + user99 + "】";
  //get_info_5();
});