/**
 * DockedLayoutNode.data.js
 * 数据文件
 */

// 浮动节点尺寸调整函数组，定义窗体XY两个维度上的resize函数
function resizeXOnLeft(node, value) {
    node.left += value;
    node.width -= value;
}
function resizeXOnRight(node, value) {
    node.width += value;
}
function resizeYOnTop(node, value) {
    node.top += value;
    node.height -= value;
}
function resizeYOnBottom(node, value) {
    node.height += value;
}

// 浮动窗口resize条数据
export const panelResizeBarData = [
    {
        className: "left-resize",
        resizeFuncs: [resizeXOnLeft],
    },
    {
        className: "right-resize",
        resizeFuncs: [resizeXOnRight],
    },
    { className: "top-resize", resizeFuncs: [resizeYOnTop] },
    {
        className: "bottom-resize",
        resizeFuncs: [resizeYOnBottom],
    },
    {
        className: "left-top-resize",
        resizeFuncs: [resizeXOnLeft, resizeYOnTop],
    },
    {
        className: "left-bottom-resize",
        resizeFuncs: [resizeXOnLeft, resizeYOnBottom],
    },
    {
        className: "right-top-resize",
        resizeFuncs: [resizeXOnRight, resizeYOnTop],
    },
    {
        className: "right-bottom-resize",
        resizeFuncs: [resizeXOnRight, resizeYOnBottom],
    },
]