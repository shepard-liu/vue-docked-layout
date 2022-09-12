<template>
    <div class="docked-layout">
        <DockedLayoutNode
            class="layout-root-node"
            :layoutNode="currentLayout"
            :isRoot="true"
            :path="[]"
        >
            <slot
                v-for="(_, slotName) in $slots"
                :name="slotName"
                :slot="slotName"
            ></slot>
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

// 停靠派生的子布局结点朝向相关属性
const derivedHorizontalChildProps = {
    orient: "h",
    childSizeProp: "height",
    childMinSizeProp: "minHeight",
};
const derivedVerticalChildProps = {
    orient: "v",
    childSizeProp: "width",
    childMinSizeProp: "minWidth",
};
const dockActionOrientPropsMap = {
    above: derivedHorizontalChildProps,
    below: derivedHorizontalChildProps,
    left: derivedVerticalChildProps,
    right: derivedVerticalChildProps,
};

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
            console.log("DockedLayout: 布局树已更新", layout);
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

        const { children, orient, ...otherProps } = self.currentLayout || {};
        const provideObject = {
            // 向子组件传递布局配置
            layoutConfig: otherProps,

            /**
             * 布局更新函数
             *
             * 该函数将完全更新整个布局树，请谨慎调用。
             * @param {number[]} nodePath 结点从树根节点访问的路径
             * @param {LayoutTreeNode} newNodeLayout 该结点更新后的布局配置
             */
            updateLayoutFromNode(nodePath, newNodeLayout) {
                if (Array.isArray(nodePath)) {
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
                } else if (typeof nodePath === "number") {
                    // 对于浮动面板
                    const newRootNode = lodash.cloneDeep(self.currentLayout);
                    newRootNode.floating[nodePath] = newNodeLayout;
                    self.updateLayout(newRootNode);
                } else {
                    throw new Error(
                        "DockedLayout: updateLayoutFromNode传入nodePath类型应为Array或number"
                    );
                }
            },

            /**
             * 拖放面板到多标签页导航条
             *
             * 拖放面板到导航条和拖放面板停靠(下方的dndPanelToDockArea函数)均需要两次布局树更新完成，
             * 因传入DockedLayout的slots为用户定义的面板内容组件，需保证同一时间仅在一个面板组中存在（用户在配置对象里指定多个时除外），
             * 否则可能因为样式相关data在同一面板内容组件实例内部共享导致冲突，更新将因此进入死循环。
             *
             * @param {*} 拖拽源结点、源组件位置和目标结点、目标组件位置
             */
            dndPanelToTabNav({
                fromNodePath,
                toNodePath,
                fromComponentIndex,
                toComponentIndex,
            }) {
                // 拷贝当前的布局树
                const newRootNode = lodash.cloneDeep(self.currentLayout);

                // 获取拖拽源节点和目标结点
                const fromNode = self.getNodeLayoutFromPath(
                    newRootNode,
                    fromNodePath
                );
                const fromComponent = fromNode.components[fromComponentIndex];

                // 从源结点移除拖动的组件。若源结点不再有面板组件，则该结点将会自毁(emit 'destruct')
                fromNode.components.splice(fromComponentIndex, 1);
                fromNode.activeComponent = fromNode.components[0];

                setTimeout(() => {
                    // 第二次更新：从布局树中添加toComponent
                    const newRootNodeSecUpdate = lodash.cloneDeep(newRootNode);
                    const toNode = self.getNodeLayoutFromPath(
                        newRootNodeSecUpdate,
                        toNodePath
                    );
                    // 在目标结点的目标位置插入拖动的组件
                    toNode.components.splice(
                        toComponentIndex,
                        0,
                        fromComponent
                    );
                    toNode.activeComponent = fromComponent;
                    self.updateLayout(newRootNodeSecUpdate);
                });

                // 第一次更新：从布局树中删除fromComponent
                self.updateLayout(newRootNode);
            },

            // 拖放面板到停靠区域
            dndPanelToDockArea({
                fromNodePath,
                toNodePath,
                fromComponentIndex,
                dockArea,
            }) {
                // 若拖入面板中心，则等同于直接停靠到导航栏首位
                if (dockArea === "center") {
                    provideObject.dndPanelToTabNav({
                        fromNodePath,
                        toNodePath,
                        fromComponentIndex,
                        toComponentIndex: 0,
                    });
                    return;
                }

                // 拷贝当前的布局树
                const newRootNode = lodash.cloneDeep(self.currentLayout);

                // 获取拖拽源节点
                const fromNode = self.getNodeLayoutFromPath(
                    newRootNode,
                    fromNodePath
                );

                // 若拖入自己所在结点，且仅有一个组件
                if (
                    lodash.isEqual(fromNodePath, toNodePath) &&
                    fromNode.components.length === 1
                ) {
                    return;
                }

                const fromComponent = fromNode.components[fromComponentIndex];

                // 从源结点移除拖动的组件。若源结点不再有面板组件，则该结点将会自毁(emit 'destruct')
                fromNode.components.splice(fromComponentIndex, 1);
                fromNode.activeComponent = fromNode.components[0];

                // 第二次更新：在布局树中添加toComponent
                setTimeout(() => {
                    const newRootNodeSecUpdate = lodash.cloneDeep(newRootNode);
                    // 获取拖拽目标结点
                    const toNode = self.getNodeLayoutFromPath(
                        newRootNodeSecUpdate,
                        toNodePath
                    );

                    // 获取停靠朝向属性
                    const { orient, childSizeProp, childMinSizeProp } =
                        dockActionOrientPropsMap[dockArea];

                    // 获取目标结点的父结点
                    const toNodeParentNode =
                        toNodePath.length === 0
                            ? null
                            : self.getNodeLayoutFromPath(
                                  newRootNodeSecUpdate,
                                  toNodePath.slice(0, -1)
                              );

                    // 确定是否需要在目标结点上构建新的子布局
                    if (toNodeParentNode?.orient === orient) {
                        // 父子布局一致，且当前拖拽不是发生在根结点上(根结点此时为组件结点)，无需创建新子布局
                        const childSize = (toNode[childSizeProp] =
                            toNode[childSizeProp] / 2);
                        const childMinSize = (toNode[childMinSizeProp] =
                            toNode[childMinSizeProp] / 2);
                        // 在toNode的父节点的children中插入新的子结点
                        const insertAfter =
                            dockArea === "below" || dockArea === "right";
                        toNodeParentNode.children.splice(
                            Number(insertAfter) +
                                toNodePath[toNodePath.length - 1],
                            0,
                            {
                                [childSizeProp]: childSize,
                                [childMinSizeProp]: childMinSize,
                                components: [fromComponent],
                            }
                        );
                    } else {
                        // 父子布局不一致

                        // 创建新的组件结点（含有fromComponent）
                        const childWithFromComponent = {
                            [childSizeProp]: 50,
                            [childMinSizeProp]: 20,
                            components: [fromComponent],
                        };
                        // 复制原组件结点的组件
                        const copiedChild = {
                            [childSizeProp]: 50,
                            [childMinSizeProp]: 20,
                            components: toNode.components.concat(),
                        };
                        // 将toNode变为子布局结点
                        toNode.orient = orient;
                        delete toNode.components;

                        if (dockArea === "above" || dockArea === "left") {
                            toNode.children = [
                                childWithFromComponent,
                                copiedChild,
                            ];
                        } else {
                            toNode.children = [
                                copiedChild,
                                childWithFromComponent,
                            ];
                        }
                    }

                    self.updateLayout(newRootNodeSecUpdate);
                });
                // 第一次更新：从布局树中删除fromComponent
                self.updateLayout(newRootNode);
            },

            /**
             * 设置面板拖动数据标记
             * @param {DragEvent} event
             */
            setPanelDndDataType(event) {
                event.dataTransfer.setData(
                    "docked_layout_dnd_type",
                    "panel_dnd"
                );
            },

            /**
             * 校验面板拖动数据标记是否为本布局系统专用
             * @param {DragEvent} event
             */
            validatePanelDndDataType(event) {
                return (
                    event.dataTransfer.getData("docked_layout_dnd_type") ===
                    "panel_dnd"
                );
            },
        };
        return provideObject;
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