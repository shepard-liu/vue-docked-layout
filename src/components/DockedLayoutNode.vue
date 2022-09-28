<!-- 
    DockedLayoutNode.vue

    停靠布局结点组件

    该组件接收布局结点对象作为属性，递归地渲染该该结点为根的布局树。

    **结点类型**

    每个DockedLayoutNode组件实例根据布局结点对象的类别不同而具有不同的行为，
    若在布局结点对象中指定了components属性，则本结点为组件结点，将渲染DockedLayoutTabPanel组件;
    若在布局结点对象中指定了children属性，则本结点为子布局结点，将渲染DockedLayoutNode组件。
    对于任一DockedLayoutNode组件，同一时间只可能为叶子结点或子布局结点，同时指定components和children属性将会抛出错误。

    **结点路径码**
    
    许多情况下结点需要向DockedLayout组件通信，这是通过Provide/Inject实现的。

    为了让DockedLayout快速定位当前结点，每个结点都有一个path属性来进行定位。该数组指出了在树结构中
    从根结点到达本结点的路径，第n个元素为路径在第n层的分支路径。

    @author shepard
    @date 2022/08/31
-->

<template>
    <!-- 若为子布局结点，则渲染子结点 -->
    <div
        ref="node"
        :class="{
            'docked-layout-node': true,
            'docked-layout-node--floating': floating,
        }"
        :style="floating ? floatingNodeStyle : null"
        @mousedown="handleFloatingNodeMouseDown"
    >
        <!-- 若为浮动结点，渲染不可见的窗体伸缩条 -->
        <div
            v-if="floating && !maximized"
            v-for="resizeBar in floatingPanelResizeBars"
            :class="resizeBar.className"
            @mousedown="
                handleFloatingPanelResizeBarMouseDown($event, resizeBar)
            "
        />
        <!-- 若为浮动结点，渲染面板控件 -->
        <div
            v-if="floating"
            class="panel-topbar"
            @mousedown="handleFloatingPanelTopbarMouseDown"
        >
            <div
                class="close-panel"
                @mousedown="$event.stopPropagation()"
                @click="handleDestroyFloatingNode"
            ></div>
            <div
                class="minimize-panel"
                @mousedown="$event.stopPropagation()"
                @click="handleMinimizePanel"
            ></div>
            <div
                class="maximize-panel"
                @mousedown="$event.stopPropagation()"
                @click="handleMaximizePanel"
            ></div>
        </div>
        <!-- 若为组件结点，则渲染Tab面板 -->
        <DockedLayoutTabPanel
            v-if="isComponentNode"
            :components="layoutNodeCache?.components"
            :floating="floating"
            :activeComponent="layoutNodeCache.activeComponent"
            @activeChange="handleTabActiveChange"
            @closePanel="handleClosePanel"
            @closeOtherPanels="handleCloseOtherPanels"
            @closePanelGroup="handleClosePanelGroup"
            @floatPanel="handleFloatPanel"
            @panelDragStart="handlePanelDragStart"
            @panelDropOnNav="handlePanelDrop"
            @panelDropOnDockActionPane="handlePanelDock"
            class="tab-panel"
        >
            <slot
                v-for="component in layoutNodeCache?.components"
                :name="component"
                :slot="component"
            />
        </DockedLayoutTabPanel>
        <template v-else v-for="(child, index) in layoutNodeCache?.children">
            <DockedLayoutNode
                class="subnode"
                :style="subNodeStyles[index]"
                :layoutNode="child"
                :path="childPath(index)"
                @destruct="handleRemoveSubnode(false, index)"
                @optimizeNesting="handleOptimizeNestedChild(index)"
            >
                <slot
                    v-for="(_, slotName) in $slots"
                    :name="slotName"
                    :slot="slotName"
                />
            </DockedLayoutNode>
            <!-- 在子结点之间渲染分割条组件 -->
            <DockedLayoutSplit
                v-if="index !== layoutNodeCache?.children.length - 1"
                @splitDragStart="handleSplitDragStart(index, $event)"
                @splitDrag="handleSplitDrag(index, $event)"
                @splitDragEnd="handleSplitDragEnd(index, $event)"
                :orient="layoutNodeCache.orient"
            />
        </template>
        <!-- 若为根结点，渲染浮动面板 -->
        <DockedLayoutNode
            v-if="isRoot"
            v-for="(child, index) in layoutNodeCache?.floating"
            :floating="true"
            :key="child.id || getNextId()"
            :path="floatingNodePath(index)"
            :layoutNode="child"
            @destruct="handleRemoveSubnode(true, index)"
        >
            <slot
                v-for="(_, slotName) in $slots"
                :name="slotName"
                :slot="slotName"
            />
        </DockedLayoutNode>
    </div>
