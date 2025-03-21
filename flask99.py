# coding=utf-8
from flask import Flask, request, jsonify, render_template, send_from_directory, g
from flask_socketio import SocketIO, emit
import time
from datetime import datetime

# github【umena337/17kan】https://github.com/umena337/17kan
# pip install flask_socketio
# pip install Flask-CORS


app = Flask(__name__, template_folder="static")  # template_folder指定模板文件目录，默认是templates
socketio = SocketIO(app)

users_data = {}  # 存储用户上报播放数据
all_speed = 1.0  # 全局所有人倍速


def seconds_to_hms(seconds):   # 时间转换：秒数 >> 00:00:31或27:46:40
    seconds = float(seconds)   # '1593.425472'
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    return f"{hours:02}:{minutes:02}:{seconds:02}"   # 00:00:00或00:00:31或00:11:06或27:46:40


def convert_bytes(size: int, decimal_places: int = 2) -> str:   # 字节B单位转换
    size = int(size)
    units = ['B', 'KB', 'MB', 'GB', 'TiB', 'PiB']
    for unit in units:
        if size < 1024 or unit == units[-1]:
            break
        size /= 1024
    return f"{size:.{decimal_places}f} {unit}"


@app.route('/')
def index():
    user = request.args.get('u')
    if not user:
        return '请提供u参数区分用户，例如：http://127.0.0.1:59117/?u=umena或http://192.168.9.9:59117/?u=33七', 200
    return render_template("index99.html")  # 已指定模板文件目录static


@app.route('/favicon.ico')   # 浏览器显示小图标
def favicon():
    return send_from_directory(app.static_folder, 'favicon.ico')  # app.static_folder默认项目根目录下的 static 文件夹


@app.before_request
def before001():   # 请求之前
    # 使用 Range 和 If-Range 头字段是实现分段加载（断点续传或分块传输）
    g.start_time = time.time()
    g.request_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    # range  bytes=2156953600-2160626189
    # if 'Range' in request.headers:
    #     print(
    #         f"[分段请求开始] 时间: {g.request_time}\n"
    #         f"URL: {request.url}\n"
    #         f"Range: {request.headers.get('Range')}\n"
    #         "----------------------------------------"
    #     )


@app.after_request
def log_range_end(response):
    # 对于流式响应，after_request可能是在响应开始发送时就被调用，而不是在发送完成后
    # 仅包含读取文件分块和发送到内核缓冲区的时间。

    # if response.status_code == 206:
    #     duration = time.time() - g.start_time
    #     content_range = response.headers.get('Content-Range', '')
    #     if content_range:
    #         range_info = content_range.split(' ')[1]
    #         byte_range, total_size = range_info.split('/')
    #         start, end = byte_range.split('-')
    #     else:
    #         start = end = total_size = 'unknown'
    #     print(
    #         f"[分段请求结束] 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')}\n"
    #         f"状态码: {response.status_code}\n"
    #         f"范围: {start}-{end}\n"
    #         f"总大小: {total_size}\n"
    #         f"耗时: {duration:.3f}s\n"
    #         "========================================"
    #     )
    # # response.call_on_close`注册一个回调函数，当响应关闭时执行，这可能更接近传输完成的时机
    # return response

    # if 'Range' in request.headers:
    #     # print('---结束有range', request.method, response.status_code)   # 结束有range GET 206
    #     req_range = request.headers.get('Range')
    #     if req_range != 'bytes=0-':   # 区分head用，它也显示get
    #         print(req_range)
    #         # 如未定义HEAD路由，但存在对应的GET路由，则框架会自动调用GET路由的逻辑，但丢弃响应 Body（仅返回 Headers）
    #         # print('分段请求头range:', req_range)   # 如bytes=2152497152-2160626189
    #         # print('返回Content-Range', response.headers.get('Content-Range'))  # 如bytes 2152497152-2160626189/2160626190
    #         rsp_length = response.headers.get('Content-Length', 1)
    #         print('数据Content-Length大小', convert_bytes(rsp_length))
    #         # 检查实际数据
    #         data1 = response.get_data()
    #         print('len--', len(data1))
    #         t1 = time.time() - g.start_time   # 秒数差
    #         print('返回时间t1', t1, rsp_length)
    #         print(request.headers)
    #
    #         # 注册回调函数：在响应传输完成后触发
    #         @response.call_on_close
    #         def on_close():
    #             t2 = time.time() - g.start_time   # 秒数差
    #             print('返回时间t2', t2, rsp_length)
    return response


@app.after_request   # 管理所有请求的响应行为
def after_request001(response):  # 允许全部跨域访问我
    response.headers['Access-Control-Allow-Origin'] = '*'    # 允许所有来源（生产环境应指定具体域名）
    response.headers['Access-Control-Allow-Methods'] = '*'   # 允许的请求方法
    response.headers['Access-Control-Allow-Headers'] = '*'   # 允许的请求头
    response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    return response


@app.route('/report99', methods=["GET"])   # 处理用户每秒上报，返回全部信息
def handle_report99():
    user01 = request.values.get('u', '无')
    if not user01:
        return
    users_data[user01] = {
        'position': request.values.get('position', 0),
        'state': request.values.get('state', 'paused'),
        'speed': request.values.get('speed', 1),
        'timestamp': time.time(),
    }
    # ---清理过期数据
    current_time = time.time()
    expired_users = [k for k, v in users_data.items() if current_time - v['timestamp'] > 10]
    for ii in expired_users:
        del users_data[ii]
        d1 = {'text': '【%s】离开,当前【%s】人' % (ii, len(users_data)),
              'color': '#FF79BC'}  # 粉色#FF79BC
        print(d1)
        socketio.emit('danmu_all', d1)  # 发送广播，emit设置broadcast=True可以实现广播功能

    # ---返回数据
    for key1 in users_data:  # 字典循环
        users_data[key1]['position_str'] = seconds_to_hms(users_data[key1]['position'])  # 如此用户播放进度为01:02:03
        users_data[key1]['timestamp_str'] = '%.3f秒前' % (time.time() - users_data[key1]['timestamp'])  # 如0.567秒前
        position_diff = float(users_data[user01]['position']) - float(users_data[key1]['position'])  # 两人秒数差
        users_data[key1]['position_diff'] = f"{'比ta快' if position_diff >= 0 else '比ta慢'}{abs(position_diff):.1f}秒"  # 领先1.1秒
        users_data[key1]['is_self'] = key1 == user01   # 是不是自己 True / False
    users_data[user01]['position_diff'] = '自己'
    u01 = {   # 样例
        "is_self": False,
        "position": "9788.9517",
        "position_diff": "落后8914.7秒",  # "自己"
        "position_str": "02:43:08",
        "speed": "1",
        "state": "paused",
        "timestamp": 1741872731.9501228,
        "timestamp_str": "0.704秒前"
    }  # 样例
    return jsonify(users_data)   # 返回用户json


@app.route('/v3/', methods=['GET', 'POST'])  # 默认弹幕连接
def handle_v3():
    # "GET /v3/?id=demo&max=1000 HTTP/1.1" 200 117 0.000562  dplayer默认连接弹幕
    return 'v3'  # 就为了不404


@socketio.on('connect')  # ---2.0---websoket连接
def handle_connect(data):
    # print('客户端连接', request.sid)  # 客户端连接 tyKDOYNiQo8lpircAAAB None
    emit('speed_all', all_speed)  # 新客户端连接时发送当前速度


@socketio.on('link2')   # ---2.1---连接后客户端发送名字，广播有人接入
def handle_link2(data):
    print('用户接入', str(data))  # 用户接入 {'user': 'aa'}
    if data['user'] in users_data.keys():
        num = len(users_data)
    else:
        num = len(users_data) + 1  # 刚接入还没上报
    d1 = {'text': '【%s】连入,当前【%s】人' % (data['user'], num),
          'color': '#FF79BC'}   # 粉色#FF79BC
    print(d1)
    emit('danmu_all', d1, broadcast=True)  # 发送广播，emit设置broadcast=True可以实现广播功能


@socketio.on('danmu2')    # ---2.2---接收客户端发送来的弹幕， 然后广播    (3.3到2.3)
def handle_danmu2(data):
    # type 0是滚动 1是顶部 2是底部
    print('接收弹幕', str(data))  # 接收弹幕 {'user': 'aa', 'text': 'wdwd', 'time': 0, 'color': 16777215, 'type': 0}
    color2 = data.get('color', '#FFFF00')  # 收到dplayer内置弹幕颜色如16777215或3788031是十进制颜色值
    if type(color2) == int:
        color2 = f"#{color2:06X}"    # 转换为十六进制格式（如#RRGGBB）
    d2 = {
        'text': '%s:%s' % (data['user'], data['text']),
        'color': color2,  # 默认值#FFFF00黄色
        'type': data.get('type', 0),      # 种类 0是滚动 1是顶部 2是底部
    }
    emit('danmu_all', d2, broadcast=True)   # 发送广播，emit设置broadcast=True可以实现广播功能


@socketio.on('notice2')    # ---3.2 到 2.5---接收客户端发送来的notice， 然后广播
def handle_notice2(data):
    print('接收notice', str(data))  # 接收notice {'user': 'gg', 'text': 'dwdwwdw'}
    # 发3参数 dp.notice(text: string, time: number): 显示通知，时间的单位为毫秒，默认时间 2000 毫秒，默认透明度 0.8
    d2 = {'t1': '%s:%s' % (data['user'], data['text']),
          't2': 5000,  # 默认时间 2000 毫秒 time: number
          't3': 1, }     # 默认透明度 0.8
    emit('notice_all', d2, broadcast=True)   # 发送广播，emit设置broadcast=True可以实现广播功能


@socketio.on('element2')    # 【3.8】外置全体元素消息按钮
def handle_element2(data):
    # socket2.emit('element2', { user: user99, text: t003 });  // 发websocket
    print('接收元素消息', str(data))
    d2 = {
        'text': '%s:%s' % (data['user'], data['text']),
        'color': data.get('color', '#FFF'),  # 默认值#FFFF00黄色  白色#fff
    }
    emit('element_all', d2, broadcast=True)   # 发送广播


@socketio.on('speed2')  # ---2.6到2.7 有倍速变化就上报 全体改变
def handle_speed2(data1):
    # socket2.emit('speed2', { user:user99, speed: dp.video.playbackRate });
    global all_speed
    all_speed = data1['speed']   # 改全局变量倍速
    d2 = {
        'text': '%s:全体%s倍速' % (data1['user'], data1['speed']),
        'color': '#FFFF00',  # 默认值#FFFF00黄色
        'type': 0,  # 种类 0是滚动 1是顶部 2是底部
    }
    emit('danmu_all', d2, broadcast=True)  # 全体弹幕广播
    emit('speed_all', data1['speed'], broadcast=True)  # 广播给所有客户端


@socketio.on('position2')  # ---3.4到3.5  上报播放进度，全体通知和同步
def position2(data1):
    # socket2.emit('position2', { user:user99, pos: position });  // 发websocket
    pos_str = seconds_to_hms(data1['pos'])  # 如此用户播放进度为01:02:03
    d2 = {
        'text': '向%s同步到%s' % (data1['user'], pos_str),
        'color': '#FFFF00',  # 默认值#FFFF00黄色
        'type': 0,  # 种类 0是滚动 1是顶部 2是底部
    }
    emit('danmu_all', d2, broadcast=True)  # 全体弹幕广播
    emit('position_all', data1['pos'], broadcast=True)  # 广播给所有客户端


@socketio.on('pause2')  # ---3.8到3.9  全体通知和暂停
def pause2(data1):
    # socket2.emit('pause2', { user: user99 });
    d2 = {
        'text': '%s:全体暂停' % data1['user'],
        'color': '#FFFF00',  # 默认值#FFFF00黄色
        'type': 0,  # 种类 0是滚动 1是顶部 2是底部
    }
    emit('danmu_all', d2, broadcast=True)  # 全体弹幕广播
    emit('pause_all', broadcast=True)  # 广播给所有客户端


@socketio.on('play2')  # ---3.8到3.9  全体通知和暂停
def play2(data1):
    # socket2.emit('play2', { user: user99 });
    d2 = {
        'text': '%s:全体播放' % data1['user'],
        'color': '#FFFF00',  # 默认值#FFFF00黄色
        'type': 0,  # 种类 0是滚动 1是顶部 2是底部
    }
    emit('danmu_all', d2, broadcast=True)  # 全体弹幕广播
    emit('play_all', broadcast=True)  # 广播给所有客户端


@socketio.on('screenshot2')    # ---2.4---重写截图按钮逻辑，广播所有人进度screenshot
def handle_screensho2(data):
    print('截图按钮重写广播', str(data))
    for k, v in users_data.items():
        t1 = {'text': '【%s】%s%s' % (k, v['position_str'], v['state']),
              'color': '#00FFFF',
              'type': 1, }  # 0是滚动 1是顶部 2是底部
        print(t1)
        emit('danmu_all', t1, broadcast=True)   # 发送广播，emit设置broadcast=True可以实现广播功能


if __name__ == '__main__':
    # socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
    # use_reloader=False 调试模式的重载器（Reloader）它会创建两个进程,子进程的日志默认不会传递到父进程的控制台，导致日志看似“消失”
    socketio.run(app, host='0.0.0.0', port=59117, debug=True, allow_unsafe_werkzeug=True, use_reloader=False)



