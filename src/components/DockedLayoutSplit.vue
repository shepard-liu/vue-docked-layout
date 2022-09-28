<template>
    <div
        class="docked-layout-split"
        :style="splitStyle"
        @mousedown="handleMouseDown"></div>
</template>

<script>
export default {
    name: "DockedLayoutSplit",
    props: {
        // 分割条朝向
        orient: String,
        // 分割条尺寸
        size: {
            type: Number,
            default: 5,
        },
    },
    methods: {
        // 在分割条上鼠标按下时记录坐标，并在document上注册鼠标事件监听器
        handleMouseDown(ev) {
            const posProp = this.orient === "v" ? "clientX" : "clientY";
            // 拖动起点位置
            const start = ev[posProp];

            this.enablePanelInteraction(false);
            document.documentElement.style.cursor =
                this.orient === "v" ? "col-resize" : "row-resize";

            // 是否已emit dragStart事件
            let dragStartFired = false;

            // 记录上一次的位置坐标
            let last = start;

            // document上的鼠标移动事件监听器
            const documentMouseMoveListener = (ev) => {
                const current = ev[posProp];

                // 当本次拖拽分隔条，dragStart事件还未emit时
                if (dragStartFired === false) {
                    this.$emit("splitDragStart", { start });
                    dragStartFired = true;
                }

                this.$emit("splitDrag", {
                    start,
                    current,
                    delta: current - last,
                });
                last = current;
            };
            document.addEventListener("mousemove", documentMouseMoveListener);

            // document上的鼠标按键弹起事件监听器
            const documentMouseUpListener = () => {
                this.enablePanelInteraction(true);
                document.documentElement.style.cursor = null;
                document.removeEventListener(
                    "mousemove",
                    documentMouseMoveListener
                );
                document.removeEventListener(
                    "mouseup",
                    documentMouseUpListener
                );
                // 若已emit dragStart事件，则emit dragEnd事件
                if (dragStartFired) {
                    this.$emit("splitDragEnd", { start, end: last });
                }
            };
            document.addEventListener("mouseup", documentMouseUpListener);
        },
    },
    emits: ["splitDrag", "splitDragStart", "splitDragEnd"],
    computed: {
        // 分割条样式
        splitStyle() {
            return this.orient === "v"
                ? {
                      height: "100%",
                      width: this.size + "px",
                      display: "inline-block",
                      cursor: "col-resize",
                      "--split-scale-hor": "3.0",
                  }
                : {
                      width: "100%",
                      height: this.size + "px",
                      display: "block",
                      cursor: "row-resize",
                      "--split-scale-ver": "3.0",
                  };
        },
    },
    inject: {
        enablePanelInteraction: "enablePanelInteraction",
    },
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout-split {
    background-color: #7494ec;
    vertical-align: top;
    position: relative;
    z-index: 1;

    // 用代码控制以下Custom Properties改变
    --split-scale-hor: 1;
    --split-scale-ver: 1;

    transition: transform 200ms ease-in-out;

    &:hover {
        transform: scale(var(--split-scale-hor), var(--split-scale-ver));
    }
}
</style>