</template>

<script>
import lodash from "lodash";
import { approxEq } from "../utils";
import { uniqueId } from "../utils/uniqueId";
import DockedLayoutTabPanel from "./DockedLayoutTabPanel.vue";
import DockedLayoutSplit from "./DockedLayoutSplit.vue";
import { panelResizeBarData } from "./DockedLayoutNode.data";
import { draggingPanel, maximumFloatingPanels } from "./common.data";

// 判断属性是否被忽略
function isOmitted(value) {
    return (
        (Array.isArray(value) && value.length === 0) ||
        value === null ||
        value === undefined
    );
}
// 校验尺寸参数
function validateSize(value) {
    return typeof value === "number" && value >= 0 && value <= 100;
}

const nextId = uniqueId("__docked_layout_node_");

// 方向属性对象：由'v'或'h'获取相关属性
const orientPropsMap = {
    v: {
        mainSizeProp: "width",
        minMainSizeProp: "minWidth",
        maxMainSizeProp: "maxWidth",
        crossSizeProp: "height",
        displayStyle: "inline-block",
        splitSizeProp: "splitWidth",
        parentSizeProp: "offsetWidth",
    },
    h: {
        mainSizeProp: "height",
        minMainSizeProp: "minHeight",
        maxMainSizeProp: "maxHeight",
        crossSizeProp: "width",
        displayStyle: "block",
        splitSizeProp: "splitHeight",
        parentSizeProp: "offsetHeight",
    },
};

