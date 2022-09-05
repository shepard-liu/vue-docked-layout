<template>
    <div class="docked-layout-split" :style="splitStyle" @mousedown="handleMouseDown">
    </div>
</template>

<script>
export default {
    name: 'DockedLayoutSplit',
    props: {
        // 分割条朝向
        orient: String,
    },
    methods: {
        // 在分割条上鼠标按下时记录坐标，并在document上注册鼠标事件监听器
        handleMouseDown(ev) {
            const { clientX: x0, clientY: y0 } = ev;
            const orient = this.orient;

            // 临时停用用户选择
            document.documentElement.style.userSelect = 'none';

            // 记录上一次的位置坐标
            let lastX = x0, lastY = y0;

            // document上的鼠标移动事件监听器
            const documentMouseMoveListener = (ev) => {
                const { clientX: x, clientY: y } = ev;
                this.$emit('splitDrag', orient === 'v'
                    ? {
                        origin: x0,
                        delta: x - lastX,
                        current: x
                    }
                    : {
                        origin: y0,
                        delta: y - lastY,
                        current: y
                    });
                lastX = x; lastY = y;
            };
            document.addEventListener('mousemove', documentMouseMoveListener);

            // document上的鼠标按键弹起事件监听器
            const documentMouseUpListener = () => {
                // 重新启用用户选择
                document.documentElement.style.userSelect = null;
                document.removeEventListener('mousemove', documentMouseMoveListener);
                document.removeEventListener('mouseup', documentMouseUpListener);
            };
            document.addEventListener('mouseup', documentMouseUpListener);
        },
    },
    emits: ['splitDrag'],
    computed: {
        // 分割条样式
        splitStyle() {
            return this.orient === 'v'
                ? {
                    height: '100%',
                    display: 'inline-block',
                    cursor: 'col-resize',
                }
                : {
                    width: '100%',
                    display: 'block',
                    cursor: 'row-resize',
                }
        }
    }
}
</script>

<style scoped lang="scss">
@use './shared.scss';

.docked-layout-split {
    width: 5px;
    height: 5px;
    background-color: gray;
    vertical-align: top;
}
</style>