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
    <!-- 若为组件结点，则渲染Tab面板 -->
    <DockedLayoutTabPanel
        v-if="isComponentNode"
        :components="layoutNodeCache?.components"
        :activeComponent="layoutNodeCache.activeComponent"
        @activeChange="handleTabActiveChange"
        @closePanel="handleClosePanel"
        @closeOtherPanels="handleCloseOtherPanels"
        @closePanelGroup="handleClosePanelGroup"
        @floatPanel="handleFloatPanel"
        @panelDragStart="handlePanelDragStart"
        class="docked-layout-node docked-layout-node--tab-panel">
        <slot
            v-for="component in layoutNodeCache?.components"
            :name="component"
            :slot="component" />
    </DockedLayoutTabPanel>
    <!-- 若为子布局结点，则渲染子结点 -->
    <div
        v-else
        class="docked-layout-node docked-layout-node--sublayout"
        ref="node">
        <template v-for="(child, index) in layoutNodeCache?.children">
            <DockedLayoutNode
                class="subnode"
                :style="subNodeStyles[index]"
                :layoutNode="child"
                :path="childPath(index)"
                @destruct="handleRemoveSubnode(index)">
                <slot
                    v-for="(_, slotName) in $slots"
                    :name="slotName"
                    :slot="slotName" />
            </DockedLayoutNode>
            <!-- 在子结点之间渲染分割条组件 -->
            <DockedLayoutSplit
                v-if="index !== layoutNodeCache?.children.length - 1"
                @splitDrag="handleDragSplit(index, $event)"
                :orient="layoutNodeCache.orient" />
        </template>
    </div>
</template>

<script>
import lodash from "lodash";
import { makeArray, debounce, approxEq } from "../utils";
import { uniqueId } from "../utils/uniqueId";
import DockedLayoutTabPanel from "./DockedLayoutTabPanel.vue";
import DockedLayoutSplit from "./DockedLayoutSplit.vue";

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

// 方向映射对象：将方向别名映射为'v'或'h'
const orientMap = {
    vertical: "v",
    horizontal: "h",
    v: "v",
    h: "h",
    Vertical: "v",
    Horizontal: "h",
    VERTICAL: "v",
    HORIZONTAL: "h",
};

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
        // 当前结点路径码
        path: Array,
    },
    data() {
        return {
            // 缓存改变的layoutNode属性
            layoutNodeCache: null,
            // 防抖的更新布局树函数，在inject变量准备好后可用
            debouncedUpdateLayoutFromNode: null,
        };
    },
    emits: ["destruct"],
    methods: {
        getNextId() {
            return nextId();
        },
        // 获取子结点的路径码序列
        childPath(index) {
            return [...this.path, index];
        },
        // 处理拖动分割条事件
        async handleDragSplit(index, event) {
            const node = this.layoutNodeCache;
            const { parentSizeProp, mainSizeProp, minMainSizeProp } =
                orientPropsMap[node.orient];
            // 计算与分割线相邻的两个元素的尺寸改变量
            const percentageDelta =
                (event.delta / this.$refs.node[parentSizeProp]) * 100;
            // 获取分割线两侧的子结点
            const beforeChild = node.children[index],
                afterChild = node.children[index + 1];
            // 应用子结点的尺寸更改
            const beforeNewSize = beforeChild[mainSizeProp] + percentageDelta;
            const afterNewSize = afterChild[mainSizeProp] - percentageDelta;
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
            // 请求根结点更新
            await this.debouncedUpdateLayoutFromNode(node);
        },
        // 组件结点下当前激活的面板改变事件
        async handleTabActiveChange(current) {
            const node = this.layoutNodeCache;
            node.activeComponent = current;
            await this.debouncedUpdateLayoutFromNode(node);
        },
        // 特定面板关闭
        async handleClosePanel({ _, index }) {
            const node = this.layoutNodeCache;

            // 若当前面板组内面板数量大于1
            if (node.components.length > 1) {
                node.components.splice(index, 1);
                node.activeComponent = node.components[0];

                await this.debouncedUpdateLayoutFromNode(node);
            } else {
                // 移除整个面板组
                await this.handleClosePanelGroup();
            }
        },
        // 关闭特定面板外的其他面板
        async handleCloseOtherPanels({ _, index }) {
            const node = this.layoutNodeCache;
            node.components = node.components.slice(index, index + 1);

            await this.debouncedUpdateLayoutFromNode(node);
        },
        // 关闭面板组，移除本结点
        handleClosePanelGroup() {
            this.$emit("destruct");
            // 布局树更新由父结点完成
        },
        // 浮动特定面板
        handleFloatPanel({ _, index }) {},
        // 拖动特定面板
        handlePanelDragStart({ component, index }, event) {
            // 拖动操作的文本fallback信息
            event.dataTransfer.setData(
                "text/plain",
                `DockedLayout - Dragging Panel ${component}`
            );
            // 拖动操作的数据
            event.dataTransfer.setData(
                "panel",
                JSON.stringify({
                    component,
                    fromNodeId: this.path.join(""),
                })
            );
        },
        // 抛出异常诊断信息
        throwNodeError(msg) {
            console.error(`DockedLayoutNode`, this.layoutNode, "抛出异常");
            throw new Error(msg);
        },
        // 处理子结点移除
        async handleRemoveSubnode(index) {
            const node = this.layoutNodeCache;
            const { mainSizeProp } = orientPropsMap[node.orient];
            // 移除该结点并获取它的尺寸
            const removedSize = node.children.splice(index, 1)[0][mainSizeProp]; // prettier-ignore
            // 将被移除结点尺寸平均分配给其他子结点
            node.children.forEach((child) => {
                child[mainSizeProp] += removedSize / node.children.length;
            });
            // 若本结点没有子结点，则移除本结点。根节点不受影响
            if (node.children.length === 0) {
                this.$emit("destruct");
                // 布局树更新由父结点完成
                return;
            }

            await this.debouncedUpdateLayoutFromNode(node);
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
    },
    watch: {
        // 检查布局结点对象是否符合Schema
        layoutNode: {
            immediate: true,
            handler(node) {
                if (!node) return;

                const omittedChildren = isOmitted(node.children);
                const omittedComponents = isOmitted(node.components);

                // 检查是否同时指定或同时未指定children和components
                if (omittedChildren === omittedComponents) {
                    this.throwNodeError(
                        `布局结点必须为子布局结点和组件结点中的一种`
                    );
                }

                // 若为子布局结点
                if (omittedComponents) {
                    const orient = orientMap[node.orient];
                    // 检查是否指定orient
                    if (orient === undefined)
                        this.throwNodeError(
                            "DockerLayoutNode: 子布局结点未指定orient属性"
                        );
                }

                // 创建正规化缓存对象
                const cacheNode = (this.layoutNodeCache = lodash.cloneDeep(
                    this.layoutNode
                ));
                // 正规化子布局结点
                if (cacheNode.children)
                    cacheNode.children = makeArray(cacheNode.children);
                // 正规化组件列表
                if (cacheNode.components)
                    cacheNode.components = makeArray(cacheNode.components);
                // 正规化布局结点方向
                if (cacheNode.orient)
                    cacheNode.orient = orientMap[cacheNode.orient];
            },
        },
    },
    mounted() {
        const self = this;
        // inject变量updateLayoutFromNode在created()前已准备好。debouncedUpdateLayoutFromNode函数将在防抖500ms执行更新布局树函数
        const debouncedUpdate = debounce(function (node) {
            self.updateLayoutFromNode(self.path, node);
        }, 500);
        self.debouncedUpdateLayoutFromNode = async function (node) {
            try {
                await debouncedUpdate(node);
            } catch {
                console.log("DockedLayoutNode: 布局树更新防抖触发");
            }
        };
    },
    inject: {
        // 布局全局配置
        layoutConfig: "layoutConfig",
        // 从结点更新整个布局树
        updateLayoutFromNode: "updateLayoutFromNode",
    },
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout-node {
    border: 1px solid black;
    vertical-align: top;
}

.docked-layout-node--tab-panel {
}

.docked-layout-node--sublayout {
}

.sublayout-node {
}
</style>