export default {
    name: "DockedLayoutNode",
    components: { DockedLayoutTabPanel, DockedLayoutSplit },
    props: {
        // 布局结点对象，描述布局树一个结点的属性
        layoutNode: Object,
        // 是否为根结点
        isRoot: Boolean,
        /**
         * 当前结点路径码，布局树内结点为路径序列（数组）
         * 浮动结点为结点图层位置
         */
        path: [Array, Number],
        // 是否为浮动结点
        floating: Boolean,
    },
    data() {
        return {
            // 缓存改变的layoutNode属性
            layoutNodeCache: null,
            // 更新整个布局树
            updateLayoutTree: null,
            // 节流的更新整个布局树
            throttledUpdateLayoutTree: null,
            // 子结点resize过程初始值
            childStartSizes: null,
            // 浮动面板的窗体resize控制条(数据无需拷贝，因所有结点实例都不会修改其内容)
            floatingPanelResizeBars: this.floating ? panelResizeBarData : null,
            // 浮动面板鼠标按下时是否调用bringPanelToFront置顶
            doBringToFront: true,
            // 是否最大化
            maximized: false,
        };
    },
    emits: ["destruct", "optimizeNesting"],
    methods: {
        getNextId() {
            return nextId();
        },
        // 获取子结点的路径序列
        childPath(index) {
            return [...this.path, index];
        },
        // (根结点调用)获取浮动结点的路径码
        floatingNodePath(index) {
            return index;
        },
        // 处理分隔条拖动开始事件
        handleSplitDragStart(index, _) {
            const node = this.layoutNodeCache;
            const mainSizeProp = orientPropsMap[node.orient].mainSizeProp;

            const beforeChildStartSize = node.children[index][mainSizeProp],
                afterChildStartSize = node.children[index + 1][mainSizeProp];
            // 记录本次resize过程子结点尺寸初始值
            this.childStartSizes = {
                beforeChildStartSize,
                afterChildStartSize,
            };
        },
        // 处理拖动分割条事件
        handleSplitDrag(index, event) {
            const node = this.layoutNodeCache;
            const { parentSizeProp, mainSizeProp, minMainSizeProp } =
                orientPropsMap[node.orient];
            // 获取resize开始时记录的子结点尺寸初值
            const { beforeChildStartSize, afterChildStartSize } =
                this.childStartSizes;
            // 计算与分割线相邻的两个元素的尺寸从resize过程开始到现在的改变量百分比（相对于父元素总大小）
            const percentageDelta =
                ((event.current - event.start) /
                    this.$refs.node[parentSizeProp]) *
                100;
            // 获取分割线两侧的子结点
            const beforeChild = node.children[index],
                afterChild = node.children[index + 1];
            // 应用子结点的尺寸更改
            const beforeNewSize = beforeChildStartSize + percentageDelta;
            const afterNewSize = afterChildStartSize - percentageDelta;
            // 保证两个子结点的尺寸都不小于最小尺寸值
            if (
                beforeNewSize < beforeChild[minMainSizeProp] ||
                afterNewSize < afterChild[minMainSizeProp]
            ) {
                return;
            }
            // 应用更改
            beforeChild[mainSizeProp] = beforeNewSize;
            afterChild[mainSizeProp] = afterNewSize;
        },
        // 处理拖动分割条结束事件
        handleSplitDragEnd() {
            // 更新布局树
            this.updateLayoutTree(this.layoutNodeCache);
            this.childStartSizes = null;
        },
        // 组件结点下当前激活的面板改变事件
        handleTabActiveChange(current) {
            const node = this.layoutNodeCache;
            node.activeComponent = current;
            this.updateLayoutTree(node);
        },
        // 特定面板关闭
        handleClosePanel({ _, index }) {
            const node = this.layoutNodeCache;

            // 若当前面板组内面板数量大于1
            if (node.components.length > 1) {
                node.components.splice(index, 1);
                node.activeComponent = node.components[0];

                this.updateLayoutTree(node);
            } else {
                // 移除整个面板组
                this.handleClosePanelGroup();
            }
        },
        // 关闭特定面板外的其他面板
        handleCloseOtherPanels({ _, index }) {
            const node = this.layoutNodeCache;
            node.components = node.components.slice(index, index + 1);

            this.updateLayoutTree(node);
        },
        // 关闭面板组，移除本结点
        handleClosePanelGroup() {
            this.$emit("destruct");
            // 布局树更新由父结点完成
        },
        // 浮动特定面板
        handleFloatPanel({ _, index }) {
            this.floatPanel({
                fromNodePath: this.path,
                fromComponentIndex: index,
            });
        },
        // 拖动特定面板
        handlePanelDragStart({ component, index }, event) {
            // 拖动操作的文本fallback信息
            event.dataTransfer.setData(
                "text/plain",
                `DockedLayout - Dragging Panel ${component}`
            );

            // 添加数据标记
            this.setPanelDndDataType(event);

            // 设置拖拽信息全局变量
            draggingPanel.current = {
                nodePath: this.path,
                component,
                componentIndex: index,
            };
            // 监听document的鼠标释放事件，清除拖拽信息全局变量
            const documentMouseUpListener = () => {
                draggingPanel.current = null;
                document.removeEventListener(
                    "mouseup",
                    documentMouseUpListener
                );
            };
            document.addEventListener("mouseup", documentMouseUpListener);

            // 拖动操作的数据
            event.dataTransfer.setData(
                "panel",
                JSON.stringify({
                    component,
                    // 使用结点路径唯一确定来源结点
                    nodePath: this.path,
                    // 面板的位置下标
                    componentIndex: index,
                })
            );
        },
        // 在特定的tab或tavNav上放置面板事件
        handlePanelDrop({ dropComponentIndex, dropComponent }, event) {
            const { componentIndex, nodePath } = JSON.parse(
                event.dataTransfer.getData("panel")
            );
            // 调用Inject的函数，交由DockedLayout顶层处理
            this.dndPanelToTabNav({
                fromNodePath: nodePath,
                fromComponentIndex: componentIndex,
                toNodePath: this.path,
                toComponentIndex: dropComponentIndex,
            });
        },
        // 在结点停靠面板
        handlePanelDock(area, event) {
            const { componentIndex, nodePath } = JSON.parse(
                event.dataTransfer.getData("panel")
            );

            this.dndPanelToDockArea({
                fromNodePath: nodePath,
                toNodePath: this.path,
                fromComponentIndex: componentIndex,
                dockArea: area,
            });
        },
        // 处理浮动面板resize条鼠标按下事件-在四个角和矩形边响应窗口resize
        handleFloatingPanelResizeBarMouseDown(event, { className }) {
            if (!this.floating) return;
            const node = this.layoutNodeCache;
            const nodeElem = this.$refs.node;
            // 获取窗体坐标信息、鼠标位置信息、浮动窗口结点位置初值
            const { clientX: mouseX0, clientY: mouseY0 } = event;
            const {
                top: top0,
                left: left0,
                width: width0,
                height: height0,
            } = node;
            // 定义XY两个维度上的缩放函数
            function resizeXOnLeft(deltaX, _) {
                if (node.width - deltaX < node.minWidth) return;
                node.left = left0 + deltaX;
                node.width = width0 - deltaX;
            }
            function resizeXOnRight(deltaX, _) {
                if (node.width + deltaX < node.minWidth) return;
                node.width = width0 + deltaX;
            }
            function resizeYOnTop(_, deltaY) {
                if (node.height - deltaY < node.minHeight) return;
                node.top = top0 + deltaY;
                node.height = height0 - deltaY;
            }
            function resizeYOnBottom(_, deltaY) {
                if (node.height + deltaY < node.minHeight) return;
                node.height = height0 + deltaY;
            }
            // 创建缩放类型的属性映射
            const resizePropsMap = {
                "left-resize": {
                    cursor: "ew-resize",
                    resizeFuncs: [resizeXOnLeft],
                },
                "right-resize": {
                    cursor: "ew-resize",
                    resizeFuncs: [resizeXOnRight],
                },
                "top-resize": {
                    cursor: "ns-resize",
                    resizeFuncs: [resizeYOnTop],
                },
                "bottom-resize": {
                    cursor: "ns-resize",
                    resizeFuncs: [resizeYOnBottom],
                },
                "left-top-resize": {
                    cursor: "nwse-resize",
                    resizeFuncs: [resizeXOnLeft, resizeYOnTop],
                },
                "left-bottom-resize": {
                    cursor: "nesw-resize",
                    resizeFuncs: [resizeXOnLeft, resizeYOnBottom],
                },
                "right-top-resize": {
                    cursor: "nesw-resize",
                    resizeFuncs: [resizeXOnRight, resizeYOnTop],
                },
                "right-bottom-resize": {
                    cursor: "nwse-resize",
                    resizeFuncs: [resizeXOnRight, resizeYOnBottom],
                },
            };
            // 获取当前的resize类型
            const { cursor, resizeFuncs } = resizePropsMap[className];
            // 禁用用户选择、设置鼠标指针，临时设置窗口zIndex
            this.enablePanelInteraction(false);
            document.documentElement.style.cursor = cursor;
            nodeElem.style.zIndex = "99999";
            this.doBringToFront = false;

            // 开始监听鼠标移动事件
            const documentMouseMoveListener = (ev) => {
                // 获取当前鼠标坐标
                const { clientX: mouseX, clientY: mouseY } = ev;
                // 获取当前根结点宽高
                const { clientWidth: layoutWidth, clientHeight: layoutHeight } =
                    nodeElem.parentElement;
                // 计算改变量
                const deltaX = ((mouseX - mouseX0) / layoutWidth) * 100,
                    deltaY = ((mouseY - mouseY0) / layoutHeight) * 100;
                // 应用改变
                for (const fn of resizeFuncs) {
                    fn(deltaX, deltaY);
                }
            };
            document.addEventListener("mousemove", documentMouseMoveListener);

            const documentMouseUpListener = () => {
                // 取消监听器
                document.removeEventListener(
                    "mousemove",
                    documentMouseMoveListener
                );
                document.removeEventListener(
                    "mouseup",
                    documentMouseUpListener
                );
                // 恢复用户选择和鼠标方向
                this.enablePanelInteraction(true);
                document.documentElement.style.cursor = null;
                nodeElem.style.zIndex = null;
                this.doBringToFront = true;

                // 更新布局树
                this.bringPanelToFront(this.path, node);
            };
            document.addEventListener("mouseup", documentMouseUpListener);
        },
        // 处理浮动面板顶栏鼠标按下事件-拖动面板
        handleFloatingPanelTopbarMouseDown(event) {
            const node = this.layoutNodeCache;
            // 记录鼠标按下时的坐标
            const { clientX: x0, clientY: y0 } = event;
            const top0 = node.top,
                left0 = node.left;

            this.enablePanelInteraction(false);

            // 暂停浮动面板zIndex调整
            this.doBringToFront = false;
            // 调整zIndex，置顶本结点
            if (!this.maximized) this.$refs.node.style.zIndex = "99999";

            let isMoved = false;

            const documentMouseMoveListener = (ev) => {
                const { clientX: x, clientY: y } = ev;
                const layoutElem = this.$refs.node.parentElement;
                // 获取整体布局的宽高
                const { clientWidth: layoutWidth, clientHeight: layoutHeight } =
                    layoutElem;

                node.top = top0 + ((y - y0) / layoutHeight) * 100;
                node.left = left0 + ((x - x0) / layoutWidth) * 100;

                isMoved = true;
            };
            document.addEventListener("mousemove", documentMouseMoveListener);

            const documentMouseUpListener = (ev) => {
                document.removeEventListener(
                    "mousemove",
                    documentMouseMoveListener
                );
                document.removeEventListener(
                    "mouseup",
                    documentMouseUpListener
                );
                this.enablePanelInteraction(true);

                // 恢复zIndex
                if (!this.maximized) this.$refs.node.style.zIndex = null;
                // 恢复浮动面板zIndex调整
                this.doBringToFront = true;
                if (isMoved) {
                    this.bringPanelToFront(this.path, node);
                    this.handleMaximizePanel();
                }
            };
            document.addEventListener("mouseup", documentMouseUpListener);
        },
        // 处理浮动结点鼠标按下事件
        handleFloatingNodeMouseDown() {
            if (
                this.floating === false ||
                this.doBringToFront === false ||
                this.maximized
            )
                return;
            this.bringPanelToFront(this.path);
        },
        // 处理关闭浮动面板
        handleDestroyFloatingNode(event) {
            this.$emit("destruct");
            event.stopPropagation();
        },
        handleMaximizePanel() {
            this.maximized = !this.maximized;
            this.$refs.node.style.zIndex = this.maximized ? "99999" : null;
        },
        handleMinimizePanel() {
            const node = this.layoutNodeCache;
            node.width = node.minWidth;
            node.height = node.minHeight;
            this.bringPanelToFront(this.path, node);
        },
        // 抛出异常诊断信息
        throwNodeError(msg) {
            console.error(`DockedLayoutNode`, this.layoutNode, "抛出异常");
            throw new Error(msg);
        },
        // 处理子结点移除
        handleRemoveSubnode(floating, index) {
            const node = this.layoutNodeCache;

            if (floating) {
                node.floating.splice(index, 1);
            } else {
                const { mainSizeProp } = orientPropsMap[node.orient];
                // 移除该结点并获取它的尺寸
                const removedSize = node.children.splice(index, 1)[0][mainSizeProp]; // prettier-ignore
                // 将被移除结点尺寸平均分配给其他子结点
                node.children.forEach((child) => {
                    child[mainSizeProp] += removedSize / node.children.length;
                });
                // 若本结点没有子结点，则移除本结点。根结点不受影响
                if (node.children.length === 0) {
                    this.$emit("destruct");
                    // 布局树更新由父结点完成
                    return;
                }
            }
            this.updateLayoutTree(node);
        },
        // 处理优化孤子嵌套问题
        handleOptimizeNestedChild(index) {
            const node = this.layoutNodeCache;
            const child = node.children[index];
            const grandChild = child.children[0];
            child.children = grandChild.children;
            child.components = grandChild.components;
            child.orient = grandChild.orient;
            this.updateLayoutTree(node);
        },
    },
    computed: {
        // 判断是否为组件结点
        isComponentNode() {
            return this.layoutNodeCache?.components?.length > 0;
        },
        // 子结点样式表
        subNodeStyles() {
            const node = this.layoutNodeCache;
            if (!node) return null;

            // 确定子结点尺寸属性和display样式
            const {
                mainSizeProp,
                minMainSizeProp,
                maxMainSizeProp,
                crossSizeProp,
                displayStyle,
                splitSizeProp,
            } = orientPropsMap[node.orient];

            // 计算子结点已给出的尺寸属性数值的和
            const { sz: sizeSum, minsz: minSizeSum } = node.children
                .map((c) => ({
                    sz: c[mainSizeProp],
                    minsz: c[minMainSizeProp],
                }))
                .reduce((prev, cur) => {
                    if (!validateSize(cur.minsz) || !validateSize(cur.sz)) {
                        this.throwNodeError(
                            `尺寸属性不合法: ${minMainSizeProp} = ${cur.minsz}, ${mainSizeProp} = ${cur.sz}`
                        );
                    }
                    return {
                        minsz: prev.minsz + cur.minsz,
                        sz: prev.sz + cur.sz,
                    };
                });
            // 保证尺寸和等于100%
            if (!approxEq(sizeSum, 100, 1e-10))
                this.throwNodeError(
                    `子结点尺寸和不为100%: ${mainSizeProp}的和为${sizeSum}`
                );
            // 保证最小尺寸和小于等于100%
            if (minSizeSum > 100)
                this.throwNodeError(
                    `子结点最小尺寸和不可大于100%: ${minMainSizeProp}的和为${minSizeSum}`
                );

            // 因分割线占用尺寸补偿的比例
            const avgCompensateRate =
                (node.children.length - 1) / node.children.length;
            const splitSize = this.layoutConfig[splitSizeProp] || "5px"; // 默认 5px 的分割线尺寸

            return node.children.map((child) => ({
                display: displayStyle,
                [crossSizeProp]: `100%`,
                [maxMainSizeProp]: `${
                    100 - minSizeSum + child[minMainSizeProp]
                }%`,
                [mainSizeProp]: `calc(${child[mainSizeProp]}% - ${splitSize} * ${avgCompensateRate}`,
                [minMainSizeProp]: `calc(${child[minMainSizeProp]}% - ${splitSize} * ${avgCompensateRate})`, // 未指定最小尺寸时默认为10%
            }));
        },
        // 浮动结点样式表
        floatingNodeStyle() {
            if (!this.layoutNodeCache || !this.floating) return {};
            const { top, left, width, height, minWidth, minHeight, zIndex } =
                this.layoutNodeCache;
            if (
                zIndex < 1 ||
                zIndex > maximumFloatingPanels ||
                Number.isInteger(zIndex) === false
            ) {
                this.throwNodeError(
                    `结点zIndex需要指定为1~${maximumFloatingPanels}间的整数值，该结点:${zIndex}`
                );
            }
            return {
                top: this.maximized ? "0" : `${top}%` || "0",
                left: this.maximized ? "0" : `${left}%` || "0",
                width: this.maximized ? "100%" : `${width}%` || "25%",
                height: this.maximized ? "100%" : `${height}%` || "25%",
                minWidth: `${minWidth}%` || "15%",
                minHeight: `${minHeight}%` || "15%",
                zIndex: zIndex || "1",
            };
        },
    },
    watch: {
        // 检查布局结点对象是否符合Schema
        layoutNode: {
            immediate: true,
            handler(node) {
                if (!node) return;

                const omittedChildren = isOmitted(node.children);
                const omittedComponents = isOmitted(node.components);

                // 检查是否同时指定指定children和components
                if (!omittedChildren && !omittedComponents) {
                    this.throwNodeError(
                        `布局结点不可同时指定children和components属性。`
                    );
                } else if (omittedChildren && omittedComponents) {
                    // 该结点为空结点，自毁
                    this.$emit("destruct");
                    return;
                }

                // 若为子布局结点
                if (omittedComponents) {
                    // 若为浮动结点
                    if (this.floating) {
                        this.throwNodeError("浮动布局结点不可作为子布局结点");
                    }
                    // 检查是否指定orient
                    if (node.orient === undefined)
                        this.throwNodeError("子布局结点未指定orient属性");
                    // 检查是否为孤子结点
                    if (node.children.length === 1) {
                        this.$emit("optimizeNesting", node.children);
                    }
                }

                if (this.isRoot && Array.isArray(node.floating)) {
                    // 检查浮动窗口个数是否超过上限
                    if (node.floating.length > maximumFloatingPanels) {
                        this.throwNodeError(
                            `浮动窗口数量超过上限${maximumFloatingPanels}`
                        );
                    }
                }

                // 创建缓存对象
                this.layoutNodeCache = lodash.cloneDeep(this.layoutNode);
            },
        },
    },
    created() {
        const self = this;
        // 更新整个布局树的函数
        this.updateLayoutTree = function (node) {
            self.updateLayoutFromNode(self.path, node);
        };
    },
    inject: {
        // 布局全局配置
        layoutConfig: "layoutConfig",
        // 从结点更新整个布局树
        updateLayoutFromNode: "updateLayoutFromNode",
        // 拖放面板
        dndPanelToTabNav: "dndPanelToTabNav",
        dndPanelToDockArea: "dndPanelToDockArea",
        // 设置拖动数据标记
        setPanelDndDataType: "setPanelDndDataType",
        // 校验数据标记是否为本系统提供
        validatePanelDndDataType: "validatePanelDndDataType",
        // 浮动面板
        floatPanel: "floatPanel",
        // 调整浮动面板zIndex
        bringPanelToFront: "bringPanelToFront",
        // 开关面板鼠标交互
        enablePanelInteraction: "enablePanelInteraction",
    },
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout-node {
    border: 1px solid black;
    vertical-align: top;
    position: relative;
}

.docked-layout-node--floating {
    // 覆盖.docked-layout-node的position属性
    position: absolute;

    display: flex;
    flex-direction: column;

    & > .tab-panel {
        // 这将覆盖.tab-panel的height属性，因其父元素为纵向flex容器
        flex: 1;
    }
}

.tab-panel {
    width: 100%;
    height: 100%;
}

.panel-topbar {
    height: 25px;
    padding-left: 5px;
    background: #888888;
    cursor: move;

    display: flex;
    align-items: center;
}

/**
   窗口顶栏控制按钮
*/

%panelControlBtn {
    height: 12px;
    width: 12px;
    border-radius: 999px;
    cursor: pointer;
    margin-left: 6px;
    box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.3);
}

