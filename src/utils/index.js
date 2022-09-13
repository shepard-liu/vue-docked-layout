
/**
 * 封装菜单开关的状态逻辑
 * 
 * vue2没有composable，写成这样子属实无奈之举
 * @param {Vue} self Vue组件实例
 * @param {String} showStateName 菜单显示状态名
 */
export function toggleMenu(self, showStateName) {
    self[showStateName] = !self[showStateName];

    if (self[showStateName]) {    // 菜单打开时
        // 暂停用户选择
        document.documentElement.style.userSelect = 'none';
        // 监听document上的鼠标按下事件
        const documentMouseDownListener = (ev) => {
            self[showStateName] = false;
            // 重启用户选择
            document.documentElement.style.userSelect = null;
            document.removeEventListener('mousedown', documentMouseDownListener);
        }
        /**
         * 本次点击事件会冒泡到document，从而导致刚打开的menu被关闭。
         * 使用setTimeout异步添加listener可在本次事件销毁后再监听全局mousedown。
         * 
         * 不可以直接在前面调用event.stopPropergation()停止冒泡，因为其他menu显示时也会停止冒泡，
         * 导致多个menu同时出现。
         */
        setTimeout(() => {
            document.addEventListener('mousedown', documentMouseDownListener);
        });
    }
}


/**
 * 防抖函数
 * @param {(...args: any) => unknown} fn  被防抖函数
 * @param {number} ms 延迟时间milliseconds
 * @returns {(...args:any)=>Promise<unknown>} 被防抖函数（使用Promise包装返回值），若触发防抖则会reject
 */
export function debounce(fn, ms) {
    let timeOut = null;

    return async function (...args) {
        return new Promise((resolve, reject) => {
            if (timeOut !== null) {
                clearTimeout(timeOut);
                reject('debounced');
            }
            timeOut = setTimeout(() => {
                timeOut = null;
                resolve(fn.apply(this, args));
            }, ms);
        });
    };
}

/**
 * 节流钩子函数
 * @param {(...args: any) => unknown} fn 被节流函数
 * @param {number} ms 延迟时间milliseconds
 * @returns {(...args:any)=>Promise<unknown>} 被节流函数（使用Promise包装返回值），若触发节流则会reject
 */
export function throttle(fn, ms) {
    let shouldRun = true;

    return async function (...args) {
        return new Promise((resolve, reject) => {
            if (!shouldRun) { reject('throttled'); return; };
            shouldRun = false;

            setTimeout(() => {
                shouldRun = true;
                resolve(fn.apply(this, args));
            }, ms);
        });
    }
}

/**
 * 同步节流钩子函数，被节流函数首次调用将立即执行，此后一段时间内只能执行一次
 * @param {(...args: any) => unknown} fn  被节流函数
 * @param {number} ms 延迟时间milliseconds
 * @returns {(...args:any) => unknown} 
 */
export function throttleSync(fn, ms) {
    let lastTime = Date.now() - ms;

    return function (...args) {
        if (Date.now() - lastTime < ms) throw new Error('Throttled(Synchronized)');
        lastTime = Date.now();
        return fn.apply(this, args);
    };
}


// 近似相等
export const approxEq = (n1, n2, epsilon = Number.EPSILON) => Math.abs(n1 - n2) < epsilon;