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
        updateLayout(layout) {
            // 检测是否为受控模式
            if (typeof this.layout === "object") {
            } else {
                this.currentLayout = layout;
            }

            this.$emit("layoutChange", layout);
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
            // 布局更新函数
            updateLayoutFromNode(nodePath, newNodeLayout) {
                const newRootNode = lodash.cloneDeep(self.currentLayout);

                // 迭代到目标结点的父结点
                let currentNode = newRootNode;
                for (let i = 0; i < nodePath.length - 1; ++i) {
                    currentNode = currentNode.children[nodePath[i]];
                }
                // 若不是根结点
                if (nodePath.length !== 0) {
                    // 使用新值覆盖原结点值
                    currentNode.children[nodePath[nodePath.length - 1]] =
                        newNodeLayout;
                    // 更新布局
                    self.updateLayout(newRootNode);
                } else {
                    self.updateLayout(newNodeLayout);
                }

                console.log("DockedLayout: 布局树已更新");
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