.close-panel {
    @extend %panelControlBtn;
    background: rgb(255, 95, 87);
}

.minimize-panel {
    @extend %panelControlBtn;
    background: rgb(255, 188, 46);
}

.maximize-panel {
    @extend %panelControlBtn;
    background: rgb(43, 200, 64);
}

/**
    窗口边缘resize控制条
*/
$resizeBarSize: var(--docked-layout-panel-resize-bar-size, 5px);

%panelResizeBar {
    position: absolute;
    // 窗口resize条应在窗口上方
    z-index: 999;
}

.left-resize {
    @extend %panelResizeBar;
    top: $resizeBarSize;
    bottom: $resizeBarSize;
    left: calc(0px - $resizeBarSize);
    width: calc($resizeBarSize * 2);
    cursor: ew-resize;
}

.right-resize {
    @extend %panelResizeBar;
    top: $resizeBarSize;
    bottom: $resizeBarSize;
    right: calc(0px - $resizeBarSize);
    width: calc($resizeBarSize * 2);
    cursor: ew-resize;
}

.top-resize {
    @extend %panelResizeBar;
    top: calc(0px - $resizeBarSize);
    left: $resizeBarSize;
    right: $resizeBarSize;
    height: calc($resizeBarSize * 2);
    cursor: ns-resize;
}

.bottom-resize {
    @extend %panelResizeBar;
    bottom: calc(0px - $resizeBarSize);
    left: $resizeBarSize;
    right: $resizeBarSize;
    height: calc($resizeBarSize * 2);
    cursor: ns-resize;
}

.left-top-resize {
    @extend %panelResizeBar;
    left: calc(0px - $resizeBarSize);
    top: calc(0px - $resizeBarSize);
    width: calc($resizeBarSize * 2);
    height: calc($resizeBarSize * 2);
    cursor: nwse-resize;
}

.left-bottom-resize {
    @extend %panelResizeBar;
    left: calc(0px - $resizeBarSize);
    bottom: calc(0px - $resizeBarSize);
    width: calc($resizeBarSize * 2);
    height: calc($resizeBarSize * 2);
    cursor: nesw-resize;
}

.right-top-resize {
    @extend %panelResizeBar;
    right: calc(0px - $resizeBarSize);
    top: calc(0px - $resizeBarSize);
    width: calc($resizeBarSize * 2);
    height: calc($resizeBarSize * 2);
    cursor: nesw-resize;
}

.right-bottom-resize {
    @extend %panelResizeBar;
    right: calc(0px - $resizeBarSize);
    bottom: calc(0px - $resizeBarSize);
    width: calc($resizeBarSize * 2);
    height: calc($resizeBarSize * 2);
    cursor: nwse-resize;
}
</style>