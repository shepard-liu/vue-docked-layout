
export function uniqueId(prefix) {

    let current = 0;

    // 获取下一个Id，返回值为字符串
    return function nextId() {
        if (current === Number.MAX_SAFE_INTEGER)
            current = 0;

        return (prefix || '') + current++;
    }
}
