/**
 * @author penny
 * @description 收集和封装常用的 JS 操作（兼容 >= IE6）
 */
;(function(lib) {
    /**
     * 绑定横竖屏切换事件
     * @param  {Function} landscapeFn 横屏下执行的操作
     * @param  {Function} portraitFn  竖屏下执行的操作
     */
    lib.handleScrRotate = function(landscapeFn, portraitFn) {
        var evt = 'onorientationchange' in window ? 'orientationchange' : 'resize';
        var doHandle = function() {
            // 竖屏 window.orientation === 180 || window.orientation === 0
            var isLandscape = 'orientationchange' == evt ? (window.orientation === 90 || window.orientation === -90) : (window.innerWidth > window.innerHeight);
            isLandscape ? ('function' == typeof landscapeFn && landscapeFn()) : ('function' == typeof portraitFn && portraitFn());
        };
        var timer = null;
        lib.addEvt(window, evt, function() {
            if ('resize' == evt) {
                timer && clearTimeout(timer);
                timer = setTimeout(doHandle, 300);
            } else {
                doHandle();
            }
        });
    };

    /**
     * 绑定事件
     * @param {Object}   elm 需要绑定事件的元素
     * @param {String}   evt 事件名称
     * @param {Function} fn  [description]
     */
    lib.addEvt = function(elm, evt, fn) {
        if (!elm) return;
        elm.addEventListener && elm.addEventListener(evt, fn, false) 
            || elm.attachEvent('on' + evt, fn);
    };

    /**
     * 添加 HTML 结构代码
     * @param {Object} elm    添加位置的父节点
     * @param {String} html   添加的 html 代码字符串
     * @param {Number} direct 默认在末尾追加，值为 -1 时在最前面添加
     */
    lib.addHTML = function(elm, html, direct) {
        if (!elm) return;
        var fragm = document.createDocumentFragment();
        var childLst = null;
        var elmTmp = document.createElement('div');
        elmTmp.innerHTML = html;
        childLst = elmTmp.childNodes;
        for (var i = 0; i < childLst.length; i++) {
            fragm.appendChild(childLst[i].cloneNode(true));
        }
        if (-1 === direct) {
            elm.insertBefore(fragm, elm.firstChild);
        } else {
            elm.appendChild(fragm);
        }
        return elm;
    };

    /**
     * 浏览器可视区域高度
     * @return {Number} 可视区域高度
     */
    lib.getWinHeight = function(){
        return window.innerHeight ? 
            window.innerHeight : 
            (document.documentElement && document.documentElement.clientHeight ? 
                document.documentElement.clientHeight : 
                document.body.offsetHeight);
    };
    
    /**
     * 浏览器可视区域宽度
     * @return {Number} 可视区域宽度
     */
    lib.getWinWidth = function() {
        return window.innerWidth ? 
            window.innerWidth : 
            (document.documentElement && document.documentElement.clientWidth) ? 
                document.documentElement.clientWidth : 
                document.body.offsetWidth;
    };

    /**
     * 阻止冒泡
     * @param  {Object} e 事件对象
     */
    lib.stopBubble = function(e) {
        var evt = e || window.event;
        // cancelBubble (<= IE8)
        evt.stopPropagation ? evt.stopPropagation() : evt.cancelBubble = true;
    };

    /**
     * 根据 URL 参数名获取参数值
     * @param  {String} url   指定的 URL
     * @param  {String} name URL参数名
     * @return {String}      返回获取到的参数值
     */
    lib.getParam = function(url, name) {
        if (!name) return;

        var key = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
        var regExp = new RegExp('[\\?&#]' + key + '=([^&#]*)');
        var results = regExp.exec(url);
        return null == results ? undefined : results[1];
    };

    /**
     * 给 URL 添加参数
     * @param  {String} url   指定的 URL
     * @param  {String} param 参数名和值
     * @return {String}       添加参数后的 URL
     */
    lib.addParam = function(url, param) {
        if ('string' != typeof url || 'undefined' == typeof param) return url;

        var qStr = (-1 == url.indexOf('?') ? '?' : '&') + param;
        var i = url.indexOf('#');
        if (-1 == i) return url + qStr;
        return url.substring(i, -1) + qStr + url.substring(i);
    };

    /**
     * 加载数据，同时支持：
     * 1. 加载接口数据（若在 url 中指定 callback，则请求响应后不删除对应的回调函数）
     * 2. 发起请求并在响应后执行操作（传 fn，不传 fnName 且 url 中不指定 callback 参数）
     * @param  {String}   url          资源url
     * @param  {Function} fn           回调函数
     * @param  {String}   fnName 回调函数名
     * @param  {String}   charset      资源编码
     */
    lib.loadData = function(url, fn, fnName, charset) {
        // 判断 url 本身是否已经带有 callback 参数
        // 优先考虑 url 中带有的 callback 参数值为 fnName
        var cbName = lib.getParam(url, 'callback');
        var fnName = cbName || fnName;
        var cb = cbName || !fnName ? '' : 'callback=' + fnName;

        // 确保添加的 callback 参数不受其他参数影响（避免 url 本身包含 '#' 锚点时接口无法正确识别 callback 参数）
        var pos = url.indexOf('?') + 1;
        if (cb) url = 0 == pos ? (url + '?' + cb) : (url.substring(pos, -1) + cb + '&' + url.substring(pos));

        if ('function' == typeof fn && fnName) window[fnName] = fn;
        // document.head (>= IE9)
        var headElm = document.head || document.getElementsByTagName('head')[0];
        var scriptElm = document.createElement('script');

        // 注意确保 charset 在 src 赋值之前执行，否则在 <= IE7 会不生效
        if(charset) scriptElm.charset = charset;
        scriptElm.src = url;
        headElm.appendChild(scriptElm);

        scriptElm.onload = scriptElm.onreadystatechange = function() {
            var f = scriptElm.readyState;
            if (f && f != 'loaded' && f != 'complete') return;

            scriptElm.onload = scriptElm.onreadystatechange = null;
            headElm.removeChild(scriptElm);
            
            // 如果只传入回调函数 fn，不传入 fnName 且 url 中不指定 callback 参数，则执行回调函数
            if ('function' == typeof fn && !cb) fn();

            // 如果没有在 url 中指定 callback，则删除对应的回调函数，否则不删除
            if (!cbName && window[fnName]) {
                try {
                    delete window[fnName];
                } catch {
                    // <= IE8 下删除 window 下的属性或方法会抛出异常
                    window[fnName] = undefined;
                }
            }
        };
    };

    /**
     * 用于走马灯式向上滑动，有停顿
     * @param  {Object} elm   元素对象
     * @param  {Number} speed 滑动速度（滑动一个子元素高度的时间，单位毫秒）
     * @param  {Number} delay 停顿时间
     */
    lib.initMarquee = function(elm, speed, delay) {
        if (!elm || elm.children.length < 2) return;

        var sintv = null; // 定时器
        var pauseFlag = false; // 暂停标志
        var height = elm.children[0].clientHeight; // 容器高度

        elm.innerHTML += elm.innerHTML;
        elm.scrollTop = 0;

        elm.onmouseover = function() {
            pauseFlag = true;
        };

        elm.onmouseout = function() {
            pauseFlag = false;
        };

        setTimeout(start, delay);

        function start() {
            sintv = setInterval(move, speed / height);
            if (!pauseFlag) elm.scrollTop += 1;
        }

        function move() {
            if (elm.scrollTop % height != 0) {
                elm.scrollTop += 1;
                if (elm.scrollTop >= elm.scrollHeight / 2) elm.scrollTop = 0;
            } else {
                clearInterval(sintv);
                setTimeout(start, delay);
            }
        }
    };

})(window.lib = window.lib || {});