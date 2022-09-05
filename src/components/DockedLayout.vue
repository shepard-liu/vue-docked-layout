<template>
    <div class="docked-layout">
        <DockedLayoutNode
            class="layout-root-node"
            :layoutNode="currentLayout"
            :isRoot="true"
            :path="[]">
            <slot
                v-for="(_, slotName) in $slots"
                :name="slotName"
                :slot="slotName"></slot>
        </DockedLayoutNode>
    </div>
</template>

<script>
import DockedLayoutNode from "./DockedLayoutNode.vue";
import lodash from "lodash";

// 校验布局配置对象类型
function validateLayoutObjectType(o) {
    return o === null || o === undefined || typeof o === "object";
}

export default {
    name: "DockedLayout",
    props: {
        layout: Object,
        defaultLayout: Object,
    },
    data() {
        return {
            currentLayout: null,
        };
    },
    beforeMount() {
        if (!validateLayoutObjectType(this.defaultLayout))
            throw new Error(
                "DockedLayout: defaultLayout属性必须为符合schema的配置对象",
                this.defaultLayout
            );
        this.currentLayout = this.layout || this.defaultLayout;
    },
    watch: {
        layout(val) {
            if (!validateLayoutObjectType(val))
                throw new Error(
                    "DockedLayout: layout属性必须为符合schema的配置对象",
                    val
                );
            this.currentLayout = val;
        },
    },
    methods: {
        /**
         * 更新布局树
         * @param {LayoutTreeRoot} layout
         */
        updateLayout(layout) {
            // 检测是否为受控模式
            if (typeof this.layout === "object") {
            } else {
                this.currentLayout = layout;
            }

            this.$emit("layoutChange", layout);
        },

        /**
         * 从结点路径获取结点布局配置对象引用
         * @param {number[]} path 结点路径序列，根结点为空数组
         */
        getNodeLayoutFromPath(root, path) {
            let currentNode = root;

            for (let i = 0; i < path.length; ++i) {
                currentNode = currentNode.children[path[i]];
            }

            return currentNode;
        },
    },
    mounted() {},
    // 为子结点组件提供Context
    provide() {
        const self = this;

        const { children, orient, ...otherProps } = this.currentLayout || {};
        return {
            // 向子组件传递布局配置
            layoutConfig: otherProps,

            /**
             * 布局更新函数，从特定的结点进行更新。
             *
             * 该函数将完全更新整个布局树，请谨慎调用。
             * @param {number[]} nodePath 结点从树根节点访问的路径
             * @param {LayoutTreeNode} newNodeLayout 该结点更新后的布局配置
             */
            updateLayoutFromNode(nodePath, newNodeLayout) {
                // 根节点的更新单独处理
                if (nodePath.length === 0) {
                    self.updateLayout(newNodeLayout);
                    return;
                }

                // 拷贝当前的布局树
                const newRootNode = lodash.cloneDeep(self.currentLayout);

                // 迭代到目标结点的父结点
                let currentNode = newRootNode;
                for (let i = 0; i < nodePath.length - 1; ++i) {
                    currentNode = currentNode.children[nodePath[i]];
                }

                // 使用新值覆盖原结点值
                currentNode.children[nodePath[nodePath.length - 1]] =
                    newNodeLayout;
                // 更新布局
                self.updateLayout(newRootNode);

                console.log("DockedLayout: 布局树已更新");
            },

            // 拖放面板到多标签页导航条
            dndPanelToTabNav({
                fromNodePath,
                toNodePath,
                fromComponentIndex,
                toComponentIndex,
                fromComponent,
                toComponent,
            }) {
                // 拷贝当前的布局树
                const newRootNode = lodash.cloneDeep(self.currentLayout);

                // 获取拖拽起始节点和目标结点
                const fromNode = self.getNodeLayoutFromPath(
                    newRootNode,
                    fromNodePath
                );
                const toNode = self.getNodeLayoutFromPath(
                    newRootNode,
                    toNodePath
                );

                // 若为同面板下的拖拽
                if (fromNode === toNode) {
                    toNode.components.splice(fromComponentIndex, 1);
                } else {
                    toNode.components.splice(fromComponentIndex, 1);
                }

                toNode.components.splice(toComponentIndex, 0, fromComponent);
            },
        };
    },
    emits: ["layoutChange"],
    components: { DockedLayoutNode },
};
</script>

<style scoped lang="scss">
@use "./shared.scss";

.docked-layout {
}

.layout-root-node {
    width: 100%;
    height: 100%;
}
